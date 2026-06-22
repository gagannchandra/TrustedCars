from fastapi import APIRouter, Depends, Query, Request
from app.core.limiter import limiter
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID
from typing import Optional
from fastapi import Response
from app.db.session import get_db
from app.modules.cars.schemas import CarCreateRequest, CarUpdateRequest, CarResponse, PaginatedCarResponse, CarSearchFilters
from app.modules.cars.service import CarService
from app.shared.dependencies.auth import get_current_active_user, get_current_user_optional
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


@router.post("", response_model=CarResponse, status_code=201)
@limiter.limit("10/minute")
async def create_car(
    request: Request,
    req: CarCreateRequest,
    current_user: User = Depends(get_current_active_user),
    service: CarService = Depends(get_car_service),
):
    return await service.create_car(req, current_user)


@router.put("/{id}", response_model=CarResponse)
@limiter.limit("30/minute")
async def update_car(
    request: Request,
    id: UUID,
    req: CarUpdateRequest,
    current_user: User = Depends(get_current_active_user),
    service: CarService = Depends(get_car_service),
):
    return await service.update_car(id, req, current_user)


@router.delete("/{id}", status_code=204)
@limiter.limit("10/minute")
async def delete_car(
    request: Request,
    id: UUID,
    current_user: User = Depends(get_current_active_user),
    service: CarService = Depends(get_car_service),
):
    await service.soft_delete_car(id, current_user)
    return Response(status_code=204)


@router.get("/mine", response_model=PaginatedCarResponse)
async def get_my_cars(
    limit: int = Query(20, ge=1, le=100),
    skip: int = Query(0, ge=0),
    sort: Optional[str] = Query(None),
    current_user: User = Depends(get_current_active_user),
    service: CarService = Depends(get_car_service),
):
    filters = CarSearchFilters(limit=limit, skip=skip, sort=sort)
    return await service.search_cars(filters, seller_id=current_user.id)


@router.get("/{id}", response_model=CarResponse)
@limiter.limit("120/minute")
async def get_car(
    request: Request,
    id: UUID, 
    current_user: User | None = Depends(get_current_user_optional),
    service: CarService = Depends(get_car_service)
):
    from app.modules.cars.models import CarStatusEnum, ModerationStatusEnum
    from app.shared.exceptions.handlers import CustomException
    
    try:
        car = await service.get_car(id)
    except CustomException:
        raise CustomException(404, "Car not found or unavailable")
        
    if car.status == CarStatusEnum.active and car.moderation_status == ModerationStatusEnum.approved.value:
        return car
        
    if current_user and current_user.id == car.user_id:
        return car
        
    raise CustomException(404, "Car not found or unavailable")


@router.post("/batch", response_model=list[CarResponse])
@limiter.limit("30/minute")
async def get_cars_batch(
    request: Request,
    ids: list[UUID],
    service: CarService = Depends(get_car_service),
):
    if not ids:
        return []
    if len(ids) > 50:
        from app.shared.exceptions.handlers import CustomException
        raise CustomException(400, "Batch size cannot exceed 50 items")
    return await service.get_cars_by_ids(ids)

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
    filters: CarSearchFilters = Depends(),
    service: CarService = Depends(get_car_service),
):
    await service.assert_dealer_exists(id)
    return await service.search_cars(filters, dealership_id=id)
