from fastapi import APIRouter, Depends, Query, Request
from app.core.limiter import limiter
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID
from typing import List, Optional
from datetime import datetime
from app.db.session import get_db
from app.modules.cars.schemas import CarCreateRequest, CarUpdateRequest, CarResponse, PaginatedCarResponse, CarSearchFilters
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
@limiter.limit("60/minute")
async def search_cars(
    request: Request,
    filters: CarSearchFilters = Depends(),
    service: CarService = Depends(get_car_service),
):
    return await service.search_cars(filters, dealership_id=None)


@dealers_cars_router.get("/{id}/cars", response_model=PaginatedCarResponse)
async def get_dealer_cars(
    id: UUID,
    limit: int = Query(20, ge=1, le=100),
    skip: int = Query(0, ge=0),
    sort: Optional[str] = Query(None),
    service: CarService = Depends(get_car_service),
):
    filters = CarSearchFilters(limit=limit, skip=skip, sort=sort)
    return await service.search_cars(filters, dealership_id=id)
