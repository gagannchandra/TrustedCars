import pytest
import uuid
from app.modules.auth.models import User, RoleEnum
from app.modules.cars.models import Car, FuelTypeEnum, TransmissionEnum, BodyTypeEnum


@pytest.mark.asyncio
async def test_moderate_car_hierarchy_protection(
    async_client, admin_token_headers, setup_db
):
    super_admin = User(
        email=f"super_{uuid.uuid4()}@test.com",
        hashed_password="pw",
        full_name="SuperAdmin",
        role=RoleEnum.admin,
    )
    setup_db.add(super_admin)
    await setup_db.commit()

    car = Car(
        user_id=super_admin.id,
        make="Toyota",
        model="Camry",
        year=2020,
        asking_price=20000,
        fuel_type=FuelTypeEnum.petrol,
        transmission=TransmissionEnum.automatic,
        body_type=BodyTypeEnum.sedan,
        odometer_km=10000,
        city="NY",
        state="NY",
    )
    setup_db.add(car)
    await setup_db.commit()

    res = await async_client.post(
        f"/api/v1/admin/cars/{car.id}/reject",
        json={"reason": "test"},
        headers=admin_token_headers,
    )
    assert res.status_code == 403
    assert "hierarchy" in res.json()["detail"].lower()
