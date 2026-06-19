from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from uuid import UUID
from app.modules.cars.models import Car, CarStatusEnum


class CarRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def create_car(self, car: Car) -> Car:
        self.session.add(car)
        await self.session.flush()
        return car

    async def get_car_by_id(self, car_id: UUID) -> Car | None:
        result = await self.session.execute(
            select(Car).where(Car.id == car_id, Car.deleted_at.is_(None))
        )
        return result.scalars().first()

    async def get_public_car_by_id(self, car_id: UUID) -> Car | None:
        result = await self.session.execute(
            select(Car).where(
                Car.id == car_id,
                Car.deleted_at.is_(None),
                Car.status == CarStatusEnum.active,
            )
        )
        return result.scalars().first()

    async def search_cars(
        self,
        make: str | None,
        model: str | None,
        year: int | None,
        fuel_type: str | None,
        transmission: str | None,
        city: str | None,
        state: str | None,
        min_price: float | None,
        max_price: float | None,
        min_mileage: int | None,
        max_mileage: int | None,
        dealership_id: UUID | None,
        limit: int,
        cursor: "datetime | None" = None,
    ):
        stmt = select(Car).where(
            Car.deleted_at.is_(None), Car.status == CarStatusEnum.active
        )

        if make:
            stmt = stmt.where(Car.make.ilike(f"{make}%"))
        if model:
            stmt = stmt.where(Car.model.ilike(f"{model}%"))
        if year:
            stmt = stmt.where(Car.year == year)
        if fuel_type:
            stmt = stmt.where(Car.fuel_type == fuel_type)
        if transmission:
            stmt = stmt.where(Car.transmission == transmission)
        if city:
            stmt = stmt.where(Car.city.ilike(f"{city}%"))
        if state:
            stmt = stmt.where(Car.state.ilike(f"{state}%"))
        if min_price is not None:
            stmt = stmt.where(Car.asking_price >= min_price)
        if max_price is not None:
            stmt = stmt.where(Car.asking_price <= max_price)
        if min_mileage is not None:
            stmt = stmt.where(Car.odometer_km >= min_mileage)
        if max_mileage is not None:
            stmt = stmt.where(Car.odometer_km <= max_mileage)
        if dealership_id:
            stmt = stmt.where(Car.dealership_id == dealership_id)

        if cursor:
            stmt = stmt.where(Car.created_at < cursor)

        stmt = stmt.order_by(Car.created_at.desc(), Car.id.desc()).limit(limit)
        result = await self.session.execute(stmt)
        return result.scalars().all()
