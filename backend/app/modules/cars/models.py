import uuid
from datetime import datetime, timezone
from sqlalchemy import (
    String,
    Integer,
    DateTime,
    ForeignKey,
    Text,
    Enum as SQLEnum,
    Numeric,
    Index,
    Boolean,
    CheckConstraint,
    text,
)
from sqlalchemy.dialects.postgresql import UUID, TSVECTOR
from sqlalchemy.orm import Mapped, mapped_column
import enum

from app.db.base import Base


class CarStatusEnum(str, enum.Enum):
    pending = "pending"
    active = "active"
    sold = "sold"
    rejected = "rejected"


class FuelTypeEnum(str, enum.Enum):
    petrol = "petrol"
    diesel = "diesel"
    electric = "electric"
    hybrid = "hybrid"
    cng = "cng"
    lpg = "lpg"


class TransmissionEnum(str, enum.Enum):
    manual = "manual"
    automatic = "automatic"


class BodyTypeEnum(str, enum.Enum):
    sedan = "sedan"
    suv = "suv"
    hatchback = "hatchback"
    truck = "truck"
    coupe = "coupe"
    wagon = "wagon"
    convertible = "convertible"
    van = "van"
    mpv = "mpv"
    pickup = "pickup"
    crossover = "crossover"


class ModerationStatusEnum(str, enum.Enum):
    approved = "approved"
    rejected = "rejected"
    hidden = "hidden"


class Car(Base):
    __tablename__ = "cars"

    __table_args__ = (
        Index("ix_cars_active_city", "city", "asking_price", postgresql_where=text("status = 'active' AND moderation_status = 'approved' AND deleted_at IS NULL")),
        Index("ix_cars_active_make", "make", "asking_price", postgresql_where=text("status = 'active' AND moderation_status = 'approved' AND deleted_at IS NULL")),
        Index("ix_cars_active_price", "asking_price", postgresql_where=text("status = 'active' AND moderation_status = 'approved' AND deleted_at IS NULL")),
        Index("ix_cars_active_year", "year", "asking_price", postgresql_where=text("status = 'active' AND moderation_status = 'approved' AND deleted_at IS NULL")),
        Index("ix_cars_active_created_at", "created_at", postgresql_where=text("status = 'active' AND moderation_status = 'approved' AND deleted_at IS NULL")),
        Index("ix_cars_active_make_model", "make", "model", postgresql_where=text("status = 'active' AND moderation_status = 'approved' AND deleted_at IS NULL")),
        Index("ix_cars_make_lower", text("lower(make)"), postgresql_where=text("deleted_at IS NULL")),
        Index("ix_cars_model_lower", text("lower(model)"), postgresql_where=text("deleted_at IS NULL")),
        Index("ix_cars_variant_lower", text("lower(variant)"), postgresql_where=text("deleted_at IS NULL")),
        Index("ix_cars_city_lower", text("lower(city)"), postgresql_where=text("deleted_at IS NULL")),
        Index("ix_cars_state_lower", text("lower(state)"), postgresql_where=text("deleted_at IS NULL")),
        Index("ix_cars_dealership_id", "dealership_id"),
        Index("ix_cars_search_vector", "search_vector", postgresql_using="gin", postgresql_where=text("deleted_at IS NULL")),
        Index("ix_cars_user_id", "user_id"),
        CheckConstraint("odometer_km >= 0", name="chk_car_odometer"),
        CheckConstraint("asking_price > 0", name="chk_car_asking_price"),
        CheckConstraint("ownership_count >= 0", name="chk_car_ownership_count"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    dealership_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("dealerships.id", ondelete="CASCADE"), nullable=True
    )

    make: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    model: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    variant: Mapped[str | None] = mapped_column(String(100), nullable=True)
    year: Mapped[int] = mapped_column(Integer, nullable=False, index=True)
    fuel_type: Mapped[FuelTypeEnum] = mapped_column(
        SQLEnum(FuelTypeEnum, name="fuel_type_enum"), nullable=False
    )
    transmission: Mapped[TransmissionEnum] = mapped_column(
        SQLEnum(TransmissionEnum, name="transmission_enum"), nullable=False
    )
    body_type: Mapped[BodyTypeEnum] = mapped_column(
        SQLEnum(BodyTypeEnum, name="body_type_enum"), nullable=False
    )
    odometer_km: Mapped[int] = mapped_column(Integer, nullable=False)
    ownership_count: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    asking_price: Mapped[float] = mapped_column(
        Numeric(12, 2), nullable=False, index=True
    )
    city: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    state: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    quality_grade: Mapped[str | None] = mapped_column(String(10), nullable=True)

    search_vector: Mapped[str | None] = mapped_column(TSVECTOR, nullable=True)

    status: Mapped[CarStatusEnum] = mapped_column(
        SQLEnum(CarStatusEnum, name="car_status_enum"),
        default=CarStatusEnum.pending,
        nullable=False,
        index=True,
    )

    moderation_status: Mapped[str | None] = mapped_column(
        String(50), nullable=True, index=True
    )
    moderated_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    moderated_by: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), nullable=True
    )
    previous_moderation_status: Mapped[str | None] = mapped_column(
        String(50), nullable=True
    )
    moderation_reason: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_featured: Mapped[bool] = mapped_column(Boolean, default=False, index=True)

    deleted_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True, index=True
    )
    from app.core.models import DeletedReason

    deleted_reason: Mapped[DeletedReason | None] = mapped_column(
        SQLEnum(DeletedReason, name="deleted_reason_enum"), nullable=True
    )
    deleted_by: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )
