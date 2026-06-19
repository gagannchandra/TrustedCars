from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy import event
from typing import AsyncGenerator
import time
import structlog
from app.core.config import settings
from app.core.metrics import DATABASE_POOL_USAGE

logger = structlog.get_logger(__name__)

import os
from sqlalchemy.pool import NullPool

engine_kwargs: dict = {
    "echo": False,
    "future": True,
}

if os.getenv("TESTING") == "1":
    engine_kwargs["poolclass"] = NullPool
else:
    engine_kwargs.update(
        {
            "pool_size": settings.DATABASE_POOL_SIZE,
            "max_overflow": settings.DATABASE_MAX_OVERFLOW,
            "pool_timeout": settings.DATABASE_POOL_TIMEOUT,
            "pool_pre_ping": True,
            "pool_recycle": settings.DATABASE_POOL_RECYCLE_SECONDS,
        }
    )

engine = create_async_engine(settings.DATABASE_URL, **engine_kwargs)


def _record_pool_usage() -> None:
    checked_out = getattr(engine.sync_engine.pool, "checkedout", None)
    if checked_out is None:
        return
    DATABASE_POOL_USAGE.set(checked_out())


@event.listens_for(engine.sync_engine, "checkout")
def receive_checkout(dbapi_connection, connection_record, connection_proxy):
    connection_record.info["checkout_time"] = time.time()
    _record_pool_usage()


@event.listens_for(engine.sync_engine, "checkin")
def receive_checkin(dbapi_connection, connection_record):
    checkout_time = connection_record.info.pop("checkout_time", None)
    if checkout_time:
        duration = time.time() - checkout_time
        if duration > 1.0:
            logger.warning("long_connection_hold", duration=duration)
    _record_pool_usage()


@event.listens_for(engine.sync_engine, "invalidate")
def receive_invalidate(dbapi_connection, connection_record, exception):
    logger.warning("connection_invalidated", exception=str(exception))


AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    autocommit=False,
    autoflush=False,
    expire_on_commit=False,
)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionLocal() as session:
        try:
            yield session
        except Exception:
            await session.rollback()
            raise
