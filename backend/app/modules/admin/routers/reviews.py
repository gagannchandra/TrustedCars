import uuid
from fastapi import APIRouter, Depends, Query, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from pydantic import BaseModel
from typing import List

from app.db.session import get_db
from app.modules.auth.models import User
from app.shared.rbac.dependencies import RequirePermissions
from app.shared.rbac.permissions import PermissionEnum
from app.modules.admin.services.moderation import AdminModerationService
from app.core.limiter import limiter, get_user_or_ip
from app.modules.reviews.models import Review
from app.modules.reviews.schemas import ReviewResponse

router = APIRouter(prefix="/reviews", tags=["admin-reviews"])

class PaginatedReviewResponse(BaseModel):
    items: List[ReviewResponse]
    total: int


@router.get("", response_model=PaginatedReviewResponse)
async def list_all_reviews(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    include_deleted: bool = Query(False),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(RequirePermissions([PermissionEnum.DELETE_REVIEW])),
):
    stmt = select(Review)
    if not include_deleted:
        stmt = stmt.where(Review.deleted_at.is_(None))
        
    total = await db.scalar(select(func.count()).select_from(stmt.subquery()))
    result = await db.execute(stmt.order_by(Review.created_at.desc()).offset(skip).limit(limit))
    return {"items": result.scalars().all(), "total": total}


@router.delete("/{id}")
@limiter.limit("10/minute", key_func=get_user_or_ip)
async def delete_review(
    request: Request,
    id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(RequirePermissions([PermissionEnum.DELETE_REVIEW])),
):
    await AdminModerationService(db).delete_review(current_user, id)
    return {"status": "success"}


@router.post("/{id}/restore")
async def restore_review(
    id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(RequirePermissions([PermissionEnum.RESTORE_REVIEW])),
):
    await AdminModerationService(db).restore_review(current_user, id)
    return {"status": "success"}
