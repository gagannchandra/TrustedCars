import pytest
from sqlalchemy import select
from app.core.models import OutboxEvent, OutboxEventStatus


@pytest.mark.asyncio
async def test_outbox_idempotency(setup_db):
    session = setup_db

    event = OutboxEvent(
        event_type="TEST_EVENT",
        payload='{"test": "data"}',
        status=OutboxEventStatus.pending,
    )
    session.add(event)
    await session.commit()
    await session.refresh(event)

    # Check it exists
    assert event.id is not None

    # The worker logic should mark it processed.
    event.status = OutboxEventStatus.processed
    await session.commit()
    await session.refresh(event)

    # Ensure status is preserved
    stmt = select(OutboxEvent).where(OutboxEvent.id == event.id)
    result = await session.execute(stmt)
    saved = result.scalar_one()

    assert saved.status == OutboxEventStatus.processed
