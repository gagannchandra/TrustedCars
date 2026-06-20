import pytest
import uuid
from app.modules.auth.models import User, RoleEnum
from app.modules.cars.models import (
    Car,
    CarStatusEnum,
    FuelTypeEnum,
    TransmissionEnum,
    BodyTypeEnum,
)


@pytest.mark.asyncio
async def test_car_moderation_flow(async_client, admin_token_headers, setup_db):
    user = User(
        email=f"user_{uuid.uuid4()}@test.com",
        hashed_password="pw",
        full_name="User",
        role=RoleEnum.user,
    )
    setup_db.add(user)
    await setup_db.commit()

    car = Car(
        user_id=user.id,
        make="Honda",
        model="Civic",
        year=2021,
        fuel_type=FuelTypeEnum.petrol,
        transmission=TransmissionEnum.automatic,
        body_type=BodyTypeEnum.sedan,
        odometer_km=5000,
        asking_price=22000,
        city="LA",
        state="CA",
        status=CarStatusEnum.pending,
    )
    setup_db.add(car)
    await setup_db.commit()

    # Approve
    res = await async_client.post(
        f"/api/v1/admin/cars/{car.id}/approve",
        json={"reason": "looks good"},
        headers=admin_token_headers,
    )
    assert res.status_code == 200

    await setup_db.refresh(car)
    assert car.status == CarStatusEnum.active
    assert car.moderation_status == "approved"

    # Hide
    res2 = await async_client.post(
        f"/api/v1/admin/cars/{car.id}/hide",
        json={"reason": "suspicious"},
        headers=admin_token_headers,
    )
    assert res2.status_code == 200

    await setup_db.refresh(car)
    assert car.moderation_status == "hidden"
    assert car.previous_moderation_status == "approved"

    # Restore
    res3 = await async_client.post(
        f"/api/v1/admin/cars/{car.id}/restore",
        json={"reason": "fixed"},
        headers=admin_token_headers,
    )
    assert res3.status_code == 200

    await setup_db.refresh(car)
    assert car.moderation_status == "approved"
    assert car.previous_moderation_status is None
    assert car.status == CarStatusEnum.active

    # Verify Outbox
    from app.core.models import OutboxEvent
    from sqlalchemy import select

    stmt = select(OutboxEvent).where(
        OutboxEvent.event_type.in_(["CAR_APPROVED", "CAR_HIDDEN", "CAR_RESTORED"])
    )
    events = (await setup_db.execute(stmt)).scalars().all()
    event_types = [e.event_type for e in events]
    assert "CAR_APPROVED" in event_types
    assert "CAR_HIDDEN" in event_types
    assert "CAR_RESTORED" in event_types
