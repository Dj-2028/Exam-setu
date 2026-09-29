"""Redis client for caching and pub/sub."""

from __future__ import annotations

import redis.asyncio as redis

from app.core.config import get_settings
from app.core.logging import get_logger

logger = get_logger(__name__)

_redis_client: redis.Redis | None = None


async def get_redis_client() -> redis.Redis:
    """Return the singleton async Redis client."""
    global _redis_client
    if _redis_client is None:
        settings = get_settings()
        _redis_client = redis.from_url(
            settings.redis_url,
            decode_responses=True,
        )
        logger.info("redis_connected", url=settings.redis_url[:20] + "...")
    return _redis_client


async def close_redis() -> None:
    """Close the Redis connection (called on shutdown)."""
    global _redis_client
    if _redis_client is not None:
        await _redis_client.close()
        _redis_client = None
