from fastapi import APIRouter, Depends
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
from app.shared.dependencies.auth import get_current_active_user
from app.modules.auth.models import User
from app.shared.interfaces.cars import CarOwnershipProvider
from app.core.dependencies import get_car_provider

from app.shared.exceptions.handlers import CustomException
from fastapi import UploadFile, File
from app.shared.storage.dependencies import get_storage_provider
from app.shared.storage.provider import StorageProvider

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


@car_images_router.post("/{car_id}/images/upload-url", response_model=PresignedUrlResponse)
async def generate_presigned_url(
    car_id: UUID,
    req: PresignedUrlRequest,
    current_user: User = Depends(get_current_active_user),
    service: ImageService = Depends(get_image_service),
    storage: StorageProvider = Depends(get_storage_provider),
):
    # Verify the user is authorized to edit the car before granting a presigned URL
    await service._verify_ownership(car_id, current_user)
    
    return storage.generate_presigned_upload_url(
        file_extension=req.file_extension,
        content_type=req.content_type
    )

@car_images_router.post("/{car_id}/images/upload", response_model=ImageResponse)
async def direct_image_upload(
    car_id: UUID,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_active_user),
    service: ImageService = Depends(get_image_service),
    storage: StorageProvider = Depends(get_storage_provider),
):
    import uuid
    import mimetypes
    
    await service._verify_ownership(car_id, current_user)
    
    content_type = file.content_type or "image/jpeg"
    allowed_types = {"image/jpeg", "image/png", "image/webp"}
    if content_type not in allowed_types:
        raise CustomException(400, "Invalid content type. Only JPEG, PNG, and WebP are allowed.")
    ext = mimetypes.guess_extension(content_type) or ".jpg"
    
    # In a real system, you'd use aioboto3 to stream the file.boto3 is sync so we read it all into memory here
    # Since we are using S3 presigned URLs mostly, this is a fallback.
    file_bytes = await file.read()
    
    if content_type == "image/jpeg" and not file_bytes.startswith(b"\xff\xd8\xff"):
        raise CustomException(400, "Invalid image content")
    elif content_type == "image/png" and not file_bytes.startswith(b"\x89PNG\r\n\x1a\n"):
        raise CustomException(400, "Invalid image content")
    elif content_type == "image/webp" and not (file_bytes.startswith(b"RIFF") and file_bytes[8:12] == b"WEBP"):
        raise CustomException(400, "Invalid image content")
    
    storage_key = f"{uuid.uuid4()}{ext}"
    try:
        # storage.s3_client is a synchronous boto3 client.
        storage.s3_client.put_object(
            Bucket=storage.bucket,
            Key=storage_key,
            Body=file_bytes,
            ContentType=content_type,
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
    car_id: UUID, service: ImageService = Depends(get_image_service)
):
    return await service.get_car_images(car_id)
