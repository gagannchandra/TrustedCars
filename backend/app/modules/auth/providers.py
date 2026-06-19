from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from uuid import UUID
from app.modules.auth.models import Dealership


class AuthDealerProvider:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def is_dealer_authorized(
        self, user_id: UUID, dealership_id: UUID | None
    ) -> bool:
        if not dealership_id:
            return False
        dealer = await self.session.scalar(
            select(Dealership).where(Dealership.user_id == user_id)
        )
        return dealer is not None and dealer.id == dealership_id
