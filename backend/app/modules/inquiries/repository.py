from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from uuid import UUID
from app.modules.inquiries.models import Inquiry, InquiryMessage
from app.modules.cars.models import Car


class InquiryRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_inquiry_by_id(self, inquiry_id: UUID) -> Inquiry | None:
        result = await self.session.execute(
            select(Inquiry).where(
                Inquiry.id == inquiry_id, Inquiry.deleted_at.is_(None)
            )
        )
        return result.scalars().first()

    async def get_inquiry_with_car(
        self, inquiry_id: UUID
    ) -> tuple[Inquiry | None, Car | None]:
        result = await self.session.execute(
            select(Inquiry, Car)
            .outerjoin(Car, Inquiry.car_id == Car.id)
            .where(Inquiry.id == inquiry_id, Inquiry.deleted_at.is_(None))
        )
        row = result.first()
        if not row:
            return None, None
        return row[0], row[1]

    async def list_user_inquiries(
        self,
        user_id: UUID,
        is_seller: bool,
        cursor: "datetime | None" = None,
        limit: int = 100,
    ) -> list[tuple[Inquiry, Car | None]]:
        stmt = (
            select(Inquiry, Car)
            .outerjoin(Car, Inquiry.car_id == Car.id)
            .where(Inquiry.deleted_at.is_(None))
        )
        if is_seller:
            stmt = stmt.where(Inquiry.seller_id == user_id)
        else:
            stmt = stmt.where(Inquiry.buyer_id == user_id)

        if cursor:
            stmt = stmt.where(Inquiry.updated_at < cursor)

        stmt = stmt.order_by(Inquiry.updated_at.desc(), Inquiry.id.desc()).limit(limit)

        result = await self.session.execute(stmt)
        return [(row[0], row[1]) for row in result.all()]

    async def list_all_inquiries(
        self, cursor: "datetime | None" = None, limit: int = 100
    ) -> list[tuple[Inquiry, Car | None]]:
        stmt = (
            select(Inquiry, Car)
            .outerjoin(Car, Inquiry.car_id == Car.id)
            .where(Inquiry.deleted_at.is_(None))
        )

        if cursor:
            stmt = stmt.where(Inquiry.updated_at < cursor)

        stmt = stmt.order_by(Inquiry.updated_at.desc(), Inquiry.id.desc()).limit(limit)

        result = await self.session.execute(stmt)
        return [(row[0], row[1]) for row in result.all()]

    async def get_existing_inquiry(
        self, car_id: UUID, buyer_id: UUID
    ) -> Inquiry | None:
        result = await self.session.execute(
            select(Inquiry).where(
                Inquiry.car_id == car_id,
                Inquiry.buyer_id == buyer_id,
                Inquiry.deleted_at.is_(None),
            )
        )
        return result.scalars().first()

    async def create_inquiry(self, inquiry: Inquiry) -> Inquiry:
        self.session.add(inquiry)
        await self.session.flush()
        return inquiry

    async def create_message(self, message: InquiryMessage) -> InquiryMessage:
        self.session.add(message)
        await self.session.flush()
        return message

    async def update_inquiry(self, inquiry: Inquiry) -> Inquiry:
        self.session.add(inquiry)
        await self.session.flush()
        return inquiry

    async def count_inquiry_messages(self, inquiry_id: UUID) -> int:
        from sqlalchemy import func

        result = await self.session.execute(
            select(func.count(InquiryMessage.id)).where(
                InquiryMessage.inquiry_id == inquiry_id,
                InquiryMessage.deleted_at.is_(None),
            )
        )
        return result.scalar() or 0

    async def list_inquiry_messages(
        self, inquiry_id: UUID, cursor: "datetime | None", limit: int
    ) -> list[InquiryMessage]:
        stmt = select(InquiryMessage).where(InquiryMessage.inquiry_id == inquiry_id)

        if cursor:
            stmt = stmt.where(InquiryMessage.created_at < cursor)

        stmt = stmt.order_by(
            InquiryMessage.created_at.desc(), InquiryMessage.id.desc()
        ).limit(limit)
        result = await self.session.execute(stmt)
        return list(result.scalars().all())
