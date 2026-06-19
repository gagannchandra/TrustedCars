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
        health_status["database"] = f"failed: {str(e)}"
        is_ready = False

    # 2. Check Redis
    try:
        redis_client = redis.from_url(settings.REDIS_URL)
        await redis_client.ping()
        await redis_client.close()
        health_status["redis"] = "ok"
    except Exception as e:
        health_status["redis"] = f"failed: {str(e)}"
        is_ready = False

    # 3. Check Worker
    # Import the global worker from main or check its flag
    from app.main import worker

    if worker._running:
        health_status["worker"] = "ok"
    else:
        health_status["worker"] = "failed: not running"
        is_ready = False

    # 4. Check Pending Migrations (simplified - checking alembic_version)
    try:
        result = await db.execute(text("SELECT version_num FROM alembic_version"))
        version = result.scalar()
        health_status["migrations"] = f"ok (current: {version})"
    except Exception as e:
        # If the table doesn't exist or query fails, migrations are likely pending
        health_status["migrations"] = f"failed: {str(e)}"
        is_ready = False

    if not is_ready:
        health_status["status"] = "not_ready"
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=health_status
        )

    return health_status


@router.get("/health/error")
async def error_check():
    raise ValueError("This is a test exception to verify Sentry and Monitoring.")
