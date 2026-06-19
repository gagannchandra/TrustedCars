from pydantic import BaseModel, HttpUrl, Field
from uuid import UUID
from datetime import datetime


class ImageCreateRequest(BaseModel):
    car_id: UUID
    image_url: HttpUrl
    storage_key: str = Field(..., pattern=r"^[a-zA-Z0-9/_\.-]+$")
    sort_order: int = 0
    is_primary: bool = False


class ImageReorderRequest(BaseModel):
    image_id: UUID
    sort_order: int


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
