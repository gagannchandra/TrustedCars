from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.models import PlatformStatistics


class DashboardService:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_statistics(self) -> dict:
        stmt = select(PlatformStatistics).where(PlatformStatistics.id == 1)
        result = await self.session.execute(stmt)
        stats = result.scalar_one_or_none()

        if not stats:
            # Fallback if no stats initialized
            return {
                "total_users": 0,
                "active_users": 0,
                "suspended_users": 0,
                "total_dealers": 0,
                "active_dealers": 0,
                "suspended_dealers": 0,
                "pending_cars": 0,
                "active_cars": 0,
                "hidden_cars": 0,
                "total_reviews": 0,
            }

        return {
            "total_users": stats.total_users,
            "active_users": stats.active_users,
            "suspended_users": stats.suspended_users,
            "total_dealers": stats.total_dealers,
            "active_dealers": stats.active_dealers,
            "suspended_dealers": stats.suspended_dealers,
            "pending_cars": stats.pending_cars,
            "active_cars": stats.active_cars,
            "hidden_cars": stats.hidden_cars,
            "total_reviews": stats.total_reviews,
        }
