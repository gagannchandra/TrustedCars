from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.modules.auth.models import User
from app.shared.rbac.dependencies import RequirePermissions
from app.shared.rbac.permissions import PermissionEnum
from app.shared.audit.service import AuditService

router = APIRouter(prefix="/audit-logs", tags=["admin-audit"])


@router.get("")
async def get_audit_logs(
    limit: int = Query(50, ge=1, le=100),
    cursor: str | None = None,
    actor_id: str | None = None,
    target_id: str | None = None,
    action: str | None = None,
    correlation_id: str | None = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(RequirePermissions([PermissionEnum.VIEW_AUDIT_LOGS])),
):
    return await AuditService(db).get_audit_logs(
        actor_id=actor_id,
        target_id=target_id,
        action=action,
        correlation_id=correlation_id,
        cursor=cursor,
        limit=limit,
    )
