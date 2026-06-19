from pydantic import BaseModel, ConfigDict, Field, field_validator
from uuid import UUID
from datetime import datetime


class ReviewCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")
    car_id: UUID
    rating: int = Field(..., ge=1, le=5)
    comment: str = Field(..., min_length=10, max_length=2000)

    @field_validator("comment")
    def validate_comment(cls, v):
        if not v.strip():
            raise ValueError("Comment cannot be empty or whitespace only")
        return v


class ReviewUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")
    rating: int = Field(..., ge=1, le=5)
    comment: str = Field(..., min_length=10, max_length=2000)

    @field_validator("comment")
    def validate_comment(cls, v):
        if not v.strip():
            raise ValueError("Comment cannot be empty or whitespace only")
        return v


class ReviewResponse(BaseModel):
    id: UUID
    reviewer_id: UUID
    seller_id: UUID
    car_id: UUID
    rating: int
    comment: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class PaginatedReviewResponse(BaseModel):
    items: list[ReviewResponse]
    total: int
    page: int
    page_size: int
