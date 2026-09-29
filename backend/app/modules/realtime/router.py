"""SSE (Server-Sent Events) realtime stream endpoint.

Scoped to the authenticated user's role and assignments.
Uses Redis pub/sub for fan-out across multiple API instances.
"""

from __future__ import annotations

import asyncio
import json
from typing import AsyncGenerator

from fastapi import APIRouter, Depends, Request
from fastapi.responses import StreamingResponse

from app.core.security import CurrentUser, get_current_user
from app.core.logging import get_logger
from app.integrations.redis.client import get_redis_client

logger = get_logger(__name__)

router = APIRouter(prefix="/events", tags=["realtime"])

HEARTBEAT_INTERVAL = 15  # seconds


async def _event_stream(
    user: CurrentUser,
    request: Request,
) -> AsyncGenerator[str, None]:
    """Generate an SSE event stream scoped to the authenticated user."""
    client = await get_redis_client()
    pubsub = client.pubsub()

    # Subscribe to role-based and user-specific channels
    channels = [f"examsetu:sse:role:{user.role}"]
    if user.uid:
        channels.append(f"examsetu:sse:user:{user.uid}")

    await pubsub.subscribe(*channels)
    logger.info("sse_connected", user_uid=user.uid, role=user.role)

    try:
        while True:
            # Check if client disconnected
            if await request.is_disconnected():
                break

            # Check for messages with a short timeout
            message = await pubsub.get_message(
                ignore_subscribe_messages=True,
                timeout=HEARTBEAT_INTERVAL,
            )

            if message and message["type"] == "message":
                data = json.loads(message["data"])
                event_type = data.get("event", "update")
                event_data = json.dumps(data.get("data", {}), default=str)
                yield f"event: {event_type}\ndata: {event_data}\n\n"
            else:
                # Heartbeat to keep connection alive through proxies
                yield ": heartbeat\n\n"

    except asyncio.CancelledError:
        pass
    finally:
        await pubsub.unsubscribe(*channels)
        await pubsub.close()
        logger.info("sse_disconnected", user_uid=user.uid)


@router.get("/stream")
async def stream_events(
    request: Request,
    current_user: CurrentUser = Depends(get_current_user),
):
    """SSE stream endpoint — authenticated, scoped to the user's role.

    Events include: progress updates, new flags, moderation assignments,
    AI suggestion results, and job status updates.
    """
    return StreamingResponse(
        _event_stream(current_user, request),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",  # Disable nginx buffering
        },
    )
