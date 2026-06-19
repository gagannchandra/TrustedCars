import uuid
from datetime import datetime, timezone
from sqlalchemy import String, Integer, DateTime, Text, Enum as SQLEnum, Index
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column
from app.db.base import Base
import enum


class DeletedReason(str, enum.Enum):
    user_request = "user_request"
    admin_action = "admin_action"
    account_deleted = "account_deleted"
    car_deleted = "car_deleted"
    policy_violation = "policy_violation"
    spam = "spam"
    fraud = "fraud"


class OutboxEventStatus(str, enum.Enum):
    pending = "pending"
    processing = "processing"
    processed = "processed"
    failed = "failed"


class OutboxEvent(Base):
    __tablename__ = "outbox_events"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    event_type: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    payload: Mapped[str] = mapped_column(Text, nullable=False)
    correlation_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), nullable=True, index=True
    )
    causation_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), nullable=True, index=True
    )
    idempotency_key: Mapped[str | None] = mapped_column(
        String(255), nullable=True, unique=True, index=True
    )

    status: Mapped[OutboxEventStatus] = mapped_column(
        SQLEnum(OutboxEventStatus), default=OutboxEventStatus.pending, index=True
    )

    retry_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    max_retries: Mapped[int] = mapped_column(Integer, default=5, nullable=False)
    last_attempt_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    next_retry_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    error: Mapped[str | None] = mapped_column(Text, nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    processed_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    __table_args__ = (
        Index("ix_outbox_events_status_next_retry_at", "status", "next_retry_at"),
        Index("ix_outbox_events_status_last_attempt_at", "status", "last_attempt_at"),
    )


class PlatformStatistics(Base):
    __tablename__ = "platform_statistics"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, default=1)
    total_users: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    active_users: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    suspended_users: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    total_dealers: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    active_dealers: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    suspended_dealers: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    pending_cars: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    active_cars: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    hidden_cars: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    total_reviews: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    total_inquiries: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )


class ProcessedEvent(Base):
    __tablename__ = "processed_events"

    event_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True)
    processed_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
