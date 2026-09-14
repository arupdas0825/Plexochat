"""Redis client initialization and presence management.

Provides distributed presence tracking and graceful degradation to in-memory state
when Redis is unavailable or unconfigured.
"""

from typing import Optional, Set
import redis.asyncio as aioredis
from app.core.config import settings
from app.core.logging import logger

redis_client: Optional[aioredis.Redis] = None


async def connect_to_redis() -> Optional[aioredis.Redis]:
    """Initializes async Redis client if REDIS_URL is configured."""
    global redis_client

    if not settings.REDIS_URL:
        logger.info("[Redis] REDIS_URL not configured. Operating with in-memory presence.")
        redis_client = None
        return None

    try:
        client = aioredis.from_url(
            settings.REDIS_URL,
            decode_responses=True,
            socket_connect_timeout=3,
            socket_timeout=3,
        )
        await client.ping()
        redis_client = client
        logger.info("[Redis] Connected successfully to Redis for distributed presence.")
        return redis_client
    except Exception as exc:
        logger.warning(
            f"[Redis] Could not connect to Redis ({exc}). "
            f"Gracefully degrading to in-memory presence."
        )
        redis_client = None
        return None


async def close_redis_connection() -> None:
    """Closes Redis connection cleanly."""
    global redis_client
    if redis_client:
        logger.info("[Redis] Closing Redis connection...")
        try:
            await redis_client.aclose()
        except Exception as exc:
            logger.warning(f"[Redis] Error while closing Redis: {exc}")
        finally:
            redis_client = None
        logger.info("[Redis] Redis connection closed.")


def get_redis() -> Optional[aioredis.Redis]:
    """Returns active Redis client or None if unavailable."""
    return redis_client


def is_redis_available() -> bool:
    """Returns True if Redis is initialized and connected."""
    return redis_client is not None


# ---------------------------------------------------------------------------
# Distributed Presence Helpers
# ---------------------------------------------------------------------------


async def set_user_presence(user_id: str, ttl_seconds: int = 60) -> bool:
    """Marks a user as online in Redis with an expiring TTL."""
    if not redis_client:
        return False
    try:
        await redis_client.set(f"presence:{user_id}", "online", ex=ttl_seconds)
        return True
    except Exception as exc:
        logger.warning(f"[Redis] Failed to set presence for user_id={user_id}: {exc}")
        return False


async def refresh_user_presence(user_id: str, ttl_seconds: int = 60) -> bool:
    """Refreshes the TTL of an active user's presence key."""
    if not redis_client:
        return False
    try:
        await redis_client.expire(f"presence:{user_id}", ttl_seconds)
        return True
    except Exception as exc:
        logger.warning(f"[Redis] Failed to refresh presence for user_id={user_id}: {exc}")
        return False


async def clear_user_presence(user_id: str) -> bool:
    """Removes a user's presence key on disconnect."""
    if not redis_client:
        return False
    try:
        await redis_client.delete(f"presence:{user_id}")
        return True
    except Exception as exc:
        logger.warning(f"[Redis] Failed to clear presence for user_id={user_id}: {exc}")
        return False


async def is_user_present_redis(user_id: str) -> Optional[bool]:
    """Returns True if user key exists in Redis, False if not, or None if Redis is unavailable."""
    if not redis_client:
        return None
    try:
        exists = await redis_client.exists(f"presence:{user_id}")
        return bool(exists)
    except Exception as exc:
        logger.warning(f"[Redis] Failed to check presence for user_id={user_id}: {exc}")
        return None
