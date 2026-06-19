from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker
from sqlalchemy import event
from sqlalchemy.exc import InterfaceError
import time
import structlog
from app.core.config import settings

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
            "pool_size": 100,
            "max_overflow": 50,
            "pool_pre_ping": True,
            "pool_recycle": 1800,
        }
    )

engine = create_async_engine(settings.DATABASE_URL, **engine_kwargs)


@event.listens_for(engine.sync_engine, "checkout")
def receive_checkout(dbapi_connection, connection_record, connection_proxy):
    connection_record.info["checkout_time"] = time.time()


@event.listens_for(engine.sync_engine, "checkin")
def receive_checkin(dbapi_connection, connection_record):
    checkout_time = connection_record.info.pop("checkout_time", None)
    if checkout_time:
        duration = time.time() - checkout_time
        if duration > 1.0:
            logger.warning("long_connection_hold", duration=duration)


@event.listens_for(engine.sync_engine, "invalidate")
def receive_invalidate(dbapi_connection, connection_record, exception):
    logger.warning("connection_invalidated", exception=str(exception))


AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    autocommit=False,
    autoflush=False,
    expire_on_commit=False,
)


async def get_db():
    session = AsyncSessionLocal()
    try:
        yield session
    finally:
        try:
            await session.close()
        except InterfaceError as e:
            logger.warning("suppressed_interface_error_on_close", error=str(e))
