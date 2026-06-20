import uuid
import time
import structlog
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from app.core.context import request_id_ctx, correlation_id_ctx, user_id_ctx
from app.core.metrics import (
    ACTIVE_REQUESTS,
    REQUEST_COUNT,
    REQUEST_DURATION,
    REQUEST_ERRORS,
)

logger = structlog.get_logger(__name__)


class CorrelationIdMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        req_id = str(uuid.uuid4())
        corr_id = request.headers.get("X-Correlation-ID", str(uuid.uuid4()))

        # Try to extract user_id if present (e.g. from JWT or state)
        # Note: In a real app, user_id might be set after auth middleware.
        user_id = getattr(request.state, "user_id", None)

        request.state.request_id = req_id
        request.state.correlation_id = corr_id

        req_token = request_id_ctx.set(req_id)
        corr_token = correlation_id_ctx.set(corr_id)
        if user_id:
            user_token = user_id_ctx.set(str(user_id))
        else:
            user_token = None

        start_time = time.time()
        ACTIVE_REQUESTS.inc()

        logger.info(
            "request_started",
            service="trustedcars-api",
            method=request.method,
            url=str(request.url),
            client_host=request.client.host if request.client else None,
        )

        try:
            response = await call_next(request)
            
            route = request.scope.get("route")
            endpoint = route.path if route else request.url.path

            duration = time.time() - start_time
            REQUEST_DURATION.labels(method=request.method, endpoint=endpoint).observe(
                duration
            )
            REQUEST_COUNT.labels(
                method=request.method,
                endpoint=endpoint,
                status_code=response.status_code,
            ).inc()

            logger.info(
                "request_completed",
                service="trustedcars-api",
                status_code=response.status_code,
                duration=duration,
            )
            response.headers["X-Request-ID"] = req_id
            response.headers["X-Correlation-ID"] = corr_id
            return response
        except Exception as e:
            route = request.scope.get("route")
            endpoint = route.path if route else request.url.path
            duration = time.time() - start_time
            REQUEST_ERRORS.labels(method=request.method, endpoint=endpoint).inc()
            logger.error(
                "request_failure",
                service="trustedcars-api",
                duration=duration,
                error=str(e),
                exc_info=True,
            )
            raise
        finally:
            ACTIVE_REQUESTS.dec()
            request_id_ctx.reset(req_token)
            correlation_id_ctx.reset(corr_token)
            if user_token is not None:
                user_id_ctx.reset(user_token)

class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        response.headers["Strict-Transport-Security"] = "max-age=63072000; includeSubDomains"
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Content-Security-Policy"] = (
            "default-src 'self'; "
            "img-src 'self' https://*.amazonaws.com data:; "
            "script-src 'self'; "
            "object-src 'none';"
        )
        return response
