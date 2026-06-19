from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID
from app.db.session import get_db
from app.modules.images.schemas import (
    ImageCreateRequest,
    ImageReorderRequest,
    ImageResponse,
)
from app.modules.images.service import ImageService
from app.shared.dependencies.auth import get_current_active_user
from app.modules.auth.models import User
from app.shared.interfaces.cars import CarOwnershipProvider
from app.core.dependencies import get_car_provider

from app.shared.exceptions.handlers import CustomException

router = APIRouter(tags=["Images"])
car_images_router = APIRouter(tags=["Car Images"])


def get_image_service(
    session: AsyncSession = Depends(get_db),
    car_provider: CarOwnershipProvider = Depends(get_car_provider),
) -> ImageService:
    return ImageService(session, car_provider)


@router.post("", response_model=ImageResponse)
async def upload_image_metadata(
    req: ImageCreateRequest,
    current_user: User = Depends(get_current_active_user),
    service: ImageService = Depends(get_image_service),
):
    return await service.upload_image_metadata(req, current_user)


@router.get("/car/{car_id}", response_model=list[ImageResponse])
async def get_car_images(
    car_id: UUID, service: ImageService = Depends(get_image_service)
):
    return await service.get_car_images(car_id)


@router.put("/{image_id}/primary", response_model=ImageResponse)
async def set_primary_image(
    image_id: UUID,
    current_user: User = Depends(get_current_active_user),
    service: ImageService = Depends(get_image_service),
):
    return await service.set_primary_image(image_id, current_user)


@router.put("/car/{car_id}/reorder", response_model=list[ImageResponse])
async def reorder_images(
    car_id: UUID,
    reqs: list[ImageReorderRequest],
    current_user: User = Depends(get_current_active_user),
    service: ImageService = Depends(get_image_service),
):
    return await service.reorder_images(car_id, reqs, current_user)


@router.delete("/{image_id}", status_code=204)
async def delete_image(
    image_id: UUID,
    current_user: User = Depends(get_current_active_user),
    service: ImageService = Depends(get_image_service),
):
    await service.delete_image(image_id, current_user)


@car_images_router.post("/{car_id}/images", response_model=ImageResponse)
async def upload_image_metadata_for_car(
    car_id: UUID,
    req: ImageCreateRequest,
    current_user: User = Depends(get_current_active_user),
    service: ImageService = Depends(get_image_service),
):
    if req.car_id != car_id:
        raise CustomException(400, "URL car_id does not match request body")
    return await service.upload_image_metadata(req, current_user)


@car_images_router.get("/{car_id}/images", response_model=list[ImageResponse])
async def get_images_for_car(
    car_id: UUID, service: ImageService = Depends(get_image_service)
):
    return await service.get_car_images(car_id)
