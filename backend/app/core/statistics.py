from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import update
from sqlalchemy.exc import IntegrityError
from app.core.models import PlatformStatistics


class PlatformStatisticsService:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def _ensure_stats_exist(self):
        # Fire-and-forget ensure row 1 exists. In production, this can be seeded in migration.
        try:
            self.session.add(PlatformStatistics(id=1))
            await self.session.flush()
        except IntegrityError:
            await self.session.rollback()

    async def handle_user_created(self, **kwargs):
        await self._ensure_stats_exist()
        await self.session.execute(
            update(PlatformStatistics)
            .where(PlatformStatistics.id == 1)
            .values(
                total_users=PlatformStatistics.total_users + 1,
                active_users=PlatformStatistics.active_users + 1,
            )
        )

    async def handle_user_deleted(self, **kwargs):
        await self._ensure_stats_exist()
        await self.session.execute(
            update(PlatformStatistics)
            .where(PlatformStatistics.id == 1)
            .values(
                total_users=PlatformStatistics.total_users - 1,
                active_users=PlatformStatistics.active_users - 1,
            )
        )

    async def handle_user_suspended(self, **kwargs):
        await self._ensure_stats_exist()
        await self.session.execute(
            update(PlatformStatistics)
            .where(PlatformStatistics.id == 1)
            .values(
                active_users=PlatformStatistics.active_users - 1,
                suspended_users=PlatformStatistics.suspended_users + 1,
            )
        )

    async def handle_user_restored(self, **kwargs):
        await self._ensure_stats_exist()
        await self.session.execute(
            update(PlatformStatistics)
            .where(PlatformStatistics.id == 1)
            .values(
                total_users=PlatformStatistics.total_users + 1,
                active_users=PlatformStatistics.active_users + 1,
            )
        )

    async def handle_car_created(self, **kwargs):
        await self._ensure_stats_exist()
        await self.session.execute(
            update(PlatformStatistics)
            .where(PlatformStatistics.id == 1)
            .values(pending_cars=PlatformStatistics.pending_cars + 1)
        )

    async def handle_car_approved(self, **kwargs):
        await self._ensure_stats_exist()
        await self.session.execute(
            update(PlatformStatistics)
            .where(PlatformStatistics.id == 1)
            .values(
                pending_cars=PlatformStatistics.pending_cars - 1,
                active_cars=PlatformStatistics.active_cars + 1,
            )
        )

    async def handle_car_deleted(self, **kwargs):
        await self._ensure_stats_exist()
        await self.session.execute(
            update(PlatformStatistics)
            .where(PlatformStatistics.id == 1)
            .values(active_cars=PlatformStatistics.active_cars - 1)
        )

    async def handle_review_created(self, **kwargs):
        await self._ensure_stats_exist()
        await self.session.execute(
            update(PlatformStatistics)
            .where(PlatformStatistics.id == 1)
            .values(total_reviews=PlatformStatistics.total_reviews + 1)
        )

    async def handle_review_deleted(self, **kwargs):
        await self._ensure_stats_exist()
        await self.session.execute(
            update(PlatformStatistics)
            .where(PlatformStatistics.id == 1)
            .values(total_reviews=PlatformStatistics.total_reviews - 1)
        )
