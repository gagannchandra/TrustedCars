from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.db.session import get_db
from app.modules.auth.models import User
from app.shared.rbac.dependencies import RequirePermissions
from app.shared.rbac.permissions import PermissionEnum
from app.core.models import PlatformSettings
from app.modules.admin.schemas import UpdateSettingsRequest, SettingsResponse
from app.shared.audit.service import AuditService

router = APIRouter(prefix="/settings", tags=["admin-settings"])

# Create permission mapping for settings later if we want a separate permission.
# For now, using SUPERADMIN implies all permissions, but we can reuse VIEW_ADMIN_DASHBOARD for view.

@router.get("", response_model=SettingsResponse)
async def get_settings(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(RequirePermissions([PermissionEnum.VIEW_ADMIN_DASHBOARD])),
):
    settings = await db.get(PlatformSettings, 1)
    if not settings:
        settings = PlatformSettings()
        db.add(settings)
        await db.commit()
        await db.refresh(settings)
    return settings


@router.patch("", response_model=SettingsResponse)
async def update_settings(
    req: UpdateSettingsRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(RequirePermissions([PermissionEnum.MANAGE_SETTINGS])),
):
    settings = await db.get(PlatformSettings, 1)
    if not settings:
        settings = PlatformSettings()
        db.add(settings)

    old_fee = settings.platform_fee
    old_auto = settings.auto_approve

    if req.platform_fee is not None:
        settings.platform_fee = req.platform_fee
    if req.auto_approve is not None:
        settings.auto_approve = req.auto_approve

    await AuditService(db).log_action(
        user_id=current_user.id,
        action="SETTINGS_UPDATED",
        target_id=None,
        reason=req.reason,
        details=f"Fee: {old_fee} -> {settings.platform_fee}, Auto: {old_auto} -> {settings.auto_approve}",
    )

    await db.commit()
    await db.refresh(settings)
    return settings
