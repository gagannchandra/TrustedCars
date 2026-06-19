import uuid
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.modules.auth.models import User
from app.shared.rbac.dependencies import RequirePermissions
from app.shared.rbac.permissions import PermissionEnum
from app.modules.admin.services.moderation import AdminModerationService

router = APIRouter(prefix="/reviews", tags=["admin-reviews"])


@router.delete("/{id}")
async def delete_review(
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
