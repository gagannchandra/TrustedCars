import uuid
from fastapi import APIRouter, Depends, Query, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from pydantic import BaseModel
from typing import List

from app.db.session import get_db
from app.modules.auth.models import User, RoleEnum
from app.shared.rbac.dependencies import RequirePermissions
from app.shared.rbac.permissions import PermissionEnum
from app.shared.rbac.hierarchy import ROLE_PRIVILEGE_LEVELS
from app.modules.admin.services.moderation import AdminModerationService
from app.modules.admin.schemas import SuspendUserRequest
from app.modules.auth.schemas import AdminUserResponse
from app.core.limiter import limiter, get_user_or_ip
from app.shared.exceptions.handlers import CustomException
from app.shared.audit.service import AuditService

router = APIRouter(prefix="/users", tags=["admin-users"])

class PaginatedAdminUserResponse(BaseModel):
    items: List[AdminUserResponse]
    total: int

@router.get("", response_model=PaginatedAdminUserResponse)
async def list_all_users(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    include_deleted: bool = Query(False),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(RequirePermissions([PermissionEnum.SUSPEND_USER])),
):
    caller_level = ROLE_PRIVILEGE_LEVELS.get(current_user.role, 0)
    visible_roles = [r for r, lvl in ROLE_PRIVILEGE_LEVELS.items() if lvl <= caller_level]
    
    stmt = select(User).where(User.role.in_(visible_roles))
    if not include_deleted:
        stmt = stmt.where(User.deleted_at.is_(None))
        
    total = await db.scalar(select(func.count()).select_from(stmt.subquery()))
    result = await db.execute(stmt.order_by(User.created_at.desc()).offset(skip).limit(limit))
    return {"items": result.scalars().all(), "total": total}

@router.post("/{id}/suspend")
@limiter.limit("10/minute", key_func=get_user_or_ip)
async def suspend_user(
    request: Request,
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
@limiter.limit("10/minute", key_func=get_user_or_ip)
async def delete_user(
    request: Request,
    id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(RequirePermissions([PermissionEnum.DELETE_USER])),
):
    await AdminModerationService(db).delete_user(current_user, id)
    return {"status": "success"}


class ChangeRoleRequest(BaseModel):
    model_config = {"extra": "forbid"}
    role: RoleEnum
    reason: str


@router.post("/{id}/role")
@limiter.limit("10/minute", key_func=get_user_or_ip)
async def change_user_role(
    request: Request,
    id: uuid.UUID,
    req: ChangeRoleRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(RequirePermissions([PermissionEnum.VIEW_ADMIN_DASHBOARD])),
):
    if current_user.role != RoleEnum.superadmin:
        raise CustomException(403, "Only superadmin can change user roles")
        
    target = await db.get(User, id)
    if not target:
        raise CustomException(404, "User not found")
        
    caller_level = ROLE_PRIVILEGE_LEVELS.get(current_user.role, 0)
    target_level = ROLE_PRIVILEGE_LEVELS.get(target.role, 0)
    new_role_level = ROLE_PRIVILEGE_LEVELS.get(req.role, 0)
    
    if caller_level <= target_level or caller_level <= new_role_level:
        raise CustomException(403, "Cannot change role to or from a privilege level equal or higher than your own")
        
    old_role = target.role
    target.role = req.role
    
    await AuditService(db).log_action(
        user_id=current_user.id,
        action="USER_ROLE_CHANGED",
        target_id=target.id,
        reason=req.reason,
        details=f"Role changed from {old_role.value} to {req.role.value}",
    )
    
    await db.commit()
    return {"status": "success"}
