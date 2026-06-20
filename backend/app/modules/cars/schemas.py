from pydantic import BaseModel, Field, ConfigDict
from typing import Optional
from uuid import UUID
from datetime import datetime
from app.modules.cars.models import (
    CarStatusEnum,
    FuelTypeEnum,
    TransmissionEnum,
    BodyTypeEnum,
)


class CarSearchFilters(BaseModel):
    q: Optional[str] = None
    make: Optional[str] = None
    model: Optional[str] = None
    min_year: Optional[int] = None
    max_year: Optional[int] = None
    year: Optional[int] = None
    fuel_type: Optional[FuelTypeEnum] = None
    transmission: Optional[TransmissionEnum] = None
    body_type: Optional[BodyTypeEnum] = None
    ownership_count: Optional[int] = None
    city: Optional[str] = None
    state: Optional[str] = None
    min_price: Optional[float] = None
    max_price: Optional[float] = None
    min_mileage: Optional[int] = None
    max_mileage: Optional[int] = None
    sort: Optional[str] = None
    limit: int = Field(20, ge=1, le=100)
    skip: int = Field(0, ge=0)


class CarCreateRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")
    make: str = Field(..., min_length=2, max_length=100)
    model: str = Field(..., min_length=1, max_length=100)
    variant: Optional[str] = Field(None, max_length=100)
    year: int = Field(..., ge=1900, le=2100)
    fuel_type: FuelTypeEnum
    transmission: TransmissionEnum
    body_type: BodyTypeEnum
    odometer_km: int = Field(..., ge=0)
    ownership_count: int = Field(..., ge=1)
    asking_price: float = Field(..., gt=0)
    city: str = Field(..., min_length=2, max_length=100)
    state: str = Field(..., min_length=2, max_length=100)
    description: Optional[str] = None


class CarUpdateRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")
    make: Optional[str] = Field(None, min_length=2, max_length=100)
    model: Optional[str] = Field(None, min_length=1, max_length=100)
    variant: Optional[str] = Field(None, max_length=100)
    year: Optional[int] = Field(None, ge=1900, le=2100)
    fuel_type: Optional[FuelTypeEnum] = None
    transmission: Optional[TransmissionEnum] = None
    body_type: Optional[BodyTypeEnum] = None
    odometer_km: Optional[int] = Field(None, ge=0)
    ownership_count: Optional[int] = Field(None, ge=1)
    asking_price: Optional[float] = Field(None, gt=0)
    city: Optional[str] = Field(None, min_length=2, max_length=100)
    state: Optional[str] = Field(None, min_length=2, max_length=100)
    description: Optional[str] = None


class CarResponse(BaseModel):
    id: UUID
    user_id: UUID
    dealership_id: Optional[UUID]
    make: str
    model: str
    variant: Optional[str]
    year: int
    fuel_type: FuelTypeEnum
    transmission: TransmissionEnum
    body_type: BodyTypeEnum
    odometer_km: int
    ownership_count: int
    asking_price: float
    city: str
    state: str
    description: Optional[str]
    quality_grade: Optional[str]
    status: CarStatusEnum
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}

class PaginatedCarResponse(BaseModel):
    items: list[CarResponse]
    total: int
