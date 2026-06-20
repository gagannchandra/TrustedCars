import uuid
from datetime import datetime, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.modules.auth.models import User, Dealership
from app.modules.cars.models import Car, CarStatusEnum, ModerationStatusEnum
from app.modules.reviews.models import Review
from app.modules.inquiries.models import Inquiry, InquiryStatusEnum
from app.shared.audit.service import AuditService
from app.core.events import event_bus
from app.shared.exceptions.handlers import CustomException
from app.shared.rbac.hierarchy import can_moderate
from app.core.models import DeletedReason


class AdminModerationService:
    def __init__(self, session: AsyncSession):
        self.session = session
        self.audit_service = AuditService(session)

    async def _dispatch_and_audit(
        self,
        actor_id: uuid.UUID,
        target_id: uuid.UUID,
        action: str,
        event_type: str,
        reason: str | None = None,
        details: str = "",
        **event_payload,
    ):
        # Write Audit
        await self.audit_service.log_action(
            actor_id, action, target_id, reason, details
        )
        # Write Outbox Event
        await event_bus.publish(
            event_type,
            session=self.session,
            target_id=str(target_id),
            actor_id=str(actor_id),
            reason=reason,
            **event_payload,
        )

    # ------------------
    # USERS
    # ------------------
    async def suspend_user(self, actor: User, target_id: uuid.UUID, reason: str):
        target = await self.session.get(User, target_id)
        if not target:
            raise CustomException(404, "User not found")

        if not can_moderate(actor, target):
            raise CustomException(
                403, "Cannot moderate this user due to role hierarchy"
            )

        target.is_suspended = True

        try:
            await self._dispatch_and_audit(
                actor.id,
                target.id,
                "USER_SUSPENDED",
                "USER_SUSPENDED",
                reason,
                "Admin suspended user",
            )
            await self.session.commit()
        except Exception as e:
            await self.session.rollback()
            import structlog
            structlog.get_logger(__name__).error("Failed to suspend user", error=str(e), exc_info=True)
            raise CustomException(500, "An internal error occurred. Please try again.")

    async def restore_user(self, actor: User, target_id: uuid.UUID):
        target = await self.session.get(User, target_id)
        if not target:
            raise CustomException(404, "User not found")

        if not can_moderate(actor, target):
            raise CustomException(
                403, "Cannot moderate this user due to role hierarchy"
            )

        target.is_suspended = False

        try:
            await self._dispatch_and_audit(
                actor.id,
                target.id,
                "USER_RESTORED",
                "USER_RESTORED",
                None,
                "Admin restored user",
            )
            await self.session.commit()
        except Exception as e:
            await self.session.rollback()
            import structlog
            structlog.get_logger(__name__).error("Failed to restore user", error=str(e), exc_info=True)
            raise CustomException(500, "An internal error occurred. Please try again.")

    async def delete_user(self, actor: User, target_id: uuid.UUID):
        target = await self.session.get(User, target_id)
        if not target:
            raise CustomException(404, "User not found")

        if not can_moderate(actor, target):
            raise CustomException(
                403, "Cannot moderate this user due to role hierarchy"
            )

        target.deleted_at = datetime.now(timezone.utc)
        target.deleted_reason = DeletedReason.admin_action
        target.deleted_by = actor.id

        try:
            await self._dispatch_and_audit(
                actor.id,
                target.id,
                "USER_DELETED",
                "USER_SOFT_DELETED",
                "Admin deletion",
                "Admin soft deleted user",
            )
            await self.session.commit()
        except Exception as e:
            await self.session.rollback()
            raise CustomException(500, f"Failed to delete user: {str(e)}")

    # ------------------
    # DEALERS
    # ------------------
    async def suspend_dealer(self, actor: User, dealer_id: uuid.UUID, reason: str):
        dealer = await self.session.get(Dealership, dealer_id)
        if not dealer:
            raise CustomException(404, "Dealer not found")

        dealer_user = await self.session.get(User, dealer.user_id)
        if not dealer_user:
            raise CustomException(404, "Dealer user not found")
        if not can_moderate(actor, dealer_user):
            raise CustomException(
                403, "Cannot moderate this dealer due to role hierarchy"
            )

        dealer.is_suspended = True

        # Suspend inventory by hiding via moderation_layer without altering car.status
        from sqlalchemy import update as sa_update
        now = datetime.now(timezone.utc)
        await self.session.execute(
            sa_update(Car)
            .where(Car.dealership_id == dealer_id, Car.deleted_at.is_(None))
            .values(
                previous_moderation_status=Car.moderation_status,
                moderation_status="hidden",
                moderated_at=now,
                moderated_by=actor.id,
                moderation_reason=f"Dealer suspended: {reason}",
            )
        )

        try:
            await self._dispatch_and_audit(
                actor.id,
                dealer.id,
                "DEALER_SUSPENDED",
                "DEALER_SUSPENDED",
                reason,
                "Admin suspended dealer and hid inventory",
            )
            await self.session.commit()
        except Exception as e:
            await self.session.rollback()
            raise CustomException(500, f"Failed to suspend dealer: {str(e)}")

    async def restore_dealer(self, actor: User, dealer_id: uuid.UUID):
        dealer = await self.session.get(Dealership, dealer_id)
        if not dealer:
            raise CustomException(404, "Dealer not found")

        dealer_user = await self.session.get(User, dealer.user_id)
        if not dealer_user:
            raise CustomException(404, "Dealer user not found")
        if not can_moderate(actor, dealer_user):
            raise CustomException(
                403, "Cannot moderate this dealer due to role hierarchy"
            )

        dealer.is_suspended = False

        # Restore inventory explicitly hidden by this suspension
        stmt = select(Car).where(
            Car.dealership_id == dealer_id,
            Car.moderation_status == "hidden",
            Car.deleted_at.is_(None),
        )
        result = await self.session.execute(stmt)
        cars = result.scalars().all()

        for car in cars:
            car.moderation_status = car.previous_moderation_status
            car.previous_moderation_status = None
            car.moderated_at = datetime.now(timezone.utc)
            car.moderated_by = actor.id
            car.moderation_reason = "Dealer restored"

        try:
            await self._dispatch_and_audit(
                actor.id,
                dealer.id,
                "DEALER_RESTORED",
                "DEALER_RESTORED",
                None,
                "Admin restored dealer and inventory",
            )
            await self.session.commit()
        except Exception as e:
            await self.session.rollback()
            raise CustomException(500, f"Failed to restore dealer: {str(e)}")

    async def delete_dealer(self, actor: User, dealer_id: uuid.UUID):
        dealer = await self.session.get(Dealership, dealer_id)
        if not dealer:
            raise CustomException(404, "Dealer not found")

        dealer_user = await self.session.get(User, dealer.user_id)
        if not dealer_user:
            raise CustomException(404, "Dealer user not found")
        if not can_moderate(actor, dealer_user):
            raise CustomException(
                403, "Cannot moderate this dealer due to role hierarchy"
            )

        dealer.deleted_at = datetime.now(timezone.utc)
        dealer.deleted_reason = DeletedReason.admin_action
        dealer.deleted_by = actor.id

        try:
            await self._dispatch_and_audit(
                actor.id,
                dealer.id,
                "DEALER_DELETED",
                "DEALER_DELETED",
                "Admin deletion",
                "Admin deleted dealer",
            )
            await self.session.commit()
        except Exception as e:
            await self.session.rollback()
            raise CustomException(500, f"Failed to delete dealer: {str(e)}")

    # ------------------
    # CARS
    # ------------------
    async def moderate_car(
        self, actor: User, car_id: uuid.UUID, action: str, reason: str | None = None
    ):
        car = await self.session.get(Car, car_id)
        if not car:
            raise CustomException(404, "Car not found")

        car_user = await self.session.get(User, car.user_id)
        if not car_user:
            raise CustomException(404, "Car user not found")
        if not can_moderate(actor, car_user):
            raise CustomException(403, "Cannot moderate this car due to role hierarchy")

        action_upper = action.upper()

        if action_upper in ["APPROVE", "REJECT", "HIDE"]:
            car.previous_moderation_status = car.moderation_status
            if action_upper == "APPROVE":
                car.moderation_status = ModerationStatusEnum.approved.value
                car.status = CarStatusEnum.active
            elif action_upper == "REJECT":
                car.moderation_status = ModerationStatusEnum.rejected.value
                car.status = CarStatusEnum.rejected
            elif action_upper == "HIDE":
                car.moderation_status = ModerationStatusEnum.hidden.value
        elif action_upper == "RESTORE":
            car.moderation_status = car.previous_moderation_status
            car.previous_moderation_status = None
            if car.moderation_status == ModerationStatusEnum.approved.value:
                car.status = CarStatusEnum.active
            else:
                car.status = CarStatusEnum.pending
        elif action_upper == "FEATURE":
            car.is_featured = True
        else:
            raise CustomException(400, "Invalid car moderation action")

        car.moderated_at = datetime.now(timezone.utc)
        car.moderated_by = actor.id
        car.moderation_reason = reason

        event_map = {
            "APPROVE": "CAR_APPROVED",
            "REJECT": "CAR_REJECTED",
            "HIDE": "CAR_HIDDEN",
            "RESTORE": "CAR_RESTORED",
            "FEATURE": "CAR_FEATURED",
        }
        event_type = event_map.get(action_upper, f"CAR_{action_upper}")

        try:
            await self._dispatch_and_audit(
                actor.id,
                car.id,
                event_type,
                event_type,
                reason,
                f"Admin {action_upper.lower()} car",
            )
            await self.session.commit()
        except Exception as e:
            await self.session.rollback()
            raise CustomException(500, f"Failed to moderate car: {str(e)}")

    # ------------------
    # REVIEWS
    # ------------------
    async def delete_review(self, actor: User, review_id: uuid.UUID):
        review = await self.session.get(Review, review_id)
        if not review:
            raise CustomException(404, "Review not found")

        reviewer = await self.session.get(User, review.reviewer_id)
        seller = await self.session.get(User, review.seller_id)
        if not reviewer or not seller:
            raise CustomException(404, "User not found")
        if not can_moderate(actor, reviewer) or not can_moderate(actor, seller):
            raise CustomException(
                403, "Cannot moderate this review due to role hierarchy"
            )

        review.deleted_at = datetime.now(timezone.utc)
        review.deleted_reason = DeletedReason.admin_action
        review.deleted_by = actor.id

        try:
            from app.modules.reviews.repository import ReviewsRepository

            await ReviewsRepository(self.session).update_seller_aggregate(
                review.seller_id
            )

            await self._dispatch_and_audit(
                actor.id,
                review.id,
                "REVIEW_REMOVED",
                "REVIEW_REMOVED",
                None,
                "Admin deleted review",
            )
            await self.session.commit()
        except Exception as e:
            await self.session.rollback()
            raise CustomException(500, f"Failed to delete review: {str(e)}")

    async def restore_review(self, actor: User, review_id: uuid.UUID):
        from app.modules.reviews.service import ReviewsService

        review = await self.session.get(Review, review_id)
        if not review:
            raise CustomException(404, "Review not found")

        reviewer = await self.session.get(User, review.reviewer_id)
        seller = await self.session.get(User, review.seller_id)
        if not reviewer or not seller:
            raise CustomException(404, "User not found")
        if not can_moderate(actor, reviewer) or not can_moderate(actor, seller):
            raise CustomException(
                403, "Cannot moderate this review due to role hierarchy"
            )

        try:
            # Reusing the tested ReviewsService to ensure aggregates are recalculated correctly
            await ReviewsService(self.session).restore_review(review_id, actor)
        except CustomException as ce:
            raise ce
        except Exception as e:
            raise CustomException(500, f"Failed to restore review: {str(e)}")

    # ------------------
    # INQUIRIES
    # ------------------
    async def close_inquiry(self, actor: User, inquiry_id: uuid.UUID):
        inquiry = await self.session.get(Inquiry, inquiry_id)
        if not inquiry:
            raise CustomException(404, "Inquiry not found")

        buyer = await self.session.get(User, inquiry.buyer_id)
        seller = await self.session.get(User, inquiry.seller_id)
        if not buyer or not seller:
            raise CustomException(404, "User not found")
        if not can_moderate(actor, buyer) or not can_moderate(actor, seller):
            raise CustomException(
                403, "Cannot moderate this inquiry due to role hierarchy"
            )

        inquiry.previous_status = inquiry.status
        inquiry.status = InquiryStatusEnum.closed

        try:
            await self._dispatch_and_audit(
                actor.id,
                inquiry.id,
                "INQUIRY_CLOSED",
                "INQUIRY_CLOSED",
                None,
                "Admin closed inquiry",
            )
            await self.session.commit()
        except Exception as e:
            await self.session.rollback()
            raise CustomException(500, f"Failed to close inquiry: {str(e)}")

    async def archive_inquiry(self, actor: User, inquiry_id: uuid.UUID):
        inquiry = await self.session.get(Inquiry, inquiry_id)
        if not inquiry:
            raise CustomException(404, "Inquiry not found")

        buyer = await self.session.get(User, inquiry.buyer_id)
        seller = await self.session.get(User, inquiry.seller_id)
        if not buyer or not seller:
            raise CustomException(404, "User not found")
        if not can_moderate(actor, buyer) or not can_moderate(actor, seller):
            raise CustomException(
                403, "Cannot moderate this inquiry due to role hierarchy"
            )

        inquiry.previous_status = inquiry.status
        inquiry.status = InquiryStatusEnum.archived

        try:
            await self._dispatch_and_audit(
                actor.id,
                inquiry.id,
                "INQUIRY_ARCHIVED",
                "INQUIRY_ARCHIVED",
                None,
                "Admin archived inquiry",
            )
            await self.session.commit()
        except Exception as e:
            await self.session.rollback()
            raise CustomException(500, f"Failed to archive inquiry: {str(e)}")
