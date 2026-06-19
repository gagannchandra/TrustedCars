from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional

from app.db.session import get_db
from app.shared.rbac.dependencies import RequirePermissions
from app.shared.rbac.permissions import PermissionEnum
from app.modules.auth.models import User
from app.shared.audit.service import AuditService
from app.shared.audit.schemas import PaginatedAuditLogResponse

router = APIRouter(prefix="/admin/audit-logs", tags=["Admin Audit Logs"])


@router.get("", response_model=PaginatedAuditLogResponse)
async def get_audit_logs(
    actor_id: Optional[str] = Query(None),
    target_id: Optional[str] = Query(None),
    action: Optional[str] = Query(None),
    correlation_id: Optional[str] = Query(None),
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    cursor: Optional[str] = Query(None),
    limit: int = Query(50, ge=1, le=100),
    session: AsyncSession = Depends(get_db),
    current_user: User = Depends(RequirePermissions([PermissionEnum.VIEW_AUDIT_LOGS])),
):
    """
    Get paginated audit logs for admin viewing.
    Uses keyset pagination (cursor format: ISO_timestamp|UUID).
    """
    audit_service = AuditService(session)
    result = await audit_service.get_audit_logs(
        actor_id=actor_id,
        target_id=target_id,
        action=action,
        correlation_id=correlation_id,
        start_date=start_date,
        end_date=end_date,
        cursor=cursor,
        limit=limit,
    )
    return result
