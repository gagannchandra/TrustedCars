import pytest
import uuid
from app.modules.auth.models import User
from app.modules.reviews.models import Review
from app.core.models import DeletedReason


@pytest.mark.asyncio
async def test_review_moderation(
    async_client, admin_token_headers, setup_db, admin_user
):
    r_user = User(
        email=f"r_{uuid.uuid4()}@test.com", hashed_password="pw", full_name="R"
    )
    s_user = User(
        email=f"s_{uuid.uuid4()}@test.com", hashed_password="pw", full_name="S"
    )
    setup_db.add_all([r_user, s_user])
    await setup_db.flush()

    from app.modules.cars.models import (
        Car,
        FuelTypeEnum,
        TransmissionEnum,
        BodyTypeEnum,
    )

    car = Car(
        user_id=s_user.id,
        make="M",
        model="M",
        year=2020,
        fuel_type=FuelTypeEnum.petrol,
        transmission=TransmissionEnum.automatic,
        body_type=BodyTypeEnum.sedan,
        odometer_km=10,
        asking_price=10,
        city="C",
        state="S",
    )
    setup_db.add(car)
    await setup_db.flush()

    review = Review(
        reviewer_id=r_user.id,
        seller_id=s_user.id,
        car_id=car.id,
        rating=5,
        comment="Great",
    )
    setup_db.add(review)
    await setup_db.commit()

    # Delete
    res = await async_client.delete(
        f"/api/v1/admin/reviews/{review.id}", headers=admin_token_headers
    )
    assert res.status_code == 200

    await setup_db.refresh(review)
    assert review.deleted_at is not None
    assert review.deleted_reason == DeletedReason.admin_action

    # Restore
    res2 = await async_client.post(
        f"/api/v1/admin/reviews/{review.id}/restore", headers=admin_token_headers
    )
    assert res2.status_code == 200

    await setup_db.refresh(review)
    assert review.deleted_at is None
    assert review.deleted_reason is None
