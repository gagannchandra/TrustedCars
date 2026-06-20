from fastapi import APIRouter, Depends, Query, Request
from app.core.limiter import limiter
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional
from datetime import datetime
from uuid import UUID
from app.db.session import get_db
from app.modules.wishlist.schemas import (
    WishlistEntryResponse,
    WishlistStatusResponse,
    PaginatedWishlistResponse,
)
from app.modules.wishlist.service import WishlistService
from app.shared.dependencies.auth import get_current_active_user
from app.modules.auth.models import User

router = APIRouter(tags=["Wishlist"])


def get_wishlist_service(session: AsyncSession = Depends(get_db)) -> WishlistService:
    return WishlistService(session)


@router.post("/{car_id}", response_model=WishlistEntryResponse)
@limiter.limit("60/minute")
async def add_to_wishlist(
    request: Request,
    car_id: UUID,
    current_user: User = Depends(get_current_active_user),
    service: WishlistService = Depends(get_wishlist_service),
):
    return await service.add_to_wishlist(car_id, current_user)


@router.delete("/{car_id}", status_code=204)
@limiter.limit("60/minute")
async def remove_from_wishlist(
    request: Request,
    car_id: UUID,
    current_user: User = Depends(get_current_active_user),
    service: WishlistService = Depends(get_wishlist_service),
):
    await service.remove_from_wishlist(car_id, current_user)


@router.get("", response_model=PaginatedWishlistResponse)
async def list_wishlist(
    cursor: Optional[datetime] = Query(None),
    limit: int = Query(50, ge=1, le=100),
    current_user: User = Depends(get_current_active_user),
    service: WishlistService = Depends(get_wishlist_service),
):
    return await service.list_wishlist(current_user, cursor, limit)


@router.get("/{car_id}/status", response_model=WishlistStatusResponse)
async def check_wishlist_status(
    car_id: UUID,
    current_user: User = Depends(get_current_active_user),
    service: WishlistService = Depends(get_wishlist_service),
):
    return await service.check_status(car_id, current_user)
