import uuid
from fastapi import APIRouter, Depends
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
from app.modules.cars.schemas import CarResponse

router = APIRouter(prefix="/cars", tags=["admin-cars"])

@router.get("", response_model=List[CarResponse])
async def list_all_cars(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(RequirePermissions([PermissionEnum.APPROVE_CAR])),
):
    result = await db.execute(select(Car))
    return result.scalars().all()

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
async def reject_car(
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
async def hide_car(
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
