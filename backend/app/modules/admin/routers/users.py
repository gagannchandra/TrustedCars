import uuid
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.modules.auth.models import User
from app.shared.rbac.dependencies import RequirePermissions
from app.shared.rbac.permissions import PermissionEnum
from app.modules.admin.services.moderation import AdminModerationService
from app.modules.admin.schemas import SuspendUserRequest

from typing import List
from sqlalchemy import select
from app.modules.auth.schemas import UserResponse

router = APIRouter(prefix="/users", tags=["admin-users"])

@router.get("", response_model=List[UserResponse])
async def list_all_users(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(RequirePermissions([PermissionEnum.SUSPEND_USER])), # Reusing moderate permission
):
    result = await db.execute(select(User))
    return result.scalars().all()

@router.post("/{id}/suspend")
async def suspend_user(
    id: uuid.UUID,
    req: SuspendUserRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(RequirePermissions([PermissionEnum.SUSPEND_USER])),
):
    await AdminModerationService(db).suspend_user(current_user, id, req.reason)
    return {"status": "success"}


@router.post("/{id}/restore")
async def restore_user(
    id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(RequirePermissions([PermissionEnum.RESTORE_USER])),
):
    await AdminModerationService(db).restore_user(current_user, id)
    return {"status": "success"}


@router.delete("/{id}")
async def delete_user(
    id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(RequirePermissions([PermissionEnum.DELETE_USER])),
):
    await AdminModerationService(db).delete_user(current_user, id)
    return {"status": "success"}
