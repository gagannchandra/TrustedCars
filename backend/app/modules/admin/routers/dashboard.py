from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.modules.auth.models import User
from app.shared.rbac.dependencies import RequirePermissions
from app.shared.rbac.permissions import PermissionEnum
from app.modules.admin.services.dashboard import DashboardService

router = APIRouter(prefix="/dashboard", tags=["admin-dashboard"])


@router.get("/statistics")
async def get_dashboard_statistics(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(
        RequirePermissions([PermissionEnum.VIEW_ADMIN_DASHBOARD])
    ),
):
    stats = await DashboardService(db).get_statistics()
    return stats
