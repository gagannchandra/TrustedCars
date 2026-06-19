import pytest
import uuid
import datetime
from app.modules.reviews.service import ReviewsService
from app.shared.exceptions.handlers import CustomException
from app.core.models import DeletedReason
from app.modules.auth.models import User, RoleEnum


@pytest.mark.asyncio
async def test_review_restore_safety(setup_db):
    session = setup_db
    service = ReviewsService(session)
    admin = User(
        id=uuid.uuid4(),
        email=f"admin_{uuid.uuid4()}@test.com",
        hashed_password="pw",
        full_name="Admin",
        role=RoleEnum.admin,
    )
    session.add(admin)
    await session.flush()

    # We will just test the logic inside the service mock or create a real review.
    # Because we don't have a fully seeded DB here, we'll just check if the exceptions are raised.
    # Creating a dummy review in DB
    from app.modules.reviews.models import Review
    from app.modules.cars.models import Car

    # Create test users
    reviewer = User(
        email=f"rev_{uuid.uuid4()}@test.com", hashed_password="pw", full_name="Rev"
    )
    seller = User(
        email=f"sell_{uuid.uuid4()}@test.com", hashed_password="pw", full_name="Sell"
    )
    session.add_all([reviewer, seller])
    await session.flush()

    # Create test car
    car = Car(
        make="Test",
        model="Model",
        year=2020,
        fuel_type="petrol",
        transmission="manual",
        body_type="sedan",
        odometer_km=1000,
        asking_price=10000,
        city="City",
        state="State",
        user_id=seller.id,
    )
    session.add(car)
    await session.flush()

    review = Review(
        reviewer_id=reviewer.id,
        seller_id=seller.id,
        car_id=car.id,
        rating=5,
        comment="Great",
    )
    review.deleted_at = datetime.datetime(2026, 1, 1, tzinfo=datetime.timezone.utc)
    review.deleted_reason = DeletedReason.user_request
    session.add(review)
    await session.flush()

    # Test 1: Restore should fail because it was deleted by user_request
    with pytest.raises(CustomException) as exc:
        await service.restore_review(review.id, admin)
    assert "Cannot restore review deleted due to" in str(exc.value.detail)

    # Test 2: Restore should succeed if deleted by admin_action
    review.deleted_reason = DeletedReason.admin_action
    await session.flush()

    review_id = review.id
    await service.restore_review(review_id, admin)

    restored = await service.get_review(review_id)
    assert restored.deleted_at is None
    assert restored.deleted_reason is None
