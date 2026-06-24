from pydantic import BaseModel, ConfigDict, HttpUrl, Field
from uuid import UUID
from datetime import datetime


class ImageCreateRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")
    car_id: UUID
    image_url: str  # Changed from HttpUrl to str to avoid Pydantic Url type in database
    storage_key: str = Field(..., pattern=r"^[a-zA-Z0-9/_\.-]+$")
    sort_order: int = 0
    is_primary: bool = False


class ImageReorderRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")
    image_id: UUID
    sort_order: int


class PresignedUrlRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")
    file_extension: str = Field(..., pattern=r"^\.[a-zA-Z0-9]+$")
    content_type: str = Field(..., pattern=r"^image/[a-zA-Z0-9]+$")


class PresignedUrlResponse(BaseModel):
    upload_url: str
    storage_key: str
    public_url: str


class ImageResponse(BaseModel):
    id: UUID
    car_id: UUID
    image_url: str
    storage_key: str
    sort_order: int
    is_primary: bool
    created_at: datetime

    class Config:
        from_attributes = True
