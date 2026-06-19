from fastapi import FastAPI
import sentry_sdk
from fastapi.middleware.cors import CORSMiddleware
from app.core.logging import setup_logging
from contextlib import asynccontextmanager
from app.core.config import settings
from app.shared.exceptions.handlers import (
    CustomException,
    custom_exception_handler,
    http_exception_handler,
)
from starlette.exceptions import HTTPException
from prometheus_client import make_asgi_app
from app.modules.auth.router import router as auth_router
from app.modules.users.router import router as users_router, dealers_router
from app.modules.cars.router import router as cars_router, dealers_cars_router
from app.modules.images.router import router as images_router, car_images_router
from app.modules.inquiries.router import router as inquiries_router
from app.modules.wishlist.router import router as wishlist_router
from app.modules.reviews.router import router as reviews_router, user_reviews_router
from app.modules.admin.router import router as admin_router
from app.modules.health.router import router as health_router
from app.core.subscribers import setup_subscribers
from app.db.session import engine

from app.core.worker import AsyncOutboxWorker

worker = AsyncOutboxWorker()


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    setup_logging()
    if settings.SENTRY_DSN:
        sentry_sdk.init(
            dsn=settings.SENTRY_DSN,
            traces_sample_rate=1.0,
            profiles_sample_rate=1.0,
        )
    setup_subscribers()
    import os

    if os.getenv("TESTING") != "1":
        await worker.start()
    yield
    # Shutdown
    if os.getenv("TESTING") != "1":
        await worker.stop()
    from app.db.redis import redis_client

    await redis_client.close()
    await engine.dispose()


app = FastAPI(
    title=settings.PROJECT_NAME,
    lifespan=lifespan,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
)

# Set up CORS
from app.core.middleware import CorrelationIdMiddleware

app.add_middleware(CorrelationIdMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Exception handlers
app.add_exception_handler(CustomException, custom_exception_handler)  # type: ignore
app.add_exception_handler(HTTPException, http_exception_handler)  # type: ignore

app.include_router(health_router, tags=["health"])

# Metrics endpoint
metrics_app = make_asgi_app()
app.mount("/metrics", metrics_app)

app.include_router(auth_router, prefix=f"{settings.API_V1_STR}/auth", tags=["auth"])
app.include_router(users_router, prefix=f"{settings.API_V1_STR}/users", tags=["users"])
app.include_router(
    dealers_router, prefix=f"{settings.API_V1_STR}/dealers", tags=["dealers"]
)
app.include_router(cars_router, prefix=f"{settings.API_V1_STR}/cars", tags=["cars"])
app.include_router(car_images_router)
app.include_router(
    dealers_cars_router, prefix=f"{settings.API_V1_STR}/dealers", tags=["dealers"]
)
app.include_router(
    images_router, prefix=f"{settings.API_V1_STR}/images", tags=["images"]
)
app.include_router(inquiries_router)
app.include_router(
    wishlist_router, prefix=f"{settings.API_V1_STR}/wishlist", tags=["wishlist"]
)
app.include_router(reviews_router)
app.include_router(user_reviews_router)
app.include_router(admin_router, prefix=f"{settings.API_V1_STR}/admin", tags=["admin"])
