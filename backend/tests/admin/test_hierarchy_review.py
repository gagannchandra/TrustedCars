import pytest
import uuid
from app.modules.auth.models import User, RoleEnum
from app.modules.cars.models import Car, FuelTypeEnum, TransmissionEnum, BodyTypeEnum
from app.modules.reviews.models import Review


@pytest.mark.asyncio
async def test_delete_review_hierarchy_protection(
    async_client, admin_token_headers, setup_db
):
    super_admin = User(
        email=f"super_{uuid.uuid4()}@test.com",
        hashed_password="pw",
        full_name="SuperAdmin",
        role=RoleEnum.admin,
    )
    target = User(
        email=f"target_{uuid.uuid4()}@test.com",
        hashed_password="pw",
        full_name="Target",
        role=RoleEnum.user,
    )
    setup_db.add_all([super_admin, target])
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

    review = Review(
        reviewer_id=target.id,
        seller_id=super_admin.id,
        car_id=car.id,
        rating=5,
        comment="test",
    )
    setup_db.add(review)
    await setup_db.commit()

    res = await async_client.delete(
        f"/api/v1/admin/reviews/{review.id}", headers=admin_token_headers
    )
    assert res.status_code == 403
    assert "hierarchy" in res.json()["detail"].lower()
