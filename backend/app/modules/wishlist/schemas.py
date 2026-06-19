from pydantic import BaseModel
from uuid import UUID
from datetime import datetime


class WishlistStatusResponse(BaseModel):
    is_wishlisted: bool


class WishlistCarSummary(BaseModel):
    id: UUID
    make: str
    model: str
    year: int
    asking_price: float
    status: str

    class Config:
        from_attributes = True


class WishlistEntryResponse(BaseModel):
    id: UUID
    user_id: UUID
    car_id: UUID
    created_at: datetime
    car: WishlistCarSummary | None = None

    class Config:
        from_attributes = True


class PaginatedWishlistResponse(BaseModel):
    items: list[WishlistEntryResponse]
    total: int
    page: int
    page_size: int
