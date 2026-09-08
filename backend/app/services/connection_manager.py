"""In-memory WebSocket connection manager.

Holds a process-local mapping of user_id -> set of active WebSocket connections
(supporting multiple tabs/devices per user).

⚠️  SCALABILITY NOTE:
This implementation is intentionally in-memory only and is correct for a single
backend instance (which is the current deployment model). When PlexoChat scales
to multiple backend instances, this must be replaced with a Redis-backed presence
and pub/sub layer so that messages can be routed across instances. At that point,
`send_to_user` should publish to a Redis channel keyed by user_id, and each
instance should subscribe to deliver to its locally connected sockets.
"""

import asyncio
from collections import defaultdict
from typing import Any

from fastapi import WebSocket

from app.core.logging import logger


class ConnectionManager:
    """Thread-safe (asyncio-safe) in-memory WebSocket registry."""

    def __init__(self) -> None:
        # user_id -> set of active WebSocket connections
        self._connections: dict[str, set[WebSocket]] = defaultdict(set)
        self._lock = asyncio.Lock()

    # ------------------------------------------------------------------
    # Connection lifecycle
    # ------------------------------------------------------------------

    async def connect(self, user_id: str, websocket: WebSocket) -> None:
        """Register a new WebSocket connection for user_id."""
        async with self._lock:
            self._connections[user_id].add(websocket)
        logger.info(
            f"WS connect: user_id={user_id} "
            f"total_connections={len(self._connections[user_id])}"
        )

    async def disconnect(self, user_id: str, websocket: WebSocket) -> None:
        """Remove a WebSocket connection for user_id. Cleans up empty sets."""
        async with self._lock:
            self._connections[user_id].discard(websocket)
            if not self._connections[user_id]:
                del self._connections[user_id]
        logger.info(f"WS disconnect: user_id={user_id}")

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
        """Returns True if user_id has at least one active WebSocket connection."""
        return bool(self._connections.get(user_id))

    def online_users(self) -> set[str]:
        """Returns the set of all currently-connected user IDs."""
        return set(self._connections.keys())


# Singleton — imported everywhere that needs WS presence access.
connection_manager = ConnectionManager()
