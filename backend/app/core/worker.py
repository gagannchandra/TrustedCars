import asyncio
import json
from abc import ABC, abstractmethod
from datetime import datetime, timezone
from sqlalchemy import select
from app.db.session import AsyncSessionLocal
from app.core.models import OutboxEvent, OutboxEventStatus
from app.core.events import event_bus
from app.core.metrics import OUTBOX_QUEUE_SIZE, OUTBOX_FAILED_EVENTS
import logging

logger = logging.getLogger(__name__)


class WorkerInterface(ABC):
    @abstractmethod
    async def start(self):
        pass

    @abstractmethod
    async def stop(self):
        pass


class AsyncOutboxWorker(WorkerInterface):
    def __init__(self, poll_interval: float = 5.0):
        self.poll_interval = poll_interval
        self._running = False
        self._task = None

    async def start(self):
        if not self._running:
            self._running = True
            self._task = asyncio.create_task(self._run_loop())
            logger.info("AsyncOutboxWorker started.")

    async def stop(self):
        self._running = False
        if self._task:
            self._task.cancel()
            try:
                await self._task
            except asyncio.CancelledError:
                pass
            logger.info("AsyncOutboxWorker stopped.")

    async def _run_loop(self):
        while self._running:
            try:
                await self.update_metrics()
                await self.process_pending_events()
            except Exception as e:
                logger.error(f"Error in OutboxWorker loop: {e}")
            await asyncio.sleep(self.poll_interval)

    async def update_metrics(self):
        from sqlalchemy import func

        async with AsyncSessionLocal() as session:
            pending_count = await session.scalar(
                select(func.count()).where(
                    OutboxEvent.status == OutboxEventStatus.pending
                )
            )
            failed_count = await session.scalar(
                select(func.count()).where(
                    OutboxEvent.status == OutboxEventStatus.failed
                )
            )
            OUTBOX_QUEUE_SIZE.set(pending_count or 0)
            OUTBOX_FAILED_EVENTS.set(failed_count or 0)

    async def process_pending_events(self):
        from sqlalchemy import or_, and_
        from datetime import timedelta
        import random

        event_ids = []
        now = datetime.now(timezone.utc)
        timeout_threshold = now - timedelta(minutes=5)

        # 1. Fetch & lock events inside a transaction
        async with AsyncSessionLocal() as session:
            stmt = (
                select(OutboxEvent.id)
                .where(
                    or_(
                        OutboxEvent.status == OutboxEventStatus.pending,
                        and_(
                            OutboxEvent.status == OutboxEventStatus.processing,
                            OutboxEvent.last_attempt_at < timeout_threshold,
                        ),
                        and_(
                            OutboxEvent.status == OutboxEventStatus.failed,
                            OutboxEvent.next_retry_at <= now,
                            OutboxEvent.retry_count < OutboxEvent.max_retries,
                        ),
                    )
                )
                .order_by(OutboxEvent.created_at)
                .limit(100)
                .with_for_update(skip_locked=True)
            )

            result = await session.execute(stmt)
            event_ids = result.scalars().all()

            if not event_ids:
                return

            # Mark them as processing immediately in the SAME transaction
            for eid in event_ids:
                event = await session.get(OutboxEvent, eid)
                if event:
                    event.status = OutboxEventStatus.processing
                    event.last_attempt_at = now
                    event.retry_count += 1

            await session.commit()

        # 2. Process each event sequentially
        for eid in event_ids:
            try:
                # Open isolated session for the actual subscribers
                async with AsyncSessionLocal() as event_session:
                    event = await event_session.get(OutboxEvent, eid)
                    if not event or event.status != OutboxEventStatus.processing:
                        continue

                    payload = json.loads(event.payload)
                    subscribers = event_bus.get_subscribers(event.event_type)

                    if not subscribers:
                        event.status = OutboxEventStatus.processed
                        event.processed_at = datetime.now(timezone.utc)
                    else:
                        from app.core.context import request_id_ctx, correlation_id_ctx

                        corr_token = correlation_id_ctx.set(
                            str(event.correlation_id) if event.correlation_id else None
                        )
                        req_token = request_id_ctx.set(str(event.id))

                        from app.core.models import ProcessedEvent
                        from sqlalchemy.exc import IntegrityError

                        try:
                            # Idempotency check: Ensure we only process this event once successfully.
                            processed = ProcessedEvent(event_id=event.id)
                            event_session.add(processed)
                            await event_session.flush()

                            for callback in subscribers:
                                await callback(session=event_session, **payload)

                            event.status = OutboxEventStatus.processed
                            event.processed_at = datetime.now(timezone.utc)
                        except IntegrityError:
                            # ALREADY PROCESSED - Safely skip execution.
                            await event_session.rollback()
                            logger.info(
                                f"Event {event.id} already processed. Skipping."
                            )
                            # Still mark outbox event as processed if it was stuck
                            event.status = OutboxEventStatus.processed
                            event.processed_at = datetime.now(timezone.utc)
                            event_session.add(event)
                        finally:
                            correlation_id_ctx.reset(corr_token)
                            request_id_ctx.reset(req_token)

                    await event_session.commit()

            except Exception as e:
                logger.error(f"Failed to process event {eid}: {e}")
                # 3. Handle failure in a new session block to guarantee we save the failure state
                async with AsyncSessionLocal() as fail_session:
                    failed_event = await fail_session.get(OutboxEvent, eid)
                    if failed_event:
                        failed_event.error = str(e)
                        if failed_event.retry_count >= failed_event.max_retries:
                            failed_event.status = OutboxEventStatus.failed
                        else:
                            failed_event.status = OutboxEventStatus.failed
                            # Exponential backoff with jitter
                            jitter = random.uniform(0.8, 1.2)
                            delay_seconds = (2**failed_event.retry_count) * 10 * jitter
                            failed_event.next_retry_at = datetime.now(
                                timezone.utc
                            ) + timedelta(seconds=delay_seconds)
                        await fail_session.commit()
