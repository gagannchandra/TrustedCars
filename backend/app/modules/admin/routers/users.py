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

from fastapi import Query
from pydantic import BaseModel

class PaginatedUserResponse(BaseModel):
    items: List[UserResponse]
    total: int

@router.get("", response_model=PaginatedUserResponse)
async def list_all_users(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(RequirePermissions([PermissionEnum.SUSPEND_USER])), # Reusing moderate permission
):
    from sqlalchemy import func
    total = await db.scalar(select(func.count()).select_from(User))
    result = await db.execute(select(User).offset(skip).limit(limit))
    return {"items": result.scalars().all(), "total": total}

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
