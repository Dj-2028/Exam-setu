"""Redis pub/sub for SSE event fan-out across API instances."""

from __future__ import annotations

import json
from typing import Any

from app.core.logging import get_logger
from app.integrations.redis.client import get_redis_client

logger = get_logger(__name__)

SSE_CHANNEL_PREFIX = "examsetu:sse:"


async def publish_event(
    channel: str,
    event_type: str,
    data: dict[str, Any],
) -> None:
    """Publish an event to a Redis pub/sub channel for SSE fan-out."""
    client = await get_redis_client()
    message = json.dumps({
        "event": event_type,
        "data": data,
    }, default=str)
    await client.publish(f"{SSE_CHANNEL_PREFIX}{channel}", message)
    logger.debug("sse_event_published", channel=channel, event_type=event_type)


async def subscribe_channel(channel: str):
    """Subscribe to a Redis pub/sub channel. Returns an async generator of messages."""
    client = await get_redis_client()
    pubsub = client.pubsub()
    await pubsub.subscribe(f"{SSE_CHANNEL_PREFIX}{channel}")

    try:
        async for message in pubsub.listen():
            if message["type"] == "message":
                yield json.loads(message["data"])
    finally:
        await pubsub.unsubscribe(f"{SSE_CHANNEL_PREFIX}{channel}")
        await pubsub.close()
