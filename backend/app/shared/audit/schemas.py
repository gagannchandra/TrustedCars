from pydantic import BaseModel, ConfigDict
from uuid import UUID
from datetime import datetime
from typing import List, Optional


class AuditLogResponse(BaseModel):
    id: UUID
    actor_id: UUID
    action: str
    target_id: Optional[UUID] = None
    reason: Optional[str] = None
    details: Optional[str] = None
    correlation_id: Optional[UUID] = None
    request_id: Optional[UUID] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class PaginatedAuditLogResponse(BaseModel):
    items: List[AuditLogResponse]
    next_cursor: Optional[str] = None
    has_more: bool
