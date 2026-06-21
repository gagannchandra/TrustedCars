from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import or_, and_, func, cast, Text
from uuid import UUID
from app.modules.cars.models import Car, CarStatusEnum, ModerationStatusEnum
from app.modules.cars.schemas import CarSearchFilters


class CarRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def create_car(self, car: Car) -> Car:
        self.session.add(car)
        await self.session.flush()
        return car

    async def get_car_by_id(self, car_id: UUID) -> Car | None:
        result = await self.session.execute(
            select(Car).options(selectinload(Car.images)).where(Car.id == car_id, Car.deleted_at.is_(None))
        )
        return result.scalars().first()

    async def get_public_car_by_id(self, car_id: UUID) -> Car | None:
        result = await self.session.execute(
            select(Car).where(
                Car.id == car_id,
                Car.deleted_at.is_(None),
                Car.status == CarStatusEnum.active,
                Car.moderation_status == ModerationStatusEnum.approved.value,
            )
        )
        return result.scalars().first()

    async def get_cars_by_ids(self, car_ids: list[UUID]) -> list[Car]:
        result = await self.session.execute(
            select(Car).where(
                Car.id.in_(car_ids),
                Car.deleted_at.is_(None),
                Car.status == CarStatusEnum.active,
                Car.moderation_status == ModerationStatusEnum.approved.value,
            )
        )
        return list(result.scalars().all())

    def _build_search_stmt(
        self,
        filters: CarSearchFilters,
        dealership_id: UUID | None = None,
        seller_id: UUID | None = None,
    ):
        stmt = select(Car).options(selectinload(Car.images)).where(Car.deleted_at.is_(None))
        
        if seller_id:
            stmt = stmt.where(Car.status.in_([CarStatusEnum.pending, CarStatusEnum.active, CarStatusEnum.sold]))
        else:
            stmt = stmt.where(
                Car.status == CarStatusEnum.active,
                Car.moderation_status == ModerationStatusEnum.approved.value,
            )

        if seller_id:
            stmt = stmt.where(Car.user_id == seller_id)
        if filters.is_featured is not None:
            stmt = stmt.where(Car.is_featured == filters.is_featured)

        if filters.q:
            query_vector = func.plainto_tsquery('english', filters.q)
            stmt = stmt.where(Car.search_vector.op('@@')(query_vector))
            
        if filters.make:
            stmt = stmt.where(func.lower(Car.make).like(f"{filters.make.lower()}%"))
        if filters.model:
            stmt = stmt.where(func.lower(Car.model).like(f"{filters.model.lower()}%"))
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
            stmt = stmt.where(func.lower(Car.city).like(f"{filters.city.lower()}%"))
        if filters.state:
            stmt = stmt.where(func.lower(Car.state).like(f"{filters.state.lower()}%"))
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
            
        return stmt

    def _build_order(self, filters: CarSearchFilters):
        if filters.sort == 'price_asc':
            return [Car.asking_price.asc(), Car.id.desc()]
        elif filters.sort == 'price_desc':
            return [Car.asking_price.desc(), Car.id.desc()]
        elif filters.sort == 'year_desc':
            return [Car.year.desc(), Car.id.desc()]
        elif filters.sort == 'km_asc':
            return [Car.odometer_km.asc(), Car.id.desc()]
        else:
            if filters.q:
                query_vector = func.plainto_tsquery('english', filters.q)
                rank = func.ts_rank(Car.search_vector, query_vector)
                return [rank.desc(), Car.id.desc()]
            return [Car.created_at.desc(), Car.id.desc()]

    async def search_cars(
        self,
        filters: CarSearchFilters,
        dealership_id: UUID | None = None,
        seller_id: UUID | None = None,
    ):
        base_stmt = self._build_search_stmt(filters, dealership_id, seller_id)

        # Count query uses index-only scan if possible
        count_stmt = select(func.count()).select_from(base_stmt.subquery())
        total = await self.session.scalar(count_stmt) or 0

        # Data query
        data_stmt = (
            base_stmt
            .order_by(*self._build_order(filters))
            .offset(filters.skip)
            .limit(filters.limit)
        )
        result = await self.session.execute(data_stmt)
        items = list(result.scalars().all())

        return {"items": items, "total": total}
