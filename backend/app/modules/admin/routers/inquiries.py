import uuid
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.modules.auth.models import User
from app.shared.rbac.dependencies import RequirePermissions
from app.shared.rbac.permissions import PermissionEnum
from app.modules.admin.services.moderation import AdminModerationService

router = APIRouter(prefix="/inquiries", tags=["admin-inquiries"])


@router.post("/{id}/close")
async def close_inquiry(
    id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(RequirePermissions([PermissionEnum.CLOSE_INQUIRY])),
):
    await AdminModerationService(db).close_inquiry(current_user, id)
    return {"status": "success"}


@router.post("/{id}/archive")
async def archive_inquiry(
    id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(RequirePermissions([PermissionEnum.ARCHIVE_INQUIRY])),
):
    await AdminModerationService(db).archive_inquiry(current_user, id)
    return {"status": "success"}
