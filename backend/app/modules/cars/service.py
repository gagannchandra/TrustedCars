from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.modules.cars.repository import CarRepository
from app.modules.cars.schemas import CarCreateRequest, CarUpdateRequest
from app.modules.cars.models import Car, CarStatusEnum
from app.modules.auth.models import User, RoleEnum, Dealership
from app.shared.interfaces.dealers import DealerAuthorizationProvider
from app.shared.audit.service import AuditService
from app.shared.exceptions.handlers import CustomException
from app.core.events import event_bus
from datetime import datetime, timezone


class CarService:
    def __init__(
        self, session: AsyncSession, dealer_provider: DealerAuthorizationProvider
    ):
        self.repository = CarRepository(session)
        self.session = session
        self.dealer_provider = dealer_provider

    async def _log_audit(
        self,
        user_id: UUID,
        action: str,
        target_id: UUID | None = None,
        reason: str | None = None,
        details: str = "",
    ):
        await AuditService(self.session).log_action(
            user_id, action, target_id, reason, details
        )

    async def create_car(self, req: CarCreateRequest, current_user: User) -> Car:
        dealership_id = None
        if current_user.role == RoleEnum.dealer:
            dealer = await self.session.scalar(
                select(Dealership).where(Dealership.user_id == current_user.id)
            )
            if dealer:
                dealership_id = dealer.id

        car = Car(
            user_id=current_user.id,
            dealership_id=dealership_id,
            make=req.make,
            model=req.model,
            variant=req.variant,
            year=req.year,
            fuel_type=req.fuel_type,
            transmission=req.transmission,
            body_type=req.body_type,
            odometer_km=req.odometer_km,
            ownership_count=req.ownership_count,
            asking_price=req.asking_price,
            city=req.city,
            state=req.state,
            description=req.description,
        )

        car = await self.repository.create_car(car)
        await self._log_audit(
            current_user.id, "CREATE_CAR", car.id, None, f"Created car {car.id}"
        )
        await self.session.commit()
        await self.session.refresh(car)
        return car

    async def update_car(
        self,
        car_id: UUID,
        req: CarUpdateRequest,
        current_user: User,
        check_ownership: bool = True,
    ) -> Car:
        car = await self.repository.get_car_by_id(car_id)
        if not car:
            raise CustomException(404, "Car not found")

        if check_ownership:
            from app.shared.rbac.dependencies import assert_can_edit_resource
            await assert_can_edit_resource(
                current_user=current_user,
                owner_user_ids=car.user_id,
                dealership_id=car.dealership_id,
                dealer_provider=self.dealer_provider,
                resource_name="car",
            )

        if car.status == CarStatusEnum.sold:
            raise CustomException(400, "Sold vehicles cannot be modified")

        update_data = req.model_dump(exclude_unset=True)

        for key, value in update_data.items():
            setattr(car, key, value)

        await self._log_audit(
            current_user.id, "UPDATE_CAR", car.id, None, f"Updated car {car.id}"
        )
        await self.session.commit()
        await self.session.refresh(car)
        return car

    async def soft_delete_car(
        self, car_id: UUID, current_user: User, check_ownership: bool = True
    ):
        car = await self.repository.get_car_by_id(car_id)
        if not car:
            raise CustomException(404, "Car not found")

        if check_ownership:
            from app.shared.rbac.dependencies import assert_can_edit_resource
            await assert_can_edit_resource(
                current_user=current_user,
                owner_user_ids=car.user_id,
                dealership_id=car.dealership_id,
                dealer_provider=self.dealer_provider,
                resource_name="car",
            )

        car.deleted_at = datetime.now(timezone.utc)
        from app.core.models import DeletedReason

        car.deleted_reason = (
            DeletedReason.user_request
            if current_user.id == car.user_id
            else DeletedReason.admin_action
        )
        car.deleted_by = current_user.id
        # Preserve original status, do not overwrite to rejected
        await self._log_audit(
            current_user.id, "DELETE_CAR", car.id, None, f"Deleted car {car.id}"
        )
        await event_bus.publish(
            "CAR_SOFT_DELETED", session=self.session, car_id=str(car.id)
        )
        await self.session.commit()

    async def get_car(self, car_id: UUID) -> Car:
        car = await self.repository.get_car_by_id(car_id)
        if not car:
            raise CustomException(404, "Car not found")
        return car

    async def get_public_car(self, car_id: UUID) -> Car:
        car = await self.repository.get_public_car_by_id(car_id)
        if not car:
            raise CustomException(404, "Car not found or unavailable")
        return car

    async def assert_dealer_exists(self, dealership_id: UUID):
        from sqlalchemy import select
        from app.modules.auth.models import Dealership
        dealer = await self.session.scalar(
            select(Dealership).where(Dealership.id == dealership_id)
        )
        if not dealer:
            raise CustomException(404, "Dealership not found")

    async def search_cars(self, filters, dealership_id: UUID | None = None, seller_id: UUID | None = None):
        return await self.repository.search_cars(filters, dealership_id, seller_id)

    async def handle_user_deleted(self, user_id: UUID):
        from sqlalchemy import update, select

        now = datetime.now(timezone.utc)
        from app.core.models import DeletedReason

        # We need the list of car_ids to bulk emit
        stmt = select(Car.id).where(Car.user_id == user_id, Car.deleted_at.is_(None))
        result = await self.session.execute(stmt)
        car_ids = result.scalars().all()

        if car_ids:
            upd = (
                update(Car)
                .where(Car.user_id == user_id, Car.deleted_at.is_(None))
                .values(deleted_at=now, deleted_reason=DeletedReason.account_deleted)
            )
            await self.session.execute(upd)

            # Use explicit list comprehension or join to pass UUIDs
            car_id_strs = [str(cid) for cid in car_ids]
            await event_bus.publish(
                "CARS_BULK_SOFT_DELETED",
                session=self.session,
                car_ids=car_id_strs,
                user_id=str(user_id),
            )

    async def handle_user_deactivated(self, user_id: UUID):
        from sqlalchemy import update

        now = datetime.now(timezone.utc)
        stmt = (
            update(Car)
            .where(Car.user_id == user_id, Car.deleted_at.is_(None))
            .values(
                previous_moderation_status=Car.moderation_status,
                moderation_status="hidden",
                moderated_at=now,
                moderation_reason="User deactivated",
            )
        )
        await self.session.execute(stmt)

    async def handle_user_restored(self, user_id: UUID):
        from sqlalchemy import update

        stmt = (
            update(Car)
            .where(
                Car.user_id == user_id,
                Car.deleted_at.is_(None),
                Car.moderation_reason == "User deactivated",
            )
            .values(
                moderation_status=Car.previous_moderation_status,
                previous_moderation_status=None,
                moderated_at=None,
                moderation_reason=None,
            )
        )
        await self.session.execute(stmt)

    async def handle_dealer_suspended(self, dealership_id: UUID, admin_id: UUID):
        from sqlalchemy import update

        now = datetime.now(timezone.utc)
        stmt = (
            update(Car)
            .where(Car.dealership_id == dealership_id, Car.deleted_at.is_(None))
            .values(
                previous_moderation_status=Car.moderation_status,
                moderation_status="hidden",
                moderated_at=now,
                moderated_by=admin_id,
                moderation_reason="Dealer suspended",
            )
        )
        await self.session.execute(stmt)

    async def handle_dealer_restored(self, dealership_id: UUID):
        from sqlalchemy import update

        stmt = (
            update(Car)
            .where(
                Car.dealership_id == dealership_id,
                Car.deleted_at.is_(None),
                Car.moderation_reason == "Dealer suspended",
                Car.moderation_status == "hidden",
            )
            .values(
                moderation_status=Car.previous_moderation_status,
                previous_moderation_status=None,
                moderated_at=None,
                moderated_by=None,
                moderation_reason=None,
            )
        )
        await self.session.execute(stmt)
