from fastapi import FastAPI, Depends, status, Response
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import sentry_sdk
import secrets
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBasic, HTTPBasicCredentials
from app.core.logging import setup_logging
from contextlib import asynccontextmanager
from app.core.config import settings
from pathlib import Path
import os
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
    
    # Validate email service is configured
    if not settings.RESEND_API_KEY or settings.RESEND_API_KEY.strip() == "":
        error_msg = (
            "CRITICAL CONFIGURATION ERROR: Application startup blocked!\n"
            "RESEND_API_KEY is not configured.\n\n"
            "Email service is required for:\n"
            "  - User registration (OTP delivery)\n"
            "  - Login verification (OTP delivery)\n"
            "  - Password reset requests\n"
            "  - Email address changes\n\n"
            "Required Action:\n"
            "  - Set RESEND_API_KEY in environment variables\n"
            "  - Get your API key from: https://resend.com/api-keys\n\n"
            "Note: Application cannot function without email service in production.\n"
        )
        import logging
        logger = logging.getLogger(__name__)
        logger.critical(error_msg)
        raise RuntimeError(error_msg)
    
    # Warn if using test API key in production
    if settings.ENVIRONMENT == "production" and settings.RESEND_API_KEY.startswith("re_test_"):
        import logging
        logger = logging.getLogger(__name__)
        logger.warning(
            "WARNING: Using Resend test API key in production environment. "
            "Test keys have limited functionality and should only be used for development. "
            "Replace with a production API key from: https://resend.com/api-keys"
        )
    
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

# CORS Middleware Configuration
# 
# Purpose: Enable Cross-Origin Resource Sharing for frontend-backend communication
# 
# Configuration Details:
#   - allow_origins: List of allowed origins from settings.CORS_ORIGINS
#     * Development: ["http://localhost:5173", "http://localhost:5174", "http://localhost:5175"]
#     * Production: Must be updated to actual production domain(s) via environment variable
#   
#   - allow_credentials=True: REQUIRED for cookie-based JWT authentication
#     * Enables the frontend to send cookies with cross-origin requests
#     * Required for secure authentication flow with httponly cookies
#     * When credentials=True, origins MUST be explicit (no wildcards)
#   
#   - allow_methods: HTTP methods permitted for cross-origin requests
#     * Covers all RESTful operations needed by the API
#   
#   - allow_headers: Request headers the browser can send in cross-origin requests
#     * Content-Type: For JSON request bodies
#     * Authorization: For Bearer token authentication (backup to cookies)
#     * X-Correlation-ID, X-Request-ID: For distributed tracing
# 
# Development Mode (Separate Servers):
#   Frontend: http://localhost:5173 (Vite dev server)
#   Backend:  http://localhost:8000 (FastAPI)
#   → CORS is ACTIVE - frontend makes cross-origin requests to backend
# 
# Integrated Mode (Backend Serves Frontend):
#   Application: http://localhost:8000 (serves both API and frontend)
#   → CORS is NOT needed (same-origin), but configuration remains active for consistency
# 
# Production Configuration:
#   Set CORS_ORIGINS environment variable to your production domain(s):
#   Example: CORS_ORIGINS='["https://trustedcars.com","https://www.trustedcars.com"]'
# 
# Security Requirements:
#   ✓ Always use explicit origins (never "*" with credentials)
#   ✓ Use HTTPS in production
#   ✓ Limit origins to the minimum set of trusted domains
#   ✓ Keep allow_credentials=True for authentication to work
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

# ============================================
# STATIC FILE SERVING FOR FRONTEND INTEGRATION
# ============================================
# Mount static files and implement SPA fallback AFTER all API routers
# to ensure API routes have priority over static file serving
# Configuration: Set SERVE_FRONTEND=true in .env to enable this feature

# Frontend build directory path (relative to backend/app/main.py)
FRONTEND_DIST_PATH = Path(__file__).parent.parent.parent / "frontend" / "dist"

if settings.SERVE_FRONTEND:
    import logging
    logger = logging.getLogger(__name__)
    
    # Validate frontend build directory exists
    if not FRONTEND_DIST_PATH.exists():
        error_msg = (
            f"Frontend build directory not found: {FRONTEND_DIST_PATH}\n"
            "The backend is configured to serve frontend static files (SERVE_FRONTEND=true), "
            "but the frontend has not been built yet.\n\n"
            "Required Action:\n"
            "  1. Build the frontend: cd frontend && npm run build\n"
            "  2. Or disable frontend serving: Set SERVE_FRONTEND=false in .env\n\n"
            "To run backend without frontend integration:\n"
            "  - Set SERVE_FRONTEND=false (API-only mode)\n"
            "  - Run frontend separately: cd frontend && npm run dev"
        )
        logger.critical(error_msg)
        raise RuntimeError(error_msg)
    
    # Validate index.html exists
    index_file = FRONTEND_DIST_PATH / "index.html"
    if not index_file.exists():
        error_msg = (
            f"Frontend index.html not found: {index_file}\n"
            "The frontend build directory exists but appears to be incomplete.\n\n"
            "Required Action:\n"
            "  - Rebuild the frontend: cd frontend && npm run build\n"
            "  - Ensure the build process completes successfully"
        )
        logger.critical(error_msg)
        raise RuntimeError(error_msg)
    
    # Mount /assets directory for static assets (JS, CSS, images)
    # These files have hashed filenames and are immutable, so they get aggressive caching
    assets_path = FRONTEND_DIST_PATH / "assets"
    if assets_path.exists():
        app.mount(
            "/assets",
            StaticFiles(directory=str(assets_path)),
            name="static_assets"
        )
        logger.info(f"✓ Mounted /assets directory from {assets_path}")
    else:
        logger.warning(f"⚠️  Assets directory not found: {assets_path}")
    
    # SPA Fallback Route: Serve index.html for all unmatched routes
    # This enables client-side routing (React Router) to handle frontend routes
    # Must be registered LAST to act as a catch-all for non-API routes
    @app.get("/{full_path:path}")
    async def serve_frontend_spa_fallback(full_path: str):
        """
        SPA (Single Page Application) fallback route.
        
        Serves index.html for all routes that don't match API endpoints or static assets.
        This enables client-side routing where React Router handles navigation without
        server-side redirects.
        
        Route Priority:
        1. API routes (e.g., /api/v1/cars) - handled by FastAPI routers
        2. Static assets (e.g., /assets/index-abc123.js) - handled by StaticFiles middleware
        3. Everything else (e.g., /, /cars, /login) - handled by this fallback (returns index.html)
        
        Cache Headers:
        - index.html gets no-cache headers to ensure users always get the latest version
        - This is critical for deploying frontend updates without cache issues
        - Static assets in /assets get immutable cache headers (set by StaticFiles middleware)
        
        Args:
            full_path: The requested path (captured by FastAPI path parameter)
            
        Returns:
            FileResponse: The index.html file with no-cache headers
            
        Raises:
            HTTPException: 404 if the route starts with 'api/' but no API handler matched
        """
        # This should never happen because API routes are registered first,
        # but we include this check for clarity and debugging
        if full_path.startswith("api/"):
            from fastapi import HTTPException
            raise HTTPException(
                status_code=404, 
                detail="API endpoint not found"
            )
        
        # Serve index.html for all other routes (SPA client-side routing)
        # React Router will handle the routing on the client side
        return FileResponse(
            index_file,
            media_type="text/html",
            headers={
                "Cache-Control": "no-cache, no-store, must-revalidate",
                "Pragma": "no-cache",
                "Expires": "0"
            }
        )
    
    logger.info(
        f"✓ Frontend static file serving enabled\n"
        f"  - Serving from: {FRONTEND_DIST_PATH}\n"
        f"  - SPA fallback: All non-API routes return index.html\n"
        f"  - Access application at: {settings.BACKEND_URL}"
    )
else:
    logger = logging.getLogger(__name__)
    logger.info(
        "ℹ️  Frontend serving disabled (SERVE_FRONTEND=false)\n"
        "  - Backend running in API-only mode\n"
        "  - API available at: {}/api/v1\n"
        "  - To enable frontend serving: Set SERVE_FRONTEND=true in .env"
    )
