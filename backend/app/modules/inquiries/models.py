import uuid
from datetime import datetime, timezone
import enum
from sqlalchemy import DateTime, ForeignKey, Text, Enum as SQLEnum, Index, text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.core.models import DeletedReason


class InquiryStatusEnum(str, enum.Enum):
    open = "open"
    closed = "closed"
    archived = "archived"


class Inquiry(Base):
    __tablename__ = "inquiries"
    __table_args__ = (
        Index("ix_inquiries_buyer", "buyer_id"),
        Index("ix_inquiries_seller", "seller_id"),
        Index("ix_inquiries_car", "car_id"),
        Index("ix_inquiries_status", "status"),
        Index(
            "idx_inquiries_one_per_car_buyer",
            "car_id",
            "buyer_id",
            unique=True,
            postgresql_where=text("deleted_at IS NULL"),
        ),
        Index(
            "ix_inquiries_buyer_del_upd",
            "buyer_id",
            "deleted_at",
            text("updated_at DESC"),
        ),
        Index(
            "ix_inquiries_seller_del_upd",
            "seller_id",
            "deleted_at",
            text("updated_at DESC"),
        ),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    car_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("cars.id", ondelete="CASCADE"), nullable=False)
    buyer_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    seller_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)

    status: Mapped[InquiryStatusEnum] = mapped_column(
        SQLEnum(InquiryStatusEnum, name="inquiry_status_enum"),
        default=InquiryStatusEnum.open,
        nullable=False,
    )
    previous_status: Mapped[InquiryStatusEnum | None] = mapped_column(
        SQLEnum(InquiryStatusEnum, name="inquiry_status_enum", create_type=False),
        nullable=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )
    deleted_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    from app.core.models import DeletedReason

    deleted_reason: Mapped[DeletedReason | None] = mapped_column(
        SQLEnum(DeletedReason, name="deleted_reason_enum"), nullable=True
    )
    deleted_by: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), nullable=True
    )
    messages: Mapped[list["InquiryMessage"]] = relationship(
        "InquiryMessage", back_populates="inquiry", cascade="all, delete-orphan"
    )


class InquiryMessage(Base):
    __tablename__ = "inquiry_messages"
    __table_args__ = (
        Index("ix_inquiry_messages_inquiry_created", "inquiry_id", "created_at"),
        Index("ix_inquiry_messages_created", "created_at"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    inquiry_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("inquiries.id", ondelete="CASCADE"), nullable=False, index=True
    )
    sender_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)

    message: Mapped[str] = mapped_column(Text, nullable=False)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    deleted_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    deleted_reason: Mapped[DeletedReason | None] = mapped_column(
        SQLEnum(DeletedReason, name="deleted_reason_enum"), nullable=True
    )
    deleted_by: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), nullable=True
    )

    inquiry: Mapped["Inquiry"] = relationship("Inquiry", back_populates="messages")
