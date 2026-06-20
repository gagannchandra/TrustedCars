import asyncio
import json
from abc import ABC, abstractmethod
from datetime import datetime, timezone, timedelta
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from app.db.session import AsyncSessionLocal
from app.core.models import OutboxEvent, OutboxEventStatus, ProcessedEvent
from app.core.events import event_bus
from app.core.metrics import OUTBOX_QUEUE_SIZE, OUTBOX_FAILED_EVENTS
import logging
import random

logger = logging.getLogger(__name__)


class WorkerInterface(ABC):
    @abstractmethod
    async def start(self):
        pass

    @abstractmethod
    async def stop(self):
        pass


class AsyncOutboxWorker(WorkerInterface):
    def __init__(
        self,
        poll_interval: float = 5.0,
        batch_size: int = 100,
        max_concurrency: int = 10,
    ):
        self.poll_interval = poll_interval
        self.batch_size = batch_size
        self.max_concurrency = max_concurrency
        self._running = False
        self._task: asyncio.Task | None = None

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
            except asyncio.CancelledError:
                raise
            except Exception as e:
                logger.exception("Error in OutboxWorker loop: %s", e)
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

        now = datetime.now(timezone.utc)
        timeout_threshold = now - timedelta(minutes=5)

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
                .limit(self.batch_size)
                .with_for_update(skip_locked=True)
            )

            result = await session.execute(stmt)
            event_ids = list(result.scalars().all())

            if not event_ids:
                return

            for eid in event_ids:
                event = await session.get(OutboxEvent, eid)
                if event:
                    event.status = OutboxEventStatus.processing
                    event.last_attempt_at = now

            await session.commit()

        semaphore = asyncio.Semaphore(self.max_concurrency)

        async def process_with_limit(event_id):
            async with semaphore:
                await self._process_event_with_failure_handling(event_id)

        await asyncio.gather(*(process_with_limit(eid) for eid in event_ids))

    async def _process_event_with_failure_handling(self, event_id):
        try:
            await self._process_event(event_id)
        except asyncio.CancelledError:
            raise
        except Exception as e:
            logger.exception("Failed to process event %s: %s", event_id, e)
            await self._record_failure(event_id, e)

    async def _process_event(self, event_id):
        async with AsyncSessionLocal() as event_session:
            async with event_session.begin():
                event = await event_session.get(OutboxEvent, event_id)
                if not event or event.status != OutboxEventStatus.processing:
                    return

                payload = json.loads(event.payload)
                subscribers = event_bus.get_subscribers(event.event_type)

                if not subscribers:
                    self._mark_processed(event)
                    return

                from app.core.context import request_id_ctx, correlation_id_ctx

                corr_token = correlation_id_ctx.set(
                    str(event.correlation_id) if event.correlation_id else None
                )
                req_token = request_id_ctx.set(str(event.id))

                try:
                    is_first_processing = await self._insert_processed_event(
                        event_session, event.id
                    )
                    if not is_first_processing:
                        logger.info("Event %s already processed. Skipping.", event.id)
                        self._mark_processed(event)
                        return

                    for callback in subscribers:
                        async with event_session.begin_nested():
                            await callback(session=event_session, **payload)

                    self._mark_processed(event)
                finally:
                    correlation_id_ctx.reset(corr_token)
                    request_id_ctx.reset(req_token)

    async def _insert_processed_event(self, session, event_id) -> bool:
        try:
            async with session.begin_nested():
                session.add(ProcessedEvent(event_id=event_id))
                await session.flush()
        except IntegrityError:
            return False
        return True

    def _mark_processed(self, event: OutboxEvent) -> None:
        event.status = OutboxEventStatus.processed
        event.processed_at = datetime.now(timezone.utc)
        event.error = None
        event.next_retry_at = None

    async def _record_failure(self, event_id, error: Exception) -> None:
        async with AsyncSessionLocal() as fail_session:
            failed_event = await fail_session.get(OutboxEvent, event_id)
            if not failed_event:
                return

            failed_event.error = str(error)
            failed_event.status = OutboxEventStatus.failed
            failed_event.retry_count += 1
            if failed_event.retry_count >= failed_event.max_retries:
                failed_event.next_retry_at = None
            else:
                jitter = random.uniform(0.8, 1.2)
                delay_seconds = (2**failed_event.retry_count) * 10 * jitter
                failed_event.next_retry_at = datetime.now(timezone.utc) + timedelta(
                    seconds=delay_seconds
                )
            await fail_session.commit()
