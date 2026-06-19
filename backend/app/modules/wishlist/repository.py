from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import and_
from uuid import UUID
from app.modules.wishlist.models import Wishlist
from app.modules.cars.models import Car


class WishlistRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_wishlist_entry(
        self, user_id: UUID, car_id: UUID, include_deleted: bool = False
    ) -> Wishlist | None:
        query = select(Wishlist).where(
            Wishlist.user_id == user_id, Wishlist.car_id == car_id
        )
        if not include_deleted:
            query = query.where(Wishlist.deleted_at.is_(None))
        result = await self.session.execute(query)
        return result.scalars().first()

    async def add_wishlist_entry(self, entry: Wishlist) -> Wishlist:
        self.session.add(entry)
        await self.session.flush()
        return entry

    async def update_wishlist_entry(self, entry: Wishlist) -> Wishlist:
        self.session.add(entry)
        await self.session.flush()
        return entry

    async def count_user_wishlist(self, user_id: UUID) -> int:
        from sqlalchemy import func

        result = await self.session.execute(
            select(func.count(Wishlist.id)).where(
                Wishlist.user_id == user_id, Wishlist.deleted_at.is_(None)
            )
        )
        return result.scalar() or 0

    async def list_user_wishlist(
        self, user_id: UUID, cursor: "datetime | None", limit: int
    ) -> list[tuple[Wishlist, Car | None]]:
        stmt = (
            select(Wishlist, Car)
            .outerjoin(Car, and_(Wishlist.car_id == Car.id, Car.deleted_at.is_(None)))
            .where(Wishlist.user_id == user_id, Wishlist.deleted_at.is_(None))
        )

        if cursor:
            stmt = stmt.where(Wishlist.created_at < cursor)

        stmt = stmt.order_by(Wishlist.created_at.desc(), Wishlist.id.desc()).limit(
            limit
        )
        result = await self.session.execute(stmt)
        return [(row[0], row[1]) for row in result.all()]
