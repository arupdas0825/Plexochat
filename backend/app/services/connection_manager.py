"""WebSocket connection and presence manager with Redis-backed distributed state.

Holds a process-local mapping of user_id -> set of active WebSocket connections
(supporting multiple tabs/devices per user), synchronized with Redis presence keys.
When Redis is unavailable or unconfigured, it degrades seamlessly to in-memory tracking.
"""

import asyncio
from collections import defaultdict
from typing import Any, Optional

from fastapi import WebSocket

from app.core.logging import logger
from app.db.redis_client import (
    clear_user_presence,
    is_user_present_redis,
    refresh_user_presence,
    set_user_presence,
)


class ConnectionManager:
    """Thread-safe (asyncio-safe) WebSocket registry with distributed Redis presence."""

    def __init__(self) -> None:
        # user_id -> set of active WebSocket connections
        self._connections: dict[str, set[WebSocket]] = defaultdict(set)
        self._lock = asyncio.Lock()

    # ------------------------------------------------------------------
    # Connection lifecycle
    # ------------------------------------------------------------------

    async def connect(self, user_id: str, websocket: WebSocket) -> None:
        """Register a new WebSocket connection for user_id and sync Redis presence."""
        async with self._lock:
            self._connections[user_id].add(websocket)
            total = len(self._connections[user_id])

        # Mark user present in Redis (TTL = 60s, refreshed by client pings)
        await set_user_presence(user_id, ttl_seconds=60)

        logger.info(f"WS connect: user_id={user_id} total_connections={total}")

    async def disconnect(self, user_id: str, websocket: WebSocket) -> None:
        """Remove a WebSocket connection for user_id. Cleans up Redis key if offline."""
        async with self._lock:
            self._connections[user_id].discard(websocket)
            has_remaining = bool(self._connections[user_id])
            if not has_remaining:
                del self._connections[user_id]

        if not has_remaining:
            # Clear presence key in Redis immediately
            await clear_user_presence(user_id)

        logger.info(f"WS disconnect: user_id={user_id}")

    async def heartbeat(self, user_id: str, ttl_seconds: int = 60) -> None:
        """Extends the Redis presence TTL on client ping/heartbeat."""
        await refresh_user_presence(user_id, ttl_seconds=ttl_seconds)

    # ------------------------------------------------------------------
    # Message delivery
    # ------------------------------------------------------------------

    async def send_to_user(self, user_id: str, payload: dict[str, Any]) -> bool:
        """Send a JSON payload to all active connections for user_id.

        Returns True if the user was online and the message was dispatched to
        at least one connection, False if the user has no active connections.
        Dead sockets are silently removed.
        """
        async with self._lock:
            sockets = set(self._connections.get(user_id, set()))

        if not sockets:
            return False

        dead: list[WebSocket] = []
        delivered = False
        for ws in sockets:
            try:
                await ws.send_json(payload)
                delivered = True
            except Exception as exc:
                logger.warning(
                    f"WS send failed for user_id={user_id}: {exc} — marking socket dead"
                )
                dead.append(ws)

        # Prune dead sockets
        if dead:
            async with self._lock:
                for ws in dead:
                    self._connections[user_id].discard(ws)
                if not self._connections.get(user_id):
                    self._connections.pop(user_id, None)

        return delivered

    # ------------------------------------------------------------------
    # Presence queries
    # ------------------------------------------------------------------

    def is_online(self, user_id: str) -> bool:
        """Returns True if user_id has at least one active local WebSocket connection."""
        return bool(self._connections.get(user_id))

    async def is_online_async(self, user_id: str) -> bool:
        """Checks local connections first, falling back to Redis for multi-instance deployments."""
        if bool(self._connections.get(user_id)):
            return True
        redis_online = await is_user_present_redis(user_id)
        if redis_online is not None:
            return redis_online
        return False

    def online_users(self) -> set[str]:
        """Returns the set of all currently-connected user IDs on this instance."""
        return set(self._connections.keys())


# Singleton — imported everywhere that needs WS presence access.
connection_manager = ConnectionManager()
