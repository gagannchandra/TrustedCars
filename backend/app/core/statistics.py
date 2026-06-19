from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import update
from sqlalchemy.dialects.postgresql import insert
from datetime import datetime, timezone
from app.core.models import PlatformStatistics


class PlatformStatisticsService:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def _ensure_stats_exist(self):
        now = datetime.now(timezone.utc)
        stmt = (
            insert(PlatformStatistics)
            .values(
                id=1,
                total_users=0,
                active_users=0,
                suspended_users=0,
                total_dealers=0,
                active_dealers=0,
                suspended_dealers=0,
                pending_cars=0,
                active_cars=0,
                hidden_cars=0,
                total_reviews=0,
                total_inquiries=0,
                updated_at=now,
            )
            .on_conflict_do_nothing(index_elements=[PlatformStatistics.id])
        )
        await self.session.execute(stmt)

    async def handle_user_created(self, **kwargs):
        await self._ensure_stats_exist()
        now = datetime.now(timezone.utc)
        await self.session.execute(
            update(PlatformStatistics)
            .where(PlatformStatistics.id == 1)
            .values(
                total_users=PlatformStatistics.total_users + 1,
                active_users=PlatformStatistics.active_users + 1,
                updated_at=now,
            )
        )

    async def handle_user_deleted(self, **kwargs):
        await self._ensure_stats_exist()
        now = datetime.now(timezone.utc)
        await self.session.execute(
            update(PlatformStatistics)
            .where(PlatformStatistics.id == 1)
            .values(
                total_users=PlatformStatistics.total_users - 1,
                active_users=PlatformStatistics.active_users - 1,
                updated_at=now,
            )
        )

    async def handle_user_suspended(self, **kwargs):
        await self._ensure_stats_exist()
        now = datetime.now(timezone.utc)
        await self.session.execute(
            update(PlatformStatistics)
            .where(PlatformStatistics.id == 1)
            .values(
                active_users=PlatformStatistics.active_users - 1,
                suspended_users=PlatformStatistics.suspended_users + 1,
                updated_at=now,
            )
        )

    async def handle_user_restored(self, **kwargs):
        await self._ensure_stats_exist()
        now = datetime.now(timezone.utc)
        await self.session.execute(
            update(PlatformStatistics)
            .where(PlatformStatistics.id == 1)
            .values(
                total_users=PlatformStatistics.total_users + 1,
                active_users=PlatformStatistics.active_users + 1,
                updated_at=now,
            )
        )

    async def handle_car_created(self, **kwargs):
        await self._ensure_stats_exist()
        now = datetime.now(timezone.utc)
        await self.session.execute(
            update(PlatformStatistics)
            .where(PlatformStatistics.id == 1)
            .values(
                pending_cars=PlatformStatistics.pending_cars + 1,
                updated_at=now,
            )
        )

    async def handle_car_approved(self, **kwargs):
        await self._ensure_stats_exist()
        now = datetime.now(timezone.utc)
        await self.session.execute(
            update(PlatformStatistics)
            .where(PlatformStatistics.id == 1)
            .values(
                pending_cars=PlatformStatistics.pending_cars - 1,
                active_cars=PlatformStatistics.active_cars + 1,
                updated_at=now,
            )
        )

    async def handle_car_deleted(self, **kwargs):
        await self._ensure_stats_exist()
        now = datetime.now(timezone.utc)
        await self.session.execute(
            update(PlatformStatistics)
            .where(PlatformStatistics.id == 1)
            .values(
                active_cars=PlatformStatistics.active_cars - 1,
                updated_at=now,
            )
        )

    async def handle_review_created(self, **kwargs):
        await self._ensure_stats_exist()
        now = datetime.now(timezone.utc)
        await self.session.execute(
            update(PlatformStatistics)
            .where(PlatformStatistics.id == 1)
            .values(
                total_reviews=PlatformStatistics.total_reviews + 1,
                updated_at=now,
            )
        )

    async def handle_review_deleted(self, **kwargs):
        await self._ensure_stats_exist()
        now = datetime.now(timezone.utc)
        await self.session.execute(
            update(PlatformStatistics)
            .where(PlatformStatistics.id == 1)
            .values(
                total_reviews=PlatformStatistics.total_reviews - 1,
                updated_at=now,
            )
        )

    async def handle_inquiry_created(self, **kwargs):
        await self._ensure_stats_exist()
        now = datetime.now(timezone.utc)
        await self.session.execute(
            update(PlatformStatistics)
            .where(PlatformStatistics.id == 1)
            .values(
                total_inquiries=PlatformStatistics.total_inquiries + 1,
                updated_at=now,
            )
        )
