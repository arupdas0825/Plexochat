"""Structured logging setup with correlation/request ID tracking."""

import logging
import sys
from contextvars import ContextVar
from typing import Optional

# Context variable for tracing request IDs across async tasks
request_id_ctx: ContextVar[Optional[str]] = ContextVar("request_id_ctx", default=None)


class RequestIdFilter(logging.Filter):
    """Injects correlation/request_id into log records."""

    def filter(self, record: logging.LogRecord) -> bool:
        record.request_id = request_id_ctx.get() or "system"
        return True


def setup_logging() -> logging.Logger:
    """Configures structured server-side logging with request_id formatting."""
    logger = logging.getLogger("plexochat")
    logger.setLevel(logging.INFO)

    # Avoid adding duplicate handlers if setup_logging is called multiple times
    if not logger.handlers:
        handler = logging.StreamHandler(sys.stdout)
        handler.setLevel(logging.INFO)
        formatter = logging.Formatter(
            fmt="[%(asctime)s] [%(levelname)s] [req:%(request_id)s] %(name)s: %(message)s",
            datefmt="%Y-%m-%d %H:%M:%S",
        )
        handler.setFormatter(formatter)
        handler.addFilter(RequestIdFilter())
        logger.addHandler(handler)

    return logger


logger = setup_logging()
