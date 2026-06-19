import uuid
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.modules.auth.models import User
from app.shared.rbac.dependencies import RequirePermissions
from app.shared.rbac.permissions import PermissionEnum
from app.modules.admin.services.moderation import AdminModerationService
from app.modules.admin.schemas import ModerateDealerRequest

router = APIRouter(prefix="/dealers", tags=["admin-dealers"])


@router.post("/{id}/suspend")
async def suspend_dealer(
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
async def delete_dealer(
    id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(RequirePermissions([PermissionEnum.DELETE_DEALER])),
):
    service = AdminModerationService(db)
    await service.delete_dealer(current_user, id)
    return {"message": "Dealer deleted successfully"}
