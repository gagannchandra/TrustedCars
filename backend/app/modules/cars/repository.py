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
        q: str | None,
        make: str | None,
        model: str | None,
        min_year: int | None,
        max_year: int | None,
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
        body_type: str | None,
        ownership_count: int | None,
        sort: str | None,
        limit: int,
        skip: int = 0,
    ):
        stmt = select(Car).where(
            Car.deleted_at.is_(None), Car.status == CarStatusEnum.active
        )

        if q:
            from sqlalchemy import or_
            stmt = stmt.where(
                or_(
                    Car.make.ilike(f"%{q}%"),
                    Car.model.ilike(f"%{q}%"),
                    Car.variant.ilike(f"%{q}%")
                )
            )
        if make:
            stmt = stmt.where(Car.make.ilike(f"{make}%"))
        if model:
            stmt = stmt.where(Car.model.ilike(f"{model}%"))
        if year:
            stmt = stmt.where(Car.year == year)
        if min_year:
            stmt = stmt.where(Car.year >= min_year)
        if max_year:
            stmt = stmt.where(Car.year <= max_year)
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

        if body_type:
            stmt = stmt.where(Car.body_type == body_type)
        if ownership_count:
            stmt = stmt.where(Car.ownership_count == ownership_count)
        
        # Get total count
        from sqlalchemy import func
        count_stmt = select(func.count()).select_from(stmt.subquery())
        total_result = await self.session.execute(count_stmt)
        total = total_result.scalar() or 0

        # Apply sort
        if sort == 'price_asc':
            stmt = stmt.order_by(Car.asking_price.asc(), Car.id.desc())
        elif sort == 'price_desc':
            stmt = stmt.order_by(Car.asking_price.desc(), Car.id.desc())
        elif sort == 'year_desc':
            stmt = stmt.order_by(Car.year.desc(), Car.id.desc())
        elif sort == 'km_asc':
            stmt = stmt.order_by(Car.odometer_km.asc(), Car.id.desc())
        else:
            stmt = stmt.order_by(Car.created_at.desc(), Car.id.desc())

        stmt = stmt.offset(skip).limit(limit)
        result = await self.session.execute(stmt)
        items = list(result.scalars().all())
        
        return {"items": items, "total": total}
