from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from uuid import UUID
from app.modules.cars.models import Car
from app.modules.auth.models import User, RoleEnum
from app.shared.interfaces.dealers import DealerAuthorizationProvider


class AuthCarProvider:
    def __init__(
        self, session: AsyncSession, dealer_provider: DealerAuthorizationProvider
    ):
        self.session = session
        self.dealer_provider = dealer_provider

    async def verify_user_can_edit_car(self, car_id: UUID, current_user: User) -> bool:
        car = await self.session.scalar(
            select(Car).where(Car.id == car_id, Car.deleted_at.is_(None))
        )
        if not car:
            return False

        if current_user.role == RoleEnum.dealer:
            return await self.dealer_provider.is_dealer_authorized(
                current_user.id, car.dealership_id
            )

        return car.user_id == current_user.id

    async def get_car_seller_id(self, car_id: UUID) -> UUID | None:
        car = await self.session.scalar(
            select(Car).where(Car.id == car_id, Car.deleted_at.is_(None))
        )
        return car.user_id if car else None

    async def is_user_seller_of_car(self, car_id: UUID, current_user: User) -> bool:
        car = await self.session.scalar(
            select(Car).where(Car.id == car_id, Car.deleted_at.is_(None))
        )
        if not car:
            return False
        if current_user.role == RoleEnum.dealer:
            return await self.dealer_provider.is_dealer_authorized(
                current_user.id, car.dealership_id
            )
        return car.user_id == current_user.id
