from sqlalchemy.ext.asyncio import AsyncSession
from app.shared.audit.models import AuditLog


class AuditRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    def add_audit_log(self, log: AuditLog):
        self.session.add(log)

    async def list_audit_logs(
        self,
        actor_id: str | None,
        target_id: str | None,
        action: str | None,
        correlation_id: str | None,
        start_date: str | None,
        end_date: str | None,
        cursor: str | None,
        limit: int,
    ) -> list[AuditLog]:
        from sqlalchemy import select
        from datetime import datetime

        stmt = select(AuditLog)

        if actor_id:
            stmt = stmt.where(AuditLog.user_id == actor_id)
        if target_id:
            stmt = stmt.where(AuditLog.target_id == target_id)
        if action:
            stmt = stmt.where(AuditLog.action == action)
        if correlation_id:
            stmt = stmt.where(AuditLog.correlation_id == correlation_id)
        if start_date:
            stmt = stmt.where(AuditLog.created_at >= datetime.fromisoformat(start_date))
        if end_date:
            stmt = stmt.where(AuditLog.created_at <= datetime.fromisoformat(end_date))

        if cursor:
            # Cursor format: ISO_timestamp|UUID
            parts = cursor.split("|")
            if len(parts) == 2:
                ts, cid = parts
                dt = datetime.fromisoformat(ts)
                stmt = stmt.where(
                    (AuditLog.created_at < dt)
                    | ((AuditLog.created_at == dt) & (AuditLog.id < cid))
                )

        stmt = stmt.order_by(AuditLog.created_at.desc(), AuditLog.id.desc()).limit(
            limit + 1
        )
        result = await self.session.execute(stmt)
        return list(result.scalars().all())
