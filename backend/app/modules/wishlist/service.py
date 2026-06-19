from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.exc import IntegrityError
from sqlalchemy import select
from uuid import UUID
from datetime import datetime, timezone
from app.modules.wishlist.repository import WishlistRepository
from app.modules.wishlist.models import Wishlist
from app.modules.cars.models import Car
from app.modules.auth.models import User
from app.shared.audit.service import AuditService
from app.shared.exceptions.handlers import CustomException
from app.core.events import event_bus


class WishlistService:
    def __init__(self, session: AsyncSession):
        self.repository = WishlistRepository(session)
        self.session = session

    async def _log_audit(
        self,
        user_id: UUID,
        action: str,
        target_id: UUID | None = None,
        reason: str | None = None,
        details: str = "",
    ):
        await AuditService(self.session).log_action(
            user_id, action, target_id, reason, details
        )

    def _format_entry_response(self, entry: Wishlist, car: Car | None) -> dict:
        data = {
            "id": entry.id,
            "user_id": entry.user_id,
            "car_id": entry.car_id,
            "created_at": entry.created_at,
        }
        if car:
            data["car"] = {
                "id": car.id,
                "make": car.make,
                "model": car.model,
                "year": car.year,
                "asking_price": float(car.asking_price),
                "status": car.status.value,
            }
        return data

    async def add_to_wishlist(self, car_id: UUID, current_user: User) -> dict:
        # Verify car exists
        car = await self.session.scalar(
            select(Car).where(Car.id == car_id, Car.deleted_at.is_(None))
        )
        if not car:
            raise CustomException(404, "Car not found")

        existing = await self.repository.get_wishlist_entry(
            current_user.id, car_id, include_deleted=True
        )
        if existing:
            if existing.deleted_at is None:
                return self._format_entry_response(existing, car)

            # Restore row
            existing.deleted_at = None
            try:
                await self.repository.update_wishlist_entry(existing)
                await self._log_audit(
                    current_user.id,
                    "ADD_TO_WISHLIST",
                    car_id,
                    None,
                    f"Restored car {car_id} to wishlist",
                )
                await event_bus.publish(
                    "WISHLIST_ADDED",
                    session=self.session,
                    car_id=car_id,
                    user_id=current_user.id,
                )
                await self.session.commit()
            except IntegrityError:
                await self.session.rollback()
                raise CustomException(
                    400, "Failed to restore wishlist due to constraint violation"
                )
            return self._format_entry_response(existing, car)

        entry = Wishlist(user_id=current_user.id, car_id=car_id)

        try:
            await self.repository.add_wishlist_entry(entry)
            await self._log_audit(
                current_user.id,
                "ADD_TO_WISHLIST",
                car_id,
                None,
                f"Added car {car_id} to wishlist",
            )
            await event_bus.publish(
                "WISHLIST_ADDED",
                session=self.session,
                car_id=car_id,
                user_id=current_user.id,
            )
            await self.session.commit()
        except IntegrityError:
            await self.session.rollback()
            raise CustomException(
                400, "Failed to add to wishlist due to constraint violation"
            )

        return self._format_entry_response(entry, car)

    async def remove_from_wishlist(self, car_id: UUID, current_user: User):
        entry = await self.repository.get_wishlist_entry(current_user.id, car_id)
        if not entry:
            raise CustomException(404, "Wishlist entry not found")

        try:
            entry.deleted_at = datetime.now(timezone.utc)
            await self.repository.update_wishlist_entry(entry)
            await self._log_audit(
                current_user.id,
                "REMOVE_FROM_WISHLIST",
                car_id,
                None,
                f"Removed car {car_id} from wishlist",
            )
            await event_bus.publish(
                "WISHLIST_REMOVED",
                session=self.session,
                car_id=car_id,
                user_id=current_user.id,
            )
            await self.session.commit()
        except IntegrityError:
            await self.session.rollback()
            raise CustomException(
                400, "Failed to remove from wishlist due to constraint violation"
            )

    async def list_wishlist(
        self, current_user: User, cursor: datetime | None, limit: int
    ) -> dict:
        total = await self.repository.count_user_wishlist(current_user.id)
        items = await self.repository.list_user_wishlist(current_user.id, cursor, limit)

        result = []
        for w, c in items:
            result.append({"id": w.id, "car": c, "added_at": w.created_at})

        return {
            "items": result,
            "total": total,
            "next_cursor": items[-1][0].created_at if items else None,
        }

    async def check_status(self, car_id: UUID, current_user: User) -> dict:
        entry = await self.repository.get_wishlist_entry(current_user.id, car_id)
        return {"is_wishlisted": entry is not None}

    async def handle_user_deleted(self, user_id: UUID):
        from sqlalchemy import update
        from datetime import datetime, timezone

        now = datetime.now(timezone.utc)
        stmt = (
            update(Wishlist)
            .where(Wishlist.user_id == user_id, Wishlist.deleted_at.is_(None))
            .values(deleted_at=now)
        )
        await self.session.execute(stmt)

    async def handle_car_deleted(self, car_id: UUID):
        from sqlalchemy import update
        from datetime import datetime, timezone

        now = datetime.now(timezone.utc)
        stmt = (
            update(Wishlist)
            .where(Wishlist.car_id == car_id, Wishlist.deleted_at.is_(None))
            .values(deleted_at=now)
        )
        await self.session.execute(stmt)

    async def handle_cars_bulk_deleted(self, car_ids: list[str]):
        if not car_ids:
            return
        from sqlalchemy import update
        from datetime import datetime, timezone

        now = datetime.now(timezone.utc)
        uuids = [UUID(cid) for cid in car_ids]
        chunk_size = 1000
        for i in range(0, len(uuids), chunk_size):
            chunk = uuids[i : i + chunk_size]
            stmt = (
                update(Wishlist)
                .where(Wishlist.car_id.in_(chunk), Wishlist.deleted_at.is_(None))
                .values(deleted_at=now)
            )
            await self.session.execute(stmt)
