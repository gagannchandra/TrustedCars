from typing import Callable, Dict, List
import json
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.models import OutboxEvent


class EventBus:
    def __init__(self):
        # We still keep _subscribers so the Worker can discover them by event_type.
        self._subscribers: Dict[str, List[Callable]] = {}

    def subscribe(self, event_type: str, callback: Callable):
        if event_type not in self._subscribers:
            self._subscribers[event_type] = []
        self._subscribers[event_type].append(callback)

    def get_subscribers(self, event_type: str) -> List[Callable]:
        return self._subscribers.get(event_type, [])

    async def publish(self, event_type: str, session: AsyncSession, **kwargs):
        from app.core.context import request_id_ctx, correlation_id_ctx
        import uuid

        req_id_str = request_id_ctx.get()
        corr_id_str = correlation_id_ctx.get()

        # In a cascade, the worker executing an event uses that event's ID as the next causation_id.
        # But we don't have that context in the worker yet unless we pass it.
        # For now, causation_id can be the request_id or we can leave it empty unless explicitly set.
        # Wait, the instruction says "Automatically populate causation_id". If it's from a request, the request_id IS the cause. If it's a worker, the worker will set request_id_ctx to its current event ID.

        corr_id = uuid.UUID(corr_id_str) if corr_id_str else None
        causation_id = uuid.UUID(req_id_str) if req_id_str else None

        payload = json.dumps(kwargs, default=str)
        outbox_event = OutboxEvent(
            event_type=event_type,
            payload=payload,
            correlation_id=corr_id,
            causation_id=causation_id,
        )
        session.add(outbox_event)
        # The event will be committed alongside the publisher's transaction.


# Global instance
event_bus = EventBus()
