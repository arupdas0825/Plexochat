"""In-memory rate limiter for search, connection requests, and user discovery.

Thread-safe (asyncio-safe) sliding window rate limiter.
"""

import asyncio
import time
from collections import defaultdict, deque
from typing import Dict, Deque

from app.core.errors import RateLimitExceededError
from app.core.logging import logger


class SlidingWindowRateLimiter:
    """In-memory sliding window rate limiter."""

    def __init__(self) -> None:
        self._requests: Dict[str, Deque[float]] = defaultdict(deque)
        self._cooldowns: Dict[str, float] = {}
        self._lock = asyncio.Lock()

    async def check(self, key: str, max_requests: int, window_seconds: int) -> None:
        """Enforces a maximum number of requests within a sliding window.
        
        Raises RateLimitExceededError if limit is reached.
        """
        now = time.time()
        async with self._lock:
            timestamps = self._requests[key]
            # Prune timestamps outside the current window
            cutoff = now - window_seconds
            while timestamps and timestamps[0] < cutoff:
                timestamps.popleft()

            if len(timestamps) >= max_requests:
                oldest = timestamps[0]
                retry_after = max(1, int(oldest + window_seconds - now))
                logger.warning(
                    f"Rate limit exceeded for key='{key}': {len(timestamps)}/{max_requests} "
                    f"in {window_seconds}s (retry_after={retry_after}s)"
                )
                raise RateLimitExceededError(
                    message=f"Rate limit exceeded. Try again in {retry_after} seconds.",
                    retry_after=retry_after,
                )

            timestamps.append(now)

    async def check_cooldown(self, key: str, cooldown_seconds: int, error_message: str = "Please wait before trying again.") -> None:
        """Enforces a minimum interval between specific actions (e.g., re-requesting a user)."""
        now = time.time()
        async with self._lock:
            last_time = self._cooldowns.get(key)
            if last_time is not None:
                elapsed = now - last_time
                if elapsed < cooldown_seconds:
                    retry_after = max(1, int(cooldown_seconds - elapsed))
                    logger.warning(f"Cooldown active for key='{key}' (retry_after={retry_after}s)")
                    raise RateLimitExceededError(
                        message=f"{error_message} (retry in {retry_after}s)",
                        retry_after=retry_after,
                    )
            self._cooldowns[key] = now

    async def reset(self) -> None:
        """Clear all tracking state (useful in test suites)."""
        async with self._lock:
            self._requests.clear()
            self._cooldowns.clear()


# Global singleton instance
rate_limiter = SlidingWindowRateLimiter()
