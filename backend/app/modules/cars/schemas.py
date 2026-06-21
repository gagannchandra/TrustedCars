from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List, Any
from uuid import UUID
from datetime import datetime
from app.modules.cars.models import (
    CarStatusEnum,
    FuelTypeEnum,
    TransmissionEnum,
    BodyTypeEnum,
)
from enum import Enum
from app.modules.images.schemas import ImageResponse

class SortOption(str, Enum):
    newest = "newest"
    price_asc = "price_asc"
    price_desc = "price_desc"
    year_desc = "year_desc"
    km_asc = "km_asc"


class CarSearchFilters(BaseModel):
    q: Optional[str] = Field(None, max_length=100)
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
    is_featured: Optional[bool] = None
    min_price: Optional[float] = None
    max_price: Optional[float] = None
    min_mileage: Optional[int] = None
    max_mileage: Optional[int] = None
    sort: Optional[SortOption] = None
    limit: int = Field(20, ge=1, le=100)
    skip: int = Field(0, ge=0, le=10000)


class CarCreateRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")
    make: str = Field(..., min_length=2, max_length=100)
    model: str = Field(..., min_length=1, max_length=100)
    variant: Optional[str] = Field(None, max_length=100)
    year: int = Field(..., ge=1900, le=datetime.now().year + 1)
    fuel_type: FuelTypeEnum
    transmission: TransmissionEnum
    body_type: BodyTypeEnum
    odometer_km: int = Field(..., ge=0)
    ownership_count: int = Field(..., ge=1)
    asking_price: float = Field(..., gt=0)
    city: str = Field(..., min_length=2, max_length=100)
    state: str = Field(..., min_length=2, max_length=100)
    description: Optional[str] = None
    registration_number: Optional[str] = None
    color: Optional[str] = None
    has_service_history: bool = False
    has_invoice: bool = False
    has_insurance: bool = False
    is_negotiable: bool = False
    accident_history: bool = False


class CarUpdateRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")
    make: Optional[str] = Field(None, min_length=2, max_length=100)
    model: Optional[str] = Field(None, min_length=1, max_length=100)
    variant: Optional[str] = Field(None, max_length=100)
    year: Optional[int] = Field(None, ge=1900, le=datetime.now().year + 1)
    fuel_type: Optional[FuelTypeEnum] = None
    transmission: Optional[TransmissionEnum] = None
    body_type: Optional[BodyTypeEnum] = None
    odometer_km: Optional[int] = Field(None, ge=0)
    ownership_count: Optional[int] = Field(None, ge=1)
    asking_price: Optional[float] = Field(None, gt=0)
    city: Optional[str] = Field(None, min_length=2, max_length=100)
    state: Optional[str] = Field(None, min_length=2, max_length=100)
    description: Optional[str] = None
    registration_number: Optional[str] = None
    color: Optional[str] = None
    has_service_history: Optional[bool] = None
    has_invoice: Optional[bool] = None
    has_insurance: Optional[bool] = None
    is_negotiable: Optional[bool] = None
    accident_history: Optional[bool] = None


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
    registration_number: Optional[str]
    color: Optional[str]
    has_service_history: bool
    has_invoice: bool
    has_insurance: bool
    is_negotiable: bool
    accident_history: bool
    status: CarStatusEnum
    created_at: datetime
    updated_at: datetime
    images: List[ImageResponse] = []

    model_config = {"from_attributes": True}

class PaginatedCarResponse(BaseModel):
    items: list[CarResponse]
    total: int
