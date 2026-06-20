import redis.asyncio as redis
from app.core.config import settings

redis_client = redis.from_url(
    settings.REDIS_URL, 
    decode_responses=True,
    socket_connect_timeout=2,
    socket_timeout=2,
    max_connections=50
)


async def get_redis():
    return redis_client
