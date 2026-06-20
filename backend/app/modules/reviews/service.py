from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.exc import IntegrityError
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from uuid import UUID
from datetime import datetime, timezone
from app.modules.reviews.repository import ReviewsRepository
from app.modules.reviews.models import Review
from app.modules.reviews.schemas import ReviewCreate, ReviewUpdate
from app.modules.cars.models import Car
from app.modules.auth.models import User
from app.shared.audit.service import AuditService
from app.shared.exceptions.handlers import CustomException
from app.core.events import event_bus


class ReviewsService:
    def __init__(self, session: AsyncSession):
        self.repository = ReviewsRepository(session)
        self.session = session

    async def _log_audit(
        self,
        user_id: UUID,
        action: str,
        target_id: UUID | None = None,
        reason: str | None = None,
        details: str = "",
    ):
        await AuditService(self.session).log_action(
            user_id, action, target_id, reason, details
        )

    async def _verify_access(self, review: Review, current_user: User, check_ownership: bool):
        if not check_ownership:
            return
        from app.shared.rbac.dependencies import assert_can_edit_resource
        await assert_can_edit_resource(
            current_user=current_user,
            owner_user_ids=review.reviewer_id,
            resource_name="review",
        )

    async def _get_seller_from_car(self, car_id: UUID) -> User | None:
        car = await self.session.scalar(
            select(Car)
            .where(Car.id == car_id, Car.deleted_at.is_(None))
        )
        if not car:
            return None

        seller_id = car.user_id
        if not seller_id and car.dealership_id:
            from app.modules.auth.models import Dealership
            dealership = await self.session.scalar(
                select(Dealership).where(Dealership.id == car.dealership_id, Dealership.deleted_at.is_(None))
            )
            if dealership:
                seller_id = dealership.user_id

        if not seller_id:
            return None

        seller = await self.session.scalar(
            select(User).where(User.id == seller_id, User.deleted_at.is_(None))
        )
        return seller

    async def create_review(self, req: ReviewCreate, current_user: User) -> Review:
        seller = await self._get_seller_from_car(req.car_id)
        if not seller:
            raise CustomException(404, "Car or seller not found, or deleted")

        if seller.id == current_user.id:
            raise CustomException(400, "Cannot leave a review for yourself")

        existing = await self.repository.get_review_by_reviewer_seller_car(
            current_user.id, seller.id, req.car_id
        )
        if existing:
            if existing.deleted_at is None:
                raise CustomException(400, "Review already exists for this car/seller")

            existing.rating = req.rating
            existing.comment = req.comment
            existing.deleted_at = None
            existing.created_at = datetime.now(timezone.utc)
            existing.updated_at = datetime.now(timezone.utc)

            try:
                await self.repository.update_review(existing)
                await self.repository.update_seller_aggregate(seller.id)

                await self._log_audit(
                    current_user.id,
                    "RESTORE_REVIEW",
                    existing.id,
                    None,
                    f"Restored review {existing.id} for seller {seller.id}",
                )
                await event_bus.publish(
                    "REVIEW_CREATED",
                    session=self.session,
                    review_id=existing.id,
                    seller_id=seller.id,
                )
                await self.session.commit()
            except IntegrityError:
                await self.session.rollback()
                raise CustomException(
                    400, "Failed to restore review due to constraint violation"
                )
            return existing

        review = Review(
            reviewer_id=current_user.id,
            seller_id=seller.id,
            car_id=req.car_id,
            rating=req.rating,
            comment=req.comment,
        )

        try:
            await self.repository.create_review(review)
            await self.repository.update_seller_aggregate(seller.id)

            await self._log_audit(
                current_user.id,
                "CREATE_REVIEW",
                review.id,
                None,
                f"Created review {review.id} for seller {seller.id}",
            )
            await event_bus.publish(
                "REVIEW_CREATED",
                session=self.session,
                review_id=review.id,
                seller_id=seller.id,
            )
            await self.session.commit()
        except IntegrityError:
            await self.session.rollback()
            raise CustomException(
                400, "Review already exists for this car/seller or constraint violated"
            )

        return review

    async def update_review(
        self,
        review_id: UUID,
        req: ReviewUpdate,
        current_user: User,
        check_ownership: bool = True,
    ) -> Review:
        review = await self.repository.get_review_by_id(review_id)
        if not review:
            raise CustomException(404, "Review not found")
            
        if review.deleted_at is not None:
            raise CustomException(400, "Cannot update a deleted review")

        await self._verify_access(review, current_user, check_ownership)

        review.rating = req.rating
        review.comment = req.comment
        review.updated_at = datetime.now(timezone.utc)

        try:
            await self.repository.update_review(review)
            await self.repository.update_seller_aggregate(review.seller_id)

            await self._log_audit(
                current_user.id,
                "UPDATE_REVIEW",
                review.id,
                None,
                f"Updated review {review.id}",
            )
            await event_bus.publish(
                "REVIEW_UPDATED",
                session=self.session,
                review_id=review.id,
                seller_id=review.seller_id,
            )
            await self.session.commit()
        except IntegrityError:
            await self.session.rollback()
            raise CustomException(400, "Database constraint violated during update")

        return review

    async def delete_review(
        self, review_id: UUID, current_user: User, check_ownership: bool = True
    ):
        review = await self.repository.get_review_by_id(review_id)
        if not review:
            raise CustomException(404, "Review not found")

        await self._verify_access(review, current_user, check_ownership)

        review.deleted_at = datetime.now(timezone.utc)
        try:
            await self.repository.update_review(review)
            await self.repository.update_seller_aggregate(review.seller_id)

            await self._log_audit(
                current_user.id,
                "DELETE_REVIEW",
                review.id,
                None,
                f"Deleted review {review.id}",
            )
            await event_bus.publish(
                "REVIEW_DELETED",
                session=self.session,
                review_id=review.id,
                seller_id=review.seller_id,
            )
            await self.session.commit()
        except IntegrityError:
            await self.session.rollback()
            raise CustomException(400, "Database constraint violated during delete")

    async def restore_review(self, review_id: UUID, current_admin: User):
        from app.core.models import DeletedReason

        review = await self.repository.get_review_by_id(review_id, include_deleted=True)
        if not review:
            raise CustomException(404, "Review not found")

        if review.deleted_at is None:
            raise CustomException(400, "Review is not deleted")

        if review.deleted_reason != DeletedReason.admin_action:
            raise CustomException(
                400, f"Cannot restore review deleted due to {review.deleted_reason}"
            )

        review.deleted_at = None
        review.deleted_reason = None
        review.deleted_by = None

        try:
            await self.repository.update_review(review)
            await self.repository.update_seller_aggregate(review.seller_id)

            await self._log_audit(
                current_admin.id,
                "RESTORE_REVIEW",
                review.id,
                None,
                f"Restored review {review.id}",
            )
            await event_bus.publish(
                "REVIEW_RESTORED",
                session=self.session,
                review_id=review.id,
                seller_id=review.seller_id,
            )
            await self.session.commit()
        except IntegrityError:
            await self.session.rollback()
            raise CustomException(400, "Database constraint violated during restore")

    async def get_review(
        self, review_id: UUID, current_user: User | None = None
    ) -> Review:
        review = await self.repository.get_review_by_id(review_id)
        if not review:
            raise CustomException(404, "Review not found")
        return review

    async def list_seller_reviews(
        self, seller_id: UUID, cursor: datetime | None, limit: int
    ) -> dict:
        total = await self.repository.count_seller_reviews(seller_id)
        items = await self.repository.list_seller_reviews(seller_id, cursor, limit)
        return {
            "items": items,
            "total": total,
            "next_cursor": items[-1].created_at if items else None,
        }

    async def handle_user_deleted(self, user_id: UUID):
        from sqlalchemy import update, select
        from datetime import datetime, timezone

        now = datetime.now(timezone.utc)

        # 1. Soft delete reviews written by the user
        stmt = select(Review.seller_id).where(
            Review.reviewer_id == user_id, Review.deleted_at.is_(None)
        )
        result = await self.session.execute(stmt)
        seller_ids = set(result.scalars().all())

        if seller_ids:
            upd = (
                update(Review)
                .where(Review.reviewer_id == user_id, Review.deleted_at.is_(None))
                .values(deleted_at=now)
            )
            await self.session.execute(upd)
            for sid in seller_ids:
                await self.repository.update_seller_aggregate(sid)

        # 2. Soft delete reviews written FOR the user (if user was a seller)
        # Note: If seller is deleted, their aggregate doesn't matter much since they are gone,
        # but for integrity, we soft delete those reviews too.
        upd2 = (
            update(Review)
            .where(Review.seller_id == user_id, Review.deleted_at.is_(None))
            .values(deleted_at=now)
        )
        await self.session.execute(upd2)

    async def handle_car_deleted(self, car_id: UUID):
        from sqlalchemy import update, select
        from datetime import datetime, timezone

        now = datetime.now(timezone.utc)

        stmt = select(Review.seller_id).where(
            Review.car_id == car_id, Review.deleted_at.is_(None)
        )
        result = await self.session.execute(stmt)
        seller_ids = set(result.scalars().all())

        if seller_ids:
            upd = (
                update(Review)
                .where(Review.car_id == car_id, Review.deleted_at.is_(None))
                .values(deleted_at=now)
            )
            await self.session.execute(upd)
            for sid in seller_ids:
                await self.repository.update_seller_aggregate(sid)

    async def handle_cars_bulk_deleted(self, car_ids: list[str]):
        if not car_ids:
            return
        from sqlalchemy import update, select
        from datetime import datetime, timezone

        now = datetime.now(timezone.utc)

        car_uuids = [UUID(cid) for cid in car_ids]
        chunk_size = 1000
        seller_ids: set[UUID] = set()

        for i in range(0, len(car_uuids), chunk_size):
            chunk = car_uuids[i : i + chunk_size]
            stmt = select(Review.seller_id).where(
                Review.car_id.in_(chunk), Review.deleted_at.is_(None)
            )
            result = await self.session.execute(stmt)
            seller_ids.update(result.scalars().all())

            upd = (
                update(Review)
                .where(Review.car_id.in_(chunk), Review.deleted_at.is_(None))
                .values(deleted_at=now)
            )
            await self.session.execute(upd)
            
        for sid in seller_ids:
            await self.repository.update_seller_aggregate(sid)
