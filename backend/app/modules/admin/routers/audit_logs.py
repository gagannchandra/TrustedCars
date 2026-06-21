from fastapi import APIRouter, Depends
from app.shared.dependencies.auth import require_roles

router = APIRouter(prefix="/audit-logs", tags=["Admin - Audit Logs"])

@router.get("")
async def list_audit_logs(_=Depends(require_roles(["admin"]))):
    # Stub — replace with real DB query when audit_log table exists
    return {"items": [], "total": 0}
