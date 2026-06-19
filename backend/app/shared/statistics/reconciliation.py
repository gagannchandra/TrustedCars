from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.core.models import PlatformStatistics
from app.modules.auth.models import User, Dealership
from app.modules.cars.models import Car, CarStatusEnum
from app.modules.reviews.models import Review
from app.shared.audit.service import AuditService
import logging

logger = logging.getLogger(__name__)


async def reconcile_platform_statistics(session: AsyncSession):
    """
    Daily reconciliation task to detect PlatformStatistics drift.
    Compares the denormalized PlatformStatistics against the actual database COUNT(*).
    Logs an audit event if a mismatch is detected.
    """
    stats = await session.scalar(
        select(PlatformStatistics).where(PlatformStatistics.id == 1)
    )
    if not stats:
        logger.warning("No PlatformStatistics found during reconciliation.")
        return

    # Count real values
    total_users = await session.scalar(select(func.count()).select_from(User))
    active_users = await session.scalar(
        select(func.count())
        .select_from(User)
        .where(
            User.is_active.is_(True),
            User.is_suspended.is_(False),
            User.deleted_at.is_(None),
        )
    )
    suspended_users = await session.scalar(
        select(func.count())
        .select_from(User)
        .where(User.is_suspended.is_(True), User.deleted_at.is_(None))
    )

    total_dealers = await session.scalar(select(func.count()).select_from(Dealership))
    active_dealers = await session.scalar(
        select(func.count())
        .select_from(Dealership)
        .where(Dealership.is_suspended.is_(False), Dealership.deleted_at.is_(None))
    )
    suspended_dealers = await session.scalar(
        select(func.count())
        .select_from(Dealership)
        .where(Dealership.is_suspended.is_(True), Dealership.deleted_at.is_(None))
    )

    pending_cars = await session.scalar(
        select(func.count())
        .select_from(Car)
        .where(Car.status == CarStatusEnum.pending, Car.deleted_at.is_(None))
    )
    active_cars = await session.scalar(
        select(func.count())
        .select_from(Car)
        .where(Car.status == CarStatusEnum.active, Car.deleted_at.is_(None))
    )
    hidden_cars = await session.scalar(
        select(func.count())
        .select_from(Car)
        .where(Car.moderation_status == "hidden", Car.deleted_at.is_(None))
    )

    total_reviews = await session.scalar(
        select(func.count()).select_from(Review).where(Review.deleted_at.is_(None))
    )

    mismatches = []

    if stats.total_users != total_users:
        mismatches.append(
            f"total_users: expected {total_users}, got {stats.total_users}"
        )
    if stats.active_users != active_users:
        mismatches.append(
            f"active_users: expected {active_users}, got {stats.active_users}"
        )
    if stats.suspended_users != suspended_users:
        mismatches.append(
            f"suspended_users: expected {suspended_users}, got {stats.suspended_users}"
        )

    if stats.total_dealers != total_dealers:
        mismatches.append(
            f"total_dealers: expected {total_dealers}, got {stats.total_dealers}"
        )
    if stats.active_dealers != active_dealers:
        mismatches.append(
            f"active_dealers: expected {active_dealers}, got {stats.active_dealers}"
        )
    if stats.suspended_dealers != suspended_dealers:
        mismatches.append(
            f"suspended_dealers: expected {suspended_dealers}, got {stats.suspended_dealers}"
        )

    if stats.pending_cars != pending_cars:
        mismatches.append(
            f"pending_cars: expected {pending_cars}, got {stats.pending_cars}"
        )
    if stats.active_cars != active_cars:
        mismatches.append(
            f"active_cars: expected {active_cars}, got {stats.active_cars}"
        )
    if stats.hidden_cars != hidden_cars:
        mismatches.append(
            f"hidden_cars: expected {hidden_cars}, got {stats.hidden_cars}"
        )

    if stats.total_reviews != total_reviews:
        mismatches.append(
            f"total_reviews: expected {total_reviews}, got {stats.total_reviews}"
        )

    if mismatches:
        details = " | ".join(mismatches)
        logger.warning(f"PlatformStatistics drift detected: {details}")

        # System user id UUID for system background tasks
        from uuid import UUID

        SYSTEM_USER_ID = UUID("00000000-0000-0000-0000-000000000000")

        await AuditService(session).log_action(
            user_id=SYSTEM_USER_ID, action="STATISTICS_DRIFT_DETECTED", details=details
        )
        await session.commit()
