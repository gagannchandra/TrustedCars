from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from app.db.session import get_db
import redis.asyncio as redis
from app.core.config import settings

router = APIRouter()


@router.get("/health/live")
async def liveness_check():
    return {"status": "alive"}


@router.get("/health/ready")
async def readiness_check(db: AsyncSession = Depends(get_db)):
    health_status = {
        "status": "ready",
        "database": "unknown",
        "redis": "unknown",
        "worker": "unknown",
        "migrations": "unknown",
    }

    is_ready = True

    # 1. Check PostgreSQL
    try:
        await db.execute(text("SELECT 1"))
        health_status["database"] = "ok"
    except Exception as e:
        import structlog
        structlog.get_logger(__name__).error("Health check DB error", error=str(e))
        health_status["database"] = "failed"
        is_ready = False

    # 2. Check Redis
    try:
        redis_client = redis.from_url(settings.REDIS_URL)
        await redis_client.ping()
        await redis_client.close()
        health_status["redis"] = "ok"
    except Exception as e:
        import structlog
        structlog.get_logger(__name__).error("Health check Redis error", error=str(e))
        health_status["redis"] = "failed"
        is_ready = False

    # 3. Check Worker (simplified - check for pending outbox events)
    try:
        from app.core.models import OutboxEvent
        from sqlalchemy import select, func
        
        # Check if there are any old pending events (older than 5 minutes)
        from datetime import datetime, timedelta, timezone
        five_min_ago = datetime.now(timezone.utc) - timedelta(minutes=5)
        
        stmt = select(func.count()).where(
            OutboxEvent.status == 'pending',
            OutboxEvent.created_at < five_min_ago
        )
        old_pending_count = await db.scalar(stmt)
        
        if old_pending_count and old_pending_count > 100:
            health_status["worker"] = f"warning: {old_pending_count} old pending events"
            # Don't fail health check, just warn
        else:
            health_status["worker"] = "ok"
    except Exception as e:
        import structlog
        structlog.get_logger(__name__).error("Health check Worker error", error=str(e))
        health_status["worker"] = "unknown"
        # Don't fail health check for worker status

    # 4. Check Pending Migrations (simplified - checking alembic_version)
    try:
        result = await db.execute(text("SELECT version_num FROM alembic_version"))
        version = result.scalar()
        health_status["migrations"] = f"ok (current: {version})"
    except Exception as e:
        import structlog
        structlog.get_logger(__name__).error("Health check Migrations error", error=str(e))
        # If the table doesn't exist or query fails, migrations are likely pending
        health_status["migrations"] = "failed"
        is_ready = False

    if not is_ready:
        health_status["status"] = "not_ready"
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=health_status
        )

    return health_status

