from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.exc import IntegrityError
from uuid import UUID
from datetime import datetime, timezone
from app.modules.inquiries.repository import InquiryRepository
from app.modules.inquiries.schemas import InquiryCreate, MessageCreate
from app.modules.inquiries.models import Inquiry, InquiryMessage, InquiryStatusEnum
from app.modules.auth.models import User
from app.shared.interfaces.cars import CarOwnershipProvider
from app.shared.audit.service import AuditService
from app.shared.exceptions.handlers import CustomException
from app.core.events import event_bus


class InquiryService:
    def __init__(self, session: AsyncSession, car_provider: CarOwnershipProvider):
        self.repository = InquiryRepository(session)
        self.session = session
        self.car_provider = car_provider

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

    def _format_inquiry_response(self, inquiry: Inquiry, car) -> dict:
        data = {
            "id": inquiry.id,
            "car_id": inquiry.car_id,
            "buyer_id": inquiry.buyer_id,
            "seller_id": inquiry.seller_id,
            "status": inquiry.status,
            "created_at": inquiry.created_at,
            "updated_at": inquiry.updated_at,
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

    def _verify_access(
        self, inquiry: Inquiry, current_user: User, check_ownership: bool
    ):
        if not check_ownership:
            return True
        if inquiry.buyer_id == current_user.id or inquiry.seller_id == current_user.id:
            return True
        raise CustomException(403, "Not authorized to access this inquiry")

    async def create_inquiry(self, req: InquiryCreate, current_user: User) -> dict:
        seller_id = await self.car_provider.get_car_seller_id(req.car_id)
        if not seller_id:
            raise CustomException(404, "Car not found or unavailable")

        if seller_id == current_user.id:
            raise CustomException(400, "Cannot start an inquiry on your own car")

        # Check if inquiry already exists
        existing = await self.repository.get_existing_inquiry(
            req.car_id, current_user.id
        )
        if existing:
            raise CustomException(400, "Inquiry already exists for this car")

        inquiry = Inquiry(
            car_id=req.car_id,
            buyer_id=current_user.id,
            seller_id=seller_id,
            status=InquiryStatusEnum.open,
        )

        try:
            await self.repository.create_inquiry(inquiry)
            message = InquiryMessage(
                inquiry_id=inquiry.id,
                sender_id=current_user.id,
                message=req.initial_message,
            )
            await self.repository.create_message(message)
            await self._log_audit(
                current_user.id,
                "CREATE_INQUIRY",
                inquiry.id,
                None,
                f"Created inquiry {inquiry.id}",
            )
            await event_bus.publish(
                "INQUIRY_CREATED", session=self.session, inquiry_id=inquiry.id
            )
            await self.session.commit()
        except IntegrityError:
            await self.session.rollback()
            raise CustomException(
                400, "Inquiry already exists for this car or constraint violated"
            )

        return self._format_inquiry_response(inquiry, None)

    async def send_message(
        self, inquiry_id: UUID, req: MessageCreate, current_user: User
    ):
        inquiry = await self.repository.get_inquiry_by_id(inquiry_id)
        if not inquiry:
            raise CustomException(404, "Inquiry not found")

        self._verify_access(inquiry, current_user, True)

        if inquiry.status != InquiryStatusEnum.open:
            raise CustomException(400, "Cannot send messages to a closed inquiry")

        message = InquiryMessage(
            inquiry_id=inquiry.id, sender_id=current_user.id, message=req.message
        )
        try:
            await self.repository.create_message(message)
            inquiry.updated_at = datetime.now(timezone.utc)
            await self.repository.update_inquiry(inquiry)

            await self._log_audit(
                current_user.id,
                "SEND_MESSAGE",
                inquiry.id,
                None,
                f"Sent message in inquiry {inquiry.id}",
            )
            await event_bus.publish(
                "MESSAGE_SENT", session=self.session, message_id=message.id
            )
            await self.session.commit()
        except IntegrityError:
            await self.session.rollback()
            raise CustomException(
                400, "Database constraint violated while sending message"
            )
        return message

    async def list_user_inquiries(
        self,
        current_user: User,
        as_seller: bool = False,
        cursor: datetime | None = None,
        limit: int = 100,
    ):
        inquiries = await self.repository.list_user_inquiries(
            current_user.id, as_seller, cursor, limit
        )

        return [
            self._format_inquiry_response(inquiry, car) for inquiry, car in inquiries
        ]

    async def list_inquiry_messages(
        self, inquiry_id: UUID, current_user: User, cursor: datetime | None, limit: int
    ) -> dict:
        inquiry = await self.repository.get_inquiry_by_id(inquiry_id)
        if not inquiry:
            raise CustomException(404, "Inquiry not found")

        self._verify_access(inquiry, current_user, True)

        total = await self.repository.count_inquiry_messages(inquiry_id)
        messages = await self.repository.list_inquiry_messages(
            inquiry_id, cursor, limit
        )

        return {
            "items": messages,
            "total": total,
            "next_cursor": messages[-1].created_at if messages else None,
        }

    async def get_inquiry_details(self, inquiry_id: UUID, current_user: User) -> dict:
        inquiry, car = await self.repository.get_inquiry_with_car(inquiry_id)
        if not inquiry:
            raise CustomException(404, "Inquiry not found")

        self._verify_access(inquiry, current_user, True)
        return self._format_inquiry_response(inquiry, car)

    async def close_inquiry(self, inquiry_id: UUID, current_user: User):
        inquiry = await self.repository.get_inquiry_by_id(inquiry_id)
        if not inquiry:
            raise CustomException(404, "Inquiry not found")

        self._verify_access(inquiry, current_user, True)

        if inquiry.status != InquiryStatusEnum.open:
            raise CustomException(400, "Inquiry is already closed")

        try:
            inquiry.status = InquiryStatusEnum.closed
            inquiry.updated_at = datetime.now(timezone.utc)
            await self.repository.update_inquiry(inquiry)

            await self._log_audit(
                current_user.id,
                "CLOSE_INQUIRY",
                inquiry.id,
                None,
                f"Closed inquiry {inquiry.id}",
            )
            await event_bus.publish(
                "INQUIRY_CLOSED", session=self.session, inquiry_id=inquiry.id
            )
            await self.session.commit()
        except IntegrityError:
            await self.session.rollback()
            raise CustomException(
                400, "Database constraint violated while closing inquiry"
            )
        return self._format_inquiry_response(inquiry, None)

    async def reopen_inquiry(
        self, inquiry_id: UUID, current_user: User, check_ownership: bool = True
    ):
        inquiry = await self.repository.get_inquiry_by_id(inquiry_id)
        if not inquiry:
            raise CustomException(404, "Inquiry not found")

        self._verify_access(inquiry, current_user, check_ownership)

        try:
            inquiry.status = InquiryStatusEnum.open
            inquiry.updated_at = datetime.now(timezone.utc)
            await self.repository.update_inquiry(inquiry)

            await self._log_audit(
                current_user.id,
                "REOPEN_INQUIRY",
                inquiry.id,
                None,
                f"Reopened inquiry {inquiry.id}",
            )
            await self.session.commit()
        except IntegrityError:
            await self.session.rollback()
            raise CustomException(
                400, "Database constraint violated while reopening inquiry"
            )
        return self._format_inquiry_response(inquiry, None)

    async def delete_inquiry(
        self, inquiry_id: UUID, current_user: User, check_ownership: bool = True
    ):
        inquiry = await self.repository.get_inquiry_by_id(inquiry_id)
        if not inquiry:
            raise CustomException(404, "Inquiry not found")

        self._verify_access(inquiry, current_user, check_ownership)

        try:
            inquiry.deleted_at = datetime.now(timezone.utc)
            await self.repository.update_inquiry(inquiry)

            await self._log_audit(
                current_user.id,
                "DELETE_INQUIRY",
                inquiry.id,
                None,
                f"Deleted inquiry {inquiry.id}",
            )
            await self.session.commit()
        except IntegrityError:
            await self.session.rollback()
            raise CustomException(
                400, "Database constraint violated while deleting inquiry"
            )

    async def handle_user_deleted(self, user_id: UUID):
        from sqlalchemy import update
        from datetime import datetime, timezone

        now = datetime.now(timezone.utc)
        from sqlalchemy import or_

        stmt = (
            update(Inquiry)
            .where(
                or_(Inquiry.buyer_id == user_id, Inquiry.seller_id == user_id),
                Inquiry.deleted_at.is_(None),
            )
            .values(deleted_at=now)
        )
        await self.session.execute(stmt)

    async def handle_car_deleted(self, car_id: UUID):
        from sqlalchemy import update
        from datetime import datetime, timezone

        now = datetime.now(timezone.utc)
        stmt = (
            update(Inquiry)
            .where(Inquiry.car_id == car_id, Inquiry.deleted_at.is_(None))
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
                update(Inquiry)
                .where(Inquiry.car_id.in_(chunk), Inquiry.deleted_at.is_(None))
                .values(deleted_at=now)
            )
            await self.session.execute(stmt)
