import pytest
import uuid
from app.modules.auth.models import User, Dealership, RoleEnum
from app.modules.cars.models import (
    Car,
    CarStatusEnum,
    FuelTypeEnum,
    TransmissionEnum,
    BodyTypeEnum,
)


@pytest.mark.asyncio
async def test_dealer_inventory_hide_restore(
    async_client, admin_token_headers, setup_db
):
    dealer_user = User(
        email=f"du_{uuid.uuid4()}@test.com",
        hashed_password="pw",
        full_name="Dealer",
        role=RoleEnum.dealer,
    )
    setup_db.add(dealer_user)
    await setup_db.flush()

    dealership = Dealership(user_id=dealer_user.id, name="Auto", address="123")
    setup_db.add(dealership)
    await setup_db.flush()

    car = Car(
        user_id=dealer_user.id,
        dealership_id=dealership.id,
        make="Toyota",
        model="Camry",
        year=2020,
        fuel_type=FuelTypeEnum.petrol,
        transmission=TransmissionEnum.automatic,
        body_type=BodyTypeEnum.sedan,
        odometer_km=10000,
        asking_price=20000,
        city="NY",
        state="NY",
        status=CarStatusEnum.active,
        moderation_status="approved",
    )
    setup_db.add(car)
    await setup_db.commit()

    # Suspend
    res = await async_client.post(
        f"/api/v1/admin/dealers/{dealership.id}/suspend",
        json={"reason": "fraud"},
        headers=admin_token_headers,
    )
    assert res.status_code == 200

    await setup_db.refresh(dealership)
    await setup_db.refresh(car)
    assert dealership.is_suspended is True
    assert car.moderation_status == "hidden"
    assert car.previous_moderation_status == "approved"
    assert car.status == CarStatusEnum.active  # Lifecycle status unchanged

    # Restore
    res2 = await async_client.post(
        f"/api/v1/admin/dealers/{dealership.id}/restore", headers=admin_token_headers
    )
    assert res2.status_code == 200

    await setup_db.refresh(dealership)
    await setup_db.refresh(car)
    assert dealership.is_suspended is False
    assert car.moderation_status == "approved"
    assert car.previous_moderation_status is None


@pytest.mark.asyncio
async def test_delete_dealer_success(
    async_client, admin_token_headers, setup_db, admin_user
):
    dealer_user = User(
        email=f"du2_{uuid.uuid4()}@test.com",
        hashed_password="pw",
        full_name="Dealer",
        role=RoleEnum.dealer,
    )
    setup_db.add(dealer_user)
    await setup_db.flush()

    dealership = Dealership(user_id=dealer_user.id, name="Auto Delete", address="123")
    setup_db.add(dealership)
    await setup_db.commit()

    res = await async_client.delete(
        f"/api/v1/admin/dealers/{dealership.id}", headers=admin_token_headers
    )
    assert res.status_code == 200

    await setup_db.refresh(dealership)
    assert dealership.deleted_at is not None
    assert dealership.deleted_reason.value == "admin_action"
    assert dealership.deleted_by == admin_user.id

    from app.shared.audit.models import AuditLog
    from app.core.models import OutboxEvent
    from sqlalchemy import select

    audit = (
        await setup_db.execute(
            select(AuditLog).where(
                AuditLog.target_id == dealership.id, AuditLog.action == "DEALER_DELETED"
            )
        )
    ).scalar_one_or_none()
    assert audit is not None
    assert audit.user_id == admin_user.id

    ob = (
        (
            await setup_db.execute(
                select(OutboxEvent).where(OutboxEvent.event_type == "DEALER_DELETED")
            )
        )
        .scalars()
        .all()
    )
    assert len(ob) > 0
