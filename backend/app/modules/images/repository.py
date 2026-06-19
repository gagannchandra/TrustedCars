from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import update
from uuid import UUID
from app.modules.images.models import CarImage
from datetime import datetime, timezone


class ImageRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_image_by_id(self, image_id: UUID) -> CarImage | None:
        result = await self.session.execute(
            select(CarImage).where(
                CarImage.id == image_id, CarImage.deleted_at.is_(None)
            )
        )
        return result.scalars().first()

    async def get_images_by_car_id(self, car_id: UUID) -> list[CarImage]:
        result = await self.session.execute(
            select(CarImage)
            .where(CarImage.car_id == car_id, CarImage.deleted_at.is_(None))
            .order_by(CarImage.sort_order.asc())
        )
        return list(result.scalars().all())

    async def get_images_for_update_by_car_id(self, car_id: UUID) -> list[CarImage]:
        result = await self.session.execute(
            select(CarImage)
            .where(CarImage.car_id == car_id, CarImage.deleted_at.is_(None))
            .order_by(CarImage.sort_order.asc())
            .with_for_update()
        )
        return list(result.scalars().all())

    async def get_primary_image_by_car_id(self, car_id: UUID) -> CarImage | None:
        result = await self.session.execute(
            select(CarImage).where(
                CarImage.car_id == car_id,
                CarImage.is_primary,
                CarImage.deleted_at.is_(None),
            )
        )
        return result.scalars().first()

    async def create_image(self, image: CarImage) -> CarImage:
        self.session.add(image)
        await self.session.flush()
        return image

    async def unset_primary_for_car(self, car_id: UUID):
        stmt = (
            update(CarImage)
            .where(CarImage.car_id == car_id, CarImage.is_primary)
            .values(is_primary=False)
        )
        await self.session.execute(stmt)
        await self.session.flush()

    async def update_image(self, image: CarImage) -> CarImage:
        self.session.add(image)
        await self.session.flush()
        return image

    async def soft_delete_image(self, image: CarImage) -> None:
        image.deleted_at = datetime.now(timezone.utc)
        self.session.add(image)
        await self.session.flush()
