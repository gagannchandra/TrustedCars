from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.exc import IntegrityError
from uuid import UUID
from app.modules.images.repository import ImageRepository
from app.modules.images.schemas import ImageCreateRequest, ImageReorderRequest
from app.modules.images.models import CarImage
from app.modules.auth.models import User
from app.shared.interfaces.cars import CarOwnershipProvider
from app.shared.audit.service import AuditService
from app.shared.exceptions.handlers import CustomException


class ImageService:
    def __init__(self, session: AsyncSession, car_provider: CarOwnershipProvider):
        self.repository = ImageRepository(session)
        self.session = session
        self.car_provider = car_provider

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

    async def _verify_ownership(self, car_id: UUID, current_user: User):
        is_authorized = await self.car_provider.verify_user_can_edit_car(
            car_id, current_user
        )
        if not is_authorized:
            raise CustomException(403, "Not authorized to manage images for this car")

    async def upload_image_metadata(
        self, req: ImageCreateRequest, current_user: User
    ) -> CarImage:
        await self._verify_ownership(req.car_id, current_user)

        MAX_IMAGES_PER_CAR = 20
        existing_images = await self.repository.get_images_by_car_id(req.car_id)
        if len(existing_images) >= MAX_IMAGES_PER_CAR:
            raise CustomException(400, f"Maximum of {MAX_IMAGES_PER_CAR} images per listing reached")

        # Check if we need to set primary
        if req.is_primary:
            await self.repository.unset_primary_for_car(req.car_id)
        else:
            # If this is the first image, make it primary automatically
            if not existing_images:
                req.is_primary = True

        image = CarImage(
            car_id=req.car_id,
            image_url=req.image_url,
            storage_key=req.storage_key,
            sort_order=req.sort_order,
            is_primary=req.is_primary,
        )

        try:
            await self.repository.create_image(image)
            await self._log_audit(
                current_user.id,
                "UPLOAD_IMAGE",
                req.car_id,
                None,
                f"Uploaded image for car {req.car_id}",
            )
            await self.session.commit()
            return image
        except IntegrityError:
            await self.session.rollback()
            raise CustomException(
                400, "Duplicate storage_key or primary image conflict"
            )

    async def get_car_images(self, car_id: UUID) -> list[CarImage]:
        return await self.repository.get_images_by_car_id(car_id)

    async def set_primary_image(self, image_id: UUID, current_user: User) -> CarImage:
        image = await self.repository.get_image_by_id(image_id)
        if not image:
            raise CustomException(404, "Image not found")

        await self._verify_ownership(image.car_id, current_user)

        await self.repository.unset_primary_for_car(image.car_id)
        image.is_primary = True

        try:
            await self.repository.update_image(image)
            await self._log_audit(
                current_user.id,
                "SET_PRIMARY_IMAGE",
                image_id,
                None,
                f"Set primary image {image_id}",
            )
            await self.session.commit()
            return image
        except IntegrityError:
            await self.session.rollback()
            raise CustomException(400, "Primary image conflict")

    async def reorder_images(
        self, car_id: UUID, reqs: list[ImageReorderRequest], current_user: User
    ):
        if len(reqs) > 50:
            raise CustomException(400, "Too many images to reorder")

        sort_orders = [r.sort_order for r in reqs]
        if len(sort_orders) != len(set(sort_orders)):
            raise CustomException(400, "Duplicate sort_order values are not allowed")

        await self._verify_ownership(car_id, current_user)

        images = await self.repository.get_images_by_car_id(car_id)
        image_map = {img.id: img for img in images}

        for req in reqs:
            if req.image_id not in image_map:
                raise CustomException(
                    400, f"Image {req.image_id} does not belong to this car"
                )
            image_map[req.image_id].sort_order = req.sort_order

        await self._log_audit(
            current_user.id,
            "REORDER_IMAGES",
            car_id,
            None,
            f"Reordered images for car {car_id}",
        )
        await self.session.commit()
        return await self.repository.get_images_by_car_id(car_id)

    async def delete_image(self, image_id: UUID, current_user: User):
        image = await self.repository.get_image_by_id(image_id)
        if not image:
            raise CustomException(404, "Image not found")

        await self._verify_ownership(image.car_id, current_user)

        await self.repository.soft_delete_image(image)

        # If it was primary, try to set a new primary safely using SELECT FOR UPDATE
        if image.is_primary:
            remaining = await self.repository.get_images_for_update_by_car_id(
                image.car_id
            )
            if remaining:
                remaining[0].is_primary = True
                await self.repository.update_image(remaining[0])

        await self._log_audit(
            current_user.id, "DELETE_IMAGE", image_id, None, f"Deleted image {image_id}"
        )
        await self.session.commit()

    async def handle_car_deleted(self, car_id: UUID):
        from sqlalchemy import update
        from datetime import datetime, timezone

        now = datetime.now(timezone.utc)
        stmt = (
            update(CarImage)
            .where(CarImage.car_id == car_id, CarImage.deleted_at.is_(None))
            .values(deleted_at=now)
        )
        await self.session.execute(stmt)

    async def handle_cars_bulk_deleted(self, car_ids: list[str]):
        if not car_ids:
            return
        from sqlalchemy import update
        from datetime import datetime, timezone

        now = datetime.now(timezone.utc)
        uuids = [UUID(cid) for cid in car_ids]
        chunk_size = 1000
        for i in range(0, len(uuids), chunk_size):
            chunk = uuids[i : i + chunk_size]
            stmt = (
                update(CarImage)
                .where(CarImage.car_id.in_(chunk), CarImage.deleted_at.is_(None))
                .values(deleted_at=now)
            )
            await self.session.execute(stmt)
