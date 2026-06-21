import uuid
from datetime import datetime, timezone
from sqlalchemy import String, DateTime, ForeignKey, Integer, Boolean
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import Index

from app.db.base import Base


class CarImage(Base):
    __tablename__ = "car_images"
    __table_args__ = (
        Index(
            "idx_car_images_one_primary",
            "car_id",
            unique=True,
            postgresql_where="is_primary = true AND deleted_at IS NULL",
        ),
        Index(
            "idx_car_images_active",
            "car_id",
            "deleted_at",
            postgresql_where="deleted_at IS NULL",
        ),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    car_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("cars.id", ondelete="CASCADE"), nullable=False, index=True
    )
    
    car: Mapped["Car"] = relationship("Car", back_populates="images")
    image_url: Mapped[str] = mapped_column(String(500), nullable=False)
    storage_key: Mapped[str] = mapped_column(
        String(255), nullable=False, unique=True, index=True
    )
    sort_order: Mapped[int] = mapped_column(Integer, default=0)
    is_primary: Mapped[bool] = mapped_column(Boolean, default=False)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
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
