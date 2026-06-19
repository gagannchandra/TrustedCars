import uuid
from sqlalchemy.ext.asyncio import AsyncSession
from app.shared.audit.repository import AuditRepository
from app.shared.audit.models import AuditLog


class AuditService:
    def __init__(self, session: AsyncSession):
        self.repository = AuditRepository(session)
        self.session = session

    async def log_action(
        self,
        user_id: uuid.UUID,
        action: str,
        target_id: uuid.UUID | None = None,
        reason: str | None = None,
        details: str = "",
    ):
        from app.core.context import request_id_ctx, correlation_id_ctx

        req_id_str = request_id_ctx.get()
        corr_id_str = correlation_id_ctx.get()

        req_id = uuid.UUID(req_id_str) if req_id_str else None
        corr_id = uuid.UUID(corr_id_str) if corr_id_str else None

        log = AuditLog(
            user_id=user_id,
            action=action,
            target_id=target_id,
            reason=reason,
            details=details,
            request_id=req_id,
            correlation_id=corr_id,
        )
        self.repository.add_audit_log(log)
        await self.session.flush()

    async def get_audit_logs(
        self,
        actor_id: str | None = None,
        target_id: str | None = None,
        action: str | None = None,
        correlation_id: str | None = None,
        start_date: str | None = None,
        end_date: str | None = None,
        cursor: str | None = None,
        limit: int = 50,
    ) -> dict:
        logs = await self.repository.list_audit_logs(
            actor_id,
            target_id,
            action,
            correlation_id,
            start_date,
            end_date,
            cursor,
            limit,
        )

        has_more = len(logs) > limit
        if has_more:
            logs = logs[:-1]

        next_cursor = None
        if logs:
            last = logs[-1]
            next_cursor = f"{last.created_at.isoformat()}|{str(last.id)}"

        # Map user_id to actor_id for the response
        items = []
        for log in logs:
            items.append(
                {
                    "id": log.id,
                    "actor_id": log.user_id,
                    "action": log.action,
                    "target_id": log.target_id,
                    "reason": log.reason,
                    "details": log.details,
                    "correlation_id": log.correlation_id,
                    "request_id": log.request_id,
                    "created_at": log.created_at,
                }
            )

        return {"items": items, "next_cursor": next_cursor, "has_more": has_more}
