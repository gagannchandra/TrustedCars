import uuid
from datetime import datetime
from fastapi import APIRouter, Depends, Query, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from pydantic import BaseModel
from typing import List

from app.db.session import get_db
from app.modules.auth.models import User, Dealership
from app.shared.rbac.dependencies import RequirePermissions
from app.shared.rbac.permissions import PermissionEnum
from app.modules.admin.services.moderation import AdminModerationService
from app.modules.admin.schemas import ModerateDealerRequest
from app.core.limiter import limiter, get_user_or_ip

router = APIRouter(prefix="/dealers", tags=["admin-dealers"])


class DealerResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    name: str
    is_suspended: bool
    created_at: datetime
    deleted_at: datetime | None = None
    model_config = {"from_attributes": True}


class PaginatedDealerResponse(BaseModel):
    items: List[DealerResponse]
    total: int


@router.get("", response_model=PaginatedDealerResponse)
async def list_all_dealers(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    q: str | None = Query(None),
    include_deleted: bool = Query(False),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(RequirePermissions([PermissionEnum.SUSPEND_DEALER])),
):
    stmt = select(Dealership)
    if not include_deleted:
        stmt = stmt.where(Dealership.deleted_at.is_(None))
    if q:
        stmt = stmt.where(func.lower(Dealership.name).like(f"%{q.lower()}%"))
        
    total = await db.scalar(select(func.count()).select_from(stmt.subquery()))
    result = await db.execute(stmt.order_by(Dealership.created_at.desc()).offset(skip).limit(limit))
    return {"items": result.scalars().all(), "total": total}


@router.post("/{id}/suspend")
@limiter.limit("10/minute", key_func=get_user_or_ip)
async def suspend_dealer(
    request: Request,
    id: uuid.UUID,
    req: ModerateDealerRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(RequirePermissions([PermissionEnum.SUSPEND_DEALER])),
):
    await AdminModerationService(db).suspend_dealer(current_user, id, req.reason)
    return {"status": "success"}


@router.post("/{id}/restore")
async def restore_dealer(
    id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(RequirePermissions([PermissionEnum.RESTORE_DEALER])),
):
    service = AdminModerationService(db)
    await service.restore_dealer(current_user, id)
    return {"message": "Dealer restored successfully"}


@router.delete("/{id}")
@limiter.limit("10/minute", key_func=get_user_or_ip)
async def delete_dealer(
    request: Request,
    id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(RequirePermissions([PermissionEnum.DELETE_DEALER])),
):
    service = AdminModerationService(db)
    await service.delete_dealer(current_user, id)
    return {"message": "Dealer deleted successfully"}
