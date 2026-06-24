from fastapi import FastAPI, Depends, status, Response
import sentry_sdk
import secrets
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBasic, HTTPBasicCredentials
from app.core.logging import setup_logging
from contextlib import asynccontextmanager
from app.core.config import settings
from app.shared.exceptions.handlers import (
    CustomException,
    custom_exception_handler,
    http_exception_handler,
)
from starlette.exceptions import HTTPException
from prometheus_client import generate_latest, CONTENT_TYPE_LATEST
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
from app.core.limiter import limiter
from app.modules.auth.router import router as auth_router
from app.modules.users.router import router as users_router, dealers_router
from app.modules.cars.router import router as cars_router, dealers_cars_router
from app.modules.images.router import router as images_router, car_images_router
from app.modules.inquiries.router import router as inquiries_router
from app.modules.wishlist.router import router as wishlist_router
from app.modules.reviews.router import router as reviews_router, user_reviews_router
from app.modules.admin.router import router as admin_router
from app.modules.health.router import router as health_router
from app.bootstrap.subscribers import setup_subscribers
from app.db.session import engine

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    setup_logging()
    
    # Validate OTP authentication is enabled in production
    if settings.ENVIRONMENT == "production" and settings.DISABLE_OTP_AUTH:
        error_msg = (
            "CRITICAL SECURITY ERROR: Application startup blocked!\n"
            "OTP authentication is disabled (DISABLE_OTP_AUTH=true) in production environment.\n"
            "This is a security violation that bypasses email verification.\n\n"
            "Required Action:\n"
            "  - Set DISABLE_OTP_AUTH=false in production environment variables\n"
            "  - Or remove DISABLE_OTP_AUTH entirely (defaults to false)\n\n"
            "OTP email verification is mandatory for production to ensure:\n"
            "  - Users own the email addresses they register with\n"
            "  - Account security through verified email access\n"
            "  - Prevention of unauthorized account creation\n"
        )
        # Log the error before raising
        import logging
        logger = logging.getLogger(__name__)
        logger.critical(error_msg)
        raise RuntimeError(error_msg)
    
    if settings.SENTRY_DSN:
        # Use environment-based sampling rates
        # Development: 100% sampling for debugging
        # Production: 10% sampling to reduce overhead and quota usage
        traces_sample_rate = 1.0 if settings.ENVIRONMENT == "development" else 0.1
        profiles_sample_rate = 1.0 if settings.ENVIRONMENT == "development" else 0.1
        
        sentry_sdk.init(
            dsn=settings.SENTRY_DSN,
            traces_sample_rate=traces_sample_rate,
            profiles_sample_rate=profiles_sample_rate,
            environment=settings.ENVIRONMENT,
        )
    setup_subscribers()
    yield
    # Shutdown
    from app.db.redis import redis_client

    await redis_client.close()
    await engine.dispose()


app = FastAPI(
    title=settings.PROJECT_NAME,
    lifespan=lifespan,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_middleware(SlowAPIMiddleware)

# Set up CORS
from app.core.middleware import CorrelationIdMiddleware, SecurityHeadersMiddleware

app.add_middleware(CorrelationIdMiddleware)
app.add_middleware(SecurityHeadersMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization", "X-Correlation-ID", "X-Request-ID"],
)

# Exception handlers
app.add_exception_handler(CustomException, custom_exception_handler)  # type: ignore
app.add_exception_handler(HTTPException, http_exception_handler)  # type: ignore

@app.exception_handler(Exception)
async def generic_exception_handler(request, exc):
    import sentry_sdk
    sentry_sdk.capture_exception(exc)
    from fastapi.responses import JSONResponse
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error. Please try again later."},
    )

from app.shared.audit.router import router as audit_router
from app.modules.admin.routers.settings import router as settings_router

app.include_router(health_router, tags=["health"])

security = HTTPBasic()

def get_current_metrics_user(credentials: HTTPBasicCredentials = Depends(security)):
    correct_username = secrets.compare_digest(credentials.username, "admin")
    correct_password = secrets.compare_digest(credentials.password, settings.METRICS_PASSWORD)
    if not (correct_username and correct_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Basic"},
        )
    return credentials.username

@app.get("/metrics", response_class=Response)
def metrics(user: str = Depends(get_current_metrics_user)):
    return Response(generate_latest(), media_type=CONTENT_TYPE_LATEST)

app.include_router(auth_router, prefix=f"{settings.API_V1_STR}/auth", tags=["auth"])
app.include_router(users_router, prefix=f"{settings.API_V1_STR}/users", tags=["users"])
app.include_router(
    dealers_router, prefix=f"{settings.API_V1_STR}/dealers", tags=["dealers"]
)
app.include_router(cars_router, prefix=f"{settings.API_V1_STR}/cars", tags=["cars"])
app.include_router(
    car_images_router,
    prefix=f"{settings.API_V1_STR}/cars",
    tags=["Car Images"],
)
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
app.include_router(audit_router, prefix=f"{settings.API_V1_STR}")
app.include_router(settings_router, prefix=f"{settings.API_V1_STR}/admin")
