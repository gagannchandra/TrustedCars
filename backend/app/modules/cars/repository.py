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

    from app.modules.cars.schemas import CarSearchFilters

    async def search_cars(
        self,
        filters: "CarSearchFilters",
        dealership_id: UUID | None = None,
        seller_id: UUID | None = None,
    ):
        stmt = select(Car).where(Car.deleted_at.is_(None))
        
        if seller_id or dealership_id:
            stmt = stmt.where(Car.status != 'archived')
        else:
            stmt = stmt.where(Car.status == CarStatusEnum.active)

        if seller_id:
            stmt = stmt.where(Car.user_id == seller_id)
        if filters.is_featured is not None:
            stmt = stmt.where(Car.is_featured == filters.is_featured)

        if filters.q:
            from sqlalchemy import or_
            stmt = stmt.where(
                or_(
                    Car.make.ilike(f"%{filters.q}%"),
                    Car.model.ilike(f"%{filters.q}%"),
                    Car.variant.ilike(f"%{filters.q}%")
                )
            )
        if filters.make:
            stmt = stmt.where(Car.make.ilike(f"{filters.make}%"))
        if filters.model:
            stmt = stmt.where(Car.model.ilike(f"{filters.model}%"))
        if filters.year:
            stmt = stmt.where(Car.year == filters.year)
        if filters.min_year:
            stmt = stmt.where(Car.year >= filters.min_year)
        if filters.max_year:
            stmt = stmt.where(Car.year <= filters.max_year)
        if filters.fuel_type:
            stmt = stmt.where(Car.fuel_type == filters.fuel_type)
        if filters.transmission:
            stmt = stmt.where(Car.transmission == filters.transmission)
        if filters.city:
            stmt = stmt.where(Car.city.ilike(f"{filters.city}%"))
        if filters.state:
            stmt = stmt.where(Car.state.ilike(f"{filters.state}%"))
        if filters.min_price is not None:
            stmt = stmt.where(Car.asking_price >= filters.min_price)
        if filters.max_price is not None:
            stmt = stmt.where(Car.asking_price <= filters.max_price)
        if filters.min_mileage is not None:
            stmt = stmt.where(Car.odometer_km >= filters.min_mileage)
        if filters.max_mileage is not None:
            stmt = stmt.where(Car.odometer_km <= filters.max_mileage)
        if dealership_id:
            stmt = stmt.where(Car.dealership_id == dealership_id)

        if filters.body_type:
            stmt = stmt.where(Car.body_type == filters.body_type)
        if filters.ownership_count:
            stmt = stmt.where(Car.ownership_count == filters.ownership_count)
        
        # Get total count
        from sqlalchemy import func
        count_stmt = select(func.count()).select_from(stmt.subquery())
        total_result = await self.session.execute(count_stmt)
        total = total_result.scalar() or 0

        # Apply sort
        if filters.sort == 'price_asc':
            stmt = stmt.order_by(Car.asking_price.asc(), Car.id.desc())
        elif filters.sort == 'price_desc':
            stmt = stmt.order_by(Car.asking_price.desc(), Car.id.desc())
        elif filters.sort == 'year_desc':
            stmt = stmt.order_by(Car.year.desc(), Car.id.desc())
        elif filters.sort == 'km_asc':
            stmt = stmt.order_by(Car.odometer_km.asc(), Car.id.desc())
        else:
            stmt = stmt.order_by(Car.created_at.desc(), Car.id.desc())

        stmt = stmt.offset(filters.skip).limit(filters.limit)
        result = await self.session.execute(stmt)
        items = list(result.scalars().all())
        
        return {"items": items, "total": total}
