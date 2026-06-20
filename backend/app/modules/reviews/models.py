import uuid
from datetime import datetime, timezone
from sqlalchemy import DateTime, ForeignKey, Index, text, Integer, String, CheckConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column
from app.db.base import Base


class Review(Base):
    __tablename__ = "reviews"
    __table_args__ = (
        Index("ix_reviews_seller_id", "seller_id"),
        Index("ix_reviews_reviewer_id", "reviewer_id"),
        Index("ix_reviews_car_id", "car_id"),
        Index("ix_reviews_created_at", "created_at"),
        Index(
            "ix_reviews_seller_deleted_created",
            "seller_id",
            "deleted_at",
            text("created_at DESC"),
        ),
        Index(
            "idx_reviews_one_per_reviewer_seller_car",
            "reviewer_id",
            "seller_id",
            "car_id",
            unique=True,
        ),
        CheckConstraint("rating >= 1 AND rating <= 5", name="chk_review_rating"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    reviewer_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    seller_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    car_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("cars.id", ondelete="CASCADE"), nullable=False
    )

    rating: Mapped[int] = mapped_column(Integer, nullable=False)
    comment: Mapped[str] = mapped_column(String(2000), nullable=False)

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
    from sqlalchemy import Enum as SQLEnum
    from app.core.models import DeletedReason

    deleted_reason: Mapped[DeletedReason | None] = mapped_column(
        SQLEnum(DeletedReason, name="deleted_reason_enum"), nullable=True
    )
    deleted_by: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), nullable=True
    )
