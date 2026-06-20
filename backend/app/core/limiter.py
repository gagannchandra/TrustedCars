from slowapi import Limiter
from slowapi.util import get_ipaddr
from app.core.config import settings

limiter = Limiter(key_func=get_ipaddr, storage_uri=settings.REDIS_URL, in_memory_fallback_enabled=True)
