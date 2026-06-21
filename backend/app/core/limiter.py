from slowapi import Limiter
from slowapi.util import get_ipaddr
from app.core.config import settings
from fastapi import Request

def get_user_or_ip(request: Request) -> str:
    return getattr(request.state, "user_id", None) or get_ipaddr(request)

limiter = Limiter(key_func=get_user_or_ip, storage_uri=settings.REDIS_URL, in_memory_fallback_enabled=True)
