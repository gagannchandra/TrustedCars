from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID
from typing import List, Optional
from datetime import datetime
from app.db.session import get_db
from app.modules.cars.schemas import CarCreateRequest, CarUpdateRequest, CarResponse, PaginatedCarResponse
from app.modules.cars.service import CarService
from app.shared.dependencies.auth import get_current_active_user
from app.shared.interfaces.dealers import DealerAuthorizationProvider
from app.core.dependencies import get_dealer_provider
from app.modules.auth.models import User

router = APIRouter(tags=["Cars"])
dealers_cars_router = APIRouter(tags=["Dealers Cars"])


def get_car_service(
    session: AsyncSession = Depends(get_db),
    dealer_provider: DealerAuthorizationProvider = Depends(get_dealer_provider),
) -> CarService:
    return CarService(session, dealer_provider)


@router.post("", response_model=CarResponse)
async def create_car(
    req: CarCreateRequest,
    current_user: User = Depends(get_current_active_user),
    service: CarService = Depends(get_car_service),
):
    return await service.create_car(req, current_user)


@router.put("/{id}", response_model=CarResponse)
async def update_car(
    id: UUID,
    req: CarUpdateRequest,
    current_user: User = Depends(get_current_active_user),
    service: CarService = Depends(get_car_service),
):
    return await service.update_car(id, req, current_user)


@router.delete("/{id}")
async def delete_car(
    id: UUID,
    current_user: User = Depends(get_current_active_user),
    service: CarService = Depends(get_car_service),
):
    await service.soft_delete_car(id, current_user)
    return {"detail": "Car deleted successfully"}


@router.get("/{id}", response_model=CarResponse)
async def get_car(id: UUID, service: CarService = Depends(get_car_service)):
    return await service.get_public_car(id)


@router.get("", response_model=PaginatedCarResponse)
async def search_cars(
    q: Optional[str] = None,
    make: Optional[str] = None,
    model: Optional[str] = None,
    min_year: Optional[int] = None,
    max_year: Optional[int] = None,
    year: Optional[int] = None,
    fuel_type: Optional[str] = None,
    transmission: Optional[str] = None,
    body_type: Optional[str] = None,
    ownership_count: Optional[int] = None,
    city: Optional[str] = None,
    state: Optional[str] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    min_mileage: Optional[int] = None,
    max_mileage: Optional[int] = None,
    sort: Optional[str] = Query(None),
    limit: int = Query(20, ge=1, le=100),
    skip: int = Query(0, ge=0),
    service: CarService = Depends(get_car_service),
):
    return await service.search_cars(
        q=q,
        make=make,
        model=model,
        min_year=min_year,
        max_year=max_year,
        year=year,
        fuel_type=fuel_type,
        transmission=transmission,
        body_type=body_type,
        ownership_count=ownership_count,
        city=city,
        state=state,
        min_price=min_price,
        max_price=max_price,
        min_mileage=min_mileage,
        max_mileage=max_mileage,
        dealership_id=None,
        sort=sort,
        limit=limit,
        skip=skip,
    )


@dealers_cars_router.get("/{id}/cars", response_model=PaginatedCarResponse)
async def get_dealer_cars(
    id: UUID,
    limit: int = Query(20, ge=1, le=100),
    skip: int = Query(0, ge=0),
    sort: Optional[str] = Query(None),
    service: CarService = Depends(get_car_service),
):
    return await service.search_cars(
        q=None,
        make=None,
        model=None,
        min_year=None,
        max_year=None,
        year=None,
        fuel_type=None,
        transmission=None,
        body_type=None,
        ownership_count=None,
        city=None,
        state=None,
        min_price=None,
        max_price=None,
        min_mileage=None,
        max_mileage=None,
        dealership_id=id,
        sort=sort,
        limit=limit,
        skip=skip,
    )
