from pydantic import BaseModel, Field
from uuid import UUID
from datetime import datetime
from app.modules.inquiries.models import InquiryStatusEnum


class MessageCreate(BaseModel):
    message: str = Field(
        ..., min_length=1, max_length=5000, json_schema_extra={"strip_whitespace": True}
    )


class InquiryCreate(BaseModel):
    car_id: UUID
    initial_message: str = Field(
        ..., min_length=1, max_length=5000, json_schema_extra={"strip_whitespace": True}
    )


class MessageResponse(BaseModel):
    id: UUID
    inquiry_id: UUID
    sender_id: UUID
    message: str
    created_at: datetime

    class Config:
        from_attributes = True


class CarSummaryResponse(BaseModel):
    id: UUID
    make: str
    model: str
    year: int
    asking_price: float
    status: str

    class Config:
        from_attributes = True


class InquiryResponse(BaseModel):
    id: UUID
    car_id: UUID
    buyer_id: UUID
    seller_id: UUID
    status: InquiryStatusEnum
    created_at: datetime
    updated_at: datetime
    car: CarSummaryResponse | None = None

    class Config:
        from_attributes = True


class InquiryDetailResponse(InquiryResponse):
    pass


class PaginatedMessageResponse(BaseModel):
    items: list[MessageResponse]
    total: int
    page: int
    page_size: int
