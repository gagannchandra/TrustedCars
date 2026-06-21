import uuid
from fastapi import APIRouter, Depends, Query, Request
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.modules.auth.models import User
from app.shared.rbac.dependencies import RequirePermissions
from app.shared.rbac.permissions import PermissionEnum
from app.modules.admin.services.moderation import AdminModerationService
from app.modules.admin.schemas import ModerateCarRequest, RestoreRequest

from typing import List
from sqlalchemy import select
from app.modules.cars.models import Car
from app.modules.cars.schemas import PaginatedCarResponse
from app.core.limiter import limiter, get_user_or_ip

router = APIRouter(prefix="/cars", tags=["admin-cars"])


@router.get("", response_model=PaginatedCarResponse)
async def list_all_cars(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    status: str | None = Query(None),
    q: str | None = Query(None),
    include_deleted: bool = Query(False),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(RequirePermissions([PermissionEnum.APPROVE_CAR])),
):
    from sqlalchemy import func, or_
    stmt = select(Car)
    if not include_deleted:
        stmt = stmt.where(Car.deleted_at.is_(None))
    if status:
        stmt = stmt.where(Car.status == status)
    if q:
        stmt = stmt.where(
            or_(func.lower(Car.make).like(f"%{q.lower()}%"), func.lower(Car.model).like(f"%{q.lower()}%"))
        )
    total = await db.scalar(select(func.count()).select_from(stmt.subquery()))
    result = await db.execute(stmt.order_by(Car.created_at.desc()).offset(skip).limit(limit))
    cars = list(result.scalars().all())
    return {"items": cars, "total": total}


@router.post("/{id}/approve")
async def approve_car(
    id: uuid.UUID,
    req: ModerateCarRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(RequirePermissions([PermissionEnum.APPROVE_CAR])),
):
    await AdminModerationService(db).moderate_car(
        current_user, id, "APPROVE", req.reason
    )
    return {"status": "success"}


@router.post("/{id}/reject")
@limiter.limit("10/minute", key_func=get_user_or_ip)
async def reject_car(
    request: Request,
    id: uuid.UUID,
    req: ModerateCarRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(RequirePermissions([PermissionEnum.REJECT_CAR])),
):
    await AdminModerationService(db).moderate_car(
        current_user, id, "REJECT", req.reason
    )
    return {"status": "success"}


@router.post("/{id}/hide")
@limiter.limit("10/minute", key_func=get_user_or_ip)
async def hide_car(
    request: Request,
    id: uuid.UUID,
    req: ModerateCarRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(RequirePermissions([PermissionEnum.HIDE_CAR])),
):
    await AdminModerationService(db).moderate_car(current_user, id, "HIDE", req.reason)
    return {"status": "success"}


@router.post("/{id}/restore")
async def restore_car(
    id: uuid.UUID,
    req: RestoreRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(RequirePermissions([PermissionEnum.RESTORE_CAR])),
):
    await AdminModerationService(db).moderate_car(
        current_user, id, "RESTORE", req.reason
    )
    return {"status": "success"}


@router.post("/{id}/feature")
async def feature_car(
    id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(RequirePermissions([PermissionEnum.FEATURE_CAR])),
):
    await AdminModerationService(db).moderate_car(
        current_user, id, "FEATURE", "Admin featured car"
    )
    return {"status": "success"}
