from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import joinedload
from uuid import UUID
from datetime import datetime, timezone
from app.modules.auth.models import User, Dealership


class UserRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_user_by_id(self, user_id: UUID) -> User | None:
        result = await self.session.execute(
            select(User)
            .options(joinedload(User.dealership))
            .where(User.id == user_id, User.deleted_at.is_(None))
        )
        return result.scalars().first()

    async def get_user_by_email(self, email: str) -> User | None:
        result = await self.session.execute(
            select(User).where(User.email == email, User.deleted_at.is_(None))
        )
        return result.scalars().first()

    async def get_dealer_by_id(self, dealer_id: UUID) -> Dealership | None:
        result = await self.session.execute(
            select(Dealership)
            .options(joinedload(Dealership.user))
            .where(Dealership.id == dealer_id)
        )
        dealer = result.scalars().first()
        if dealer and not dealer.user.deleted_at:
            return dealer
        return None

    async def update_user(self, user: User) -> User:
        self.session.add(user)
        await self.session.flush()
        return user

    async def soft_delete_user(self, user: User) -> None:
        user.deleted_at = datetime.now(timezone.utc)
        user.is_active = False
        self.session.add(user)
        await self.session.flush()
