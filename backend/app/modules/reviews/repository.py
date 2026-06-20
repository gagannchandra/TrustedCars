from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from sqlalchemy import text
from uuid import UUID
from app.modules.reviews.models import Review


class ReviewsRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_review_by_id(
        self, review_id: UUID, include_deleted: bool = False
    ) -> Review | None:
        stmt = select(Review).where(Review.id == review_id)
        if not include_deleted:
            stmt = stmt.where(Review.deleted_at.is_(None))
        result = await self.session.execute(stmt)
        return result.scalars().first()

    async def get_review_by_reviewer_seller_car(
        self, reviewer_id: UUID, seller_id: UUID, car_id: UUID
    ) -> Review | None:
        result = await self.session.execute(
            select(Review).where(
                Review.reviewer_id == reviewer_id,
                Review.seller_id == seller_id,
                Review.car_id == car_id,
            )
        )
        return result.scalars().first()

    async def create_review(self, review: Review) -> Review:
        self.session.add(review)
        await self.session.flush()
        return review

    async def update_review(self, review: Review) -> Review:
        self.session.add(review)
        await self.session.flush()
        return review

    async def update_seller_aggregate(self, seller_id: UUID):
        lock_query = text("SELECT id FROM users WHERE id = :seller_id FOR UPDATE")
        await self.session.execute(lock_query, {"seller_id": seller_id})

        query = text("""
            UPDATE users
            SET rating = COALESCE((SELECT AVG(rating) FROM reviews WHERE seller_id = :seller_id AND deleted_at IS NULL), 0),
                review_count = (SELECT COUNT(id) FROM reviews WHERE seller_id = :seller_id AND deleted_at IS NULL)
            WHERE id = :seller_id
        """)
        await self.session.execute(query, {"seller_id": seller_id})

    async def count_seller_reviews(self, seller_id: UUID) -> int:
        from sqlalchemy import func

        result = await self.session.execute(
            select(func.count(Review.id)).where(
                Review.seller_id == seller_id, Review.deleted_at.is_(None)
            )
        )
        return result.scalar() or 0

    async def list_seller_reviews(
        self, seller_id: UUID, cursor: "datetime | None", limit: int
    ) -> list[Review]:
        stmt = select(Review).where(
            Review.seller_id == seller_id, Review.deleted_at.is_(None)
        )
        if cursor:
            stmt = stmt.where(Review.created_at < cursor)
        stmt = stmt.order_by(Review.created_at.desc(), Review.id.desc()).limit(limit)
        result = await self.session.execute(stmt)
        return list(result.scalars().all())
