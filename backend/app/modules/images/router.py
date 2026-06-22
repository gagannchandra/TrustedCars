from fastapi import APIRouter, Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID
from app.db.session import get_db
from app.modules.images.schemas import (
    ImageCreateRequest,
    ImageReorderRequest,
    ImageResponse,
    PresignedUrlRequest,
    PresignedUrlResponse,
)
from app.modules.images.service import ImageService
from app.shared.dependencies.auth import get_current_active_user, get_current_user_optional
from app.modules.auth.models import User
from app.shared.interfaces.cars import CarOwnershipProvider
from app.core.dependencies import get_car_provider

from app.shared.exceptions.handlers import CustomException
from fastapi import UploadFile, File
from app.shared.storage.dependencies import get_storage_provider
from app.shared.storage.provider import StorageProvider

import aioboto3
from app.core.config import settings

router = APIRouter(tags=["Images"])
car_images_router = APIRouter(tags=["Car Images"])
s3_session = aioboto3.Session()


def get_image_service(
    session: AsyncSession = Depends(get_db),
    car_provider: CarOwnershipProvider = Depends(get_car_provider),
    storage: StorageProvider = Depends(get_storage_provider),
) -> ImageService:
    return ImageService(session, car_provider, storage)



@router.get("/car/{car_id}", response_model=list[ImageResponse])
async def get_car_images(
    car_id: UUID, 
    current_user: User | None = Depends(get_current_user_optional),
    service: ImageService = Depends(get_image_service)
):
    return await service.get_car_images(car_id, current_user)


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



@car_images_router.post("/{car_id}/images/upload", response_model=ImageResponse)
async def direct_image_upload(
    request: Request,
    car_id: UUID,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_active_user),
    service: ImageService = Depends(get_image_service),
    storage: StorageProvider = Depends(get_storage_provider),
):
    import uuid
    import mimetypes

    MAX_SIZE = 10 * 1024 * 1024  # 10 MB

    # Server-side Content-Length check before reading any data
    content_length = request.headers.get("content-length")
    if content_length:
        try:
            if int(content_length) > MAX_SIZE:
                raise CustomException(400, "File size exceeds 10MB limit")
        except ValueError:
            raise CustomException(400, "Invalid Content-Length header")

    # Fallback: check file.size attribute if available (multipart metadata)
    if getattr(file, "size", None) and file.size > MAX_SIZE:
        raise CustomException(400, "File size exceeds 10MB limit")
        
    await service._verify_ownership(car_id, current_user)
    
    content_type = file.content_type or "image/jpeg"
    allowed_types = {"image/jpeg", "image/png", "image/webp"}
    if content_type not in allowed_types:
        raise CustomException(400, "Invalid content type. Only JPEG, PNG, and WebP are allowed.")
    ext = mimetypes.guess_extension(content_type) or ".jpg"
    
    header = await file.read(12)
    if content_type == "image/jpeg" and not header.startswith(b"\xff\xd8\xff"):
        raise CustomException(400, "Invalid image content")
    elif content_type == "image/png" and not header.startswith(b"\x89PNG\r\n\x1a\n"):
        raise CustomException(400, "Invalid image content")
    elif content_type == "image/webp" and not (header.startswith(b"RIFF") and header[8:12] == b"WEBP"):
        raise CustomException(400, "Invalid image content")
    
    await file.seek(0)
    
    storage_key = f"{uuid.uuid4()}{ext}"
    try:
        s3_endpoint = settings.S3_ENDPOINT_URL if hasattr(settings, 'S3_ENDPOINT_URL') and settings.S3_ENDPOINT_URL else None
        s3_region = settings.S3_REGION_NAME if hasattr(settings, 'S3_REGION_NAME') and settings.S3_REGION_NAME else None
        
        async with s3_session.client("s3", endpoint_url=s3_endpoint, region_name=s3_region) as s3:
            await s3.upload_fileobj(
                file.file,
                storage.bucket,
                storage_key,
                ExtraArgs={"ContentType": content_type},
            )
    except Exception as e:
        raise CustomException(500, f"Upload failed: {str(e)}")
        
    public_url = storage.get_public_url(storage_key)
    
    req = ImageCreateRequest(
        car_id=car_id,
        image_url=public_url,
        storage_key=storage_key,
        sort_order=0,
        is_primary=False
    )
    return await service.upload_image_metadata(req, current_user)


@car_images_router.get("/{car_id}/images", response_model=list[ImageResponse])
async def get_images_for_car(
    car_id: UUID, 
    current_user: User | None = Depends(get_current_user_optional),
    service: ImageService = Depends(get_image_service)
):
    return await service.get_car_images(car_id, current_user)
