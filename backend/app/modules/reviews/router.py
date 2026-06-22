from fastapi import APIRouter, Depends, Query, Request
from app.core.limiter import limiter
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional
from datetime import datetime
from uuid import UUID
from app.db.session import get_db
from app.modules.reviews.schemas import (
    ReviewCreate,
    ReviewUpdate,
    ReviewResponse,
    PaginatedReviewResponse,
)
from app.modules.reviews.service import ReviewsService
from app.shared.dependencies.auth import get_current_active_user
from app.modules.auth.models import User

router = APIRouter(prefix="/api/v1/reviews", tags=["Reviews"])
user_reviews_router = APIRouter(prefix="/api/v1/users", tags=["Reviews"])


def get_reviews_service(session: AsyncSession = Depends(get_db)) -> ReviewsService:
    return ReviewsService(session)


@router.post("", response_model=ReviewResponse)
@limiter.limit("20/minute")
async def create_review(
    request: Request,
    req: ReviewCreate,
    current_user: User = Depends(get_current_active_user),
    service: ReviewsService = Depends(get_reviews_service),
):
    return await service.create_review(req, current_user)


@router.get("/me", response_model=PaginatedReviewResponse)
@limiter.limit("30/minute")
async def get_my_reviews(
    request: Request,
    cursor: Optional[datetime] = Query(None),
    limit: int = Query(50, ge=1, le=100),
    current_user: User = Depends(get_current_active_user),
    service: ReviewsService = Depends(get_reviews_service),
):
    # Retrieve reviews where current_user is the seller
    return await service.list_seller_reviews(current_user.id, cursor, limit)

@router.get("/{id}", response_model=ReviewResponse)
@limiter.limit("60/minute")
async def get_review(request: Request, id: UUID, service: ReviewsService = Depends(get_reviews_service)):
    # Public endpoint — no auth required. Service returns None user, access is not restricted.
    return await service.get_review(id, None)


@router.put("/{id}", response_model=ReviewResponse)
async def update_review(
    id: UUID,
    req: ReviewUpdate,
    current_user: User = Depends(get_current_active_user),
    service: ReviewsService = Depends(get_reviews_service),
):
    return await service.update_review(id, req, current_user)


@router.delete("/{id}", status_code=204)
async def delete_review(
    id: UUID,
    current_user: User = Depends(get_current_active_user),
    service: ReviewsService = Depends(get_reviews_service),
):
    await service.delete_review(id, current_user)


@user_reviews_router.get("/{seller_id}/reviews", response_model=PaginatedReviewResponse)
@limiter.limit("30/minute")
async def list_seller_reviews(
    request: Request,
    seller_id: UUID,
    cursor: Optional[datetime] = Query(None),
    limit: int = Query(50, ge=1, le=100),
    service: ReviewsService = Depends(get_reviews_service),
):
    return await service.list_seller_reviews(seller_id, cursor, limit)
