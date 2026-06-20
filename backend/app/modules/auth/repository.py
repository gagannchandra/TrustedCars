from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import update
from uuid import UUID
from datetime import datetime, timezone
from app.modules.auth.models import User, RefreshToken, Dealership


class AuthRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_user_by_email(self, email: str) -> User | None:
        result = await self.session.execute(
            select(User).where(
                User.email == email, User.is_active, User.deleted_at.is_(None)
            )
        )
        return result.scalars().first()

    async def get_user_by_id(self, user_id: UUID) -> User | None:
        result = await self.session.execute(
            select(User).where(
                User.id == user_id, User.is_active, User.deleted_at.is_(None)
            )
        )
        return result.scalars().first()

    async def create_user(self, user: User) -> User:
        self.session.add(user)
        await self.session.flush()
        return user

    async def create_dealership(self, dealership: Dealership) -> Dealership:
        self.session.add(dealership)
        await self.session.flush()
        return dealership

    async def save_refresh_token(self, refresh_token: RefreshToken) -> RefreshToken:
        self.session.add(refresh_token)
        await self.session.flush()
        return refresh_token

    async def get_refresh_token(self, token_hash: str) -> RefreshToken | None:
        result = await self.session.execute(
            select(RefreshToken).where(RefreshToken.token_hash == token_hash)
        )
        return result.scalars().first()

    async def get_refresh_token_for_update(
        self, token_hash: str
    ) -> RefreshToken | None:
        result = await self.session.execute(
            select(RefreshToken)
            .where(RefreshToken.token_hash == token_hash)
            .with_for_update()
        )
        return result.scalars().first()

    async def revoke_refresh_token_family(self, family_id: UUID) -> None:
        await self.session.execute(
            update(RefreshToken)
            .where(
                RefreshToken.family_id == family_id,
                RefreshToken.expires_at > datetime.now(timezone.utc)
            )
            .values(is_revoked=True)
        )

    async def revoke_all_user_refresh_tokens(self, user_id: UUID) -> None:
        await self.session.execute(
            update(RefreshToken)
            .where(RefreshToken.user_id == user_id)
            .values(is_revoked=True)
        )
        await self.session.flush()
