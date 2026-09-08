import sys
from pathlib import Path
import uuid
from contextlib import asynccontextmanager
from typing import AsyncGenerator

# Ensure backend directory is in sys.path when executed from workspace root
_backend_dir = str(Path(__file__).resolve().parent.parent)
if _backend_dir not in sys.path:
    sys.path.insert(0, _backend_dir)

from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from pymongo import ASCENDING
from app.core.config import settings
from app.core.errors import register_exception_handlers
from app.core.logging import logger, request_id_ctx
from app.db.mongo import close_mongo_connection, connect_to_mongo, ping_mongo
from app.db.collections import get_pending_messages_collection
from app.routers.auth import router as auth_router
from app.routers.users import router as users_router
from app.routers.connections import router as connections_router
from app.api.v1.ws import router as ws_router
from app.db.indexes import ensure_indexes


async def _ensure_pending_messages_ttl_index() -> None:
    """Creates the TTL index on pending_messages.created_at if it doesn't exist.

    expireAfterSeconds=172800 → 48-hour TTL.
    This is idempotent: MongoDB ignores duplicate createIndex calls with the
    same spec, so it's safe to call on every startup.
    """
    col = get_pending_messages_collection()
    await col.create_index(
        [("created_at", ASCENDING)],
        expireAfterSeconds=172800,
        name="pending_messages_ttl_48h",
        background=True,
    )
    logger.info("pending_messages TTL index ensured (48-hour expiry).")


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Application lifespan manager for database connections and background tasks."""
    logger.info("Initializing PlexoChat backend services...")
    # 1. Connect to MongoDB Atlas and perform startup ping check
    try:
        await connect_to_mongo()
    except Exception as e:
        logger.error(f"MongoDB Atlas startup connection error: {e}")
        raise RuntimeError(f"Database connection failed on startup: {e}") from e

    # 2. Ensure TTL index on pending_messages (offline message queue)
    try:
        await _ensure_pending_messages_ttl_index()
    except Exception as e:
        # Non-fatal: log and continue — messages will still work, TTL just won't auto-expire
        logger.warning(f"Could not create pending_messages TTL index: {e}")

    # 3. Ensure collection indexes and backfill user fields
    try:
        await ensure_indexes()
    except Exception as e:
        logger.warning(f"Could not ensure indexes: {e}")

    logger.info("PlexoChat backend started successfully.")
    yield

    # Shutdown
    logger.info("Shutting down PlexoChat backend services...")
    await close_mongo_connection()
    logger.info("PlexoChat backend shutdown complete.")


app = FastAPI(
    title="PlexoChat API",
    description="Privacy-focused messaging backend.",
    version="2.0.0",
    lifespan=lifespan,
    docs_url="/docs" if settings.ENVIRONMENT == "development" else None,
    redoc_url="/redoc" if settings.ENVIRONMENT == "development" else None,
)

# 1. Request ID / Correlation ID Middleware
@app.middleware("http")
async def request_id_middleware(request: Request, call_next) -> Response:
    req_id = request.headers.get("X-Request-ID") or str(uuid.uuid4())
    token = request_id_ctx.set(req_id)
    try:
        response = await call_next(request)
        response.headers["X-Request-ID"] = req_id
        return response
    finally:
        request_id_ctx.reset(token)


# 2. CORS Middleware locked to known frontend origins (allows Vercel domains and local dev)
_cors_origin_regex = settings.CORS_ORIGIN_REGEX
if not _cors_origin_regex:
    # Always allow any *.vercel.app domain (including preview URLs) and localhost / loopback
    _cors_origin_regex = r"^(https://.*\.vercel\.app|https?://(localhost|127\.0\.0\.1)(:\d+)?)$"

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_origin_regex=_cors_origin_regex,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["X-Request-ID"],
)

# 3. Centralized Exception Handlers
register_exception_handlers(app)


# 4. Health Check Endpoint
@app.get("/health", tags=["System"])
async def health_check() -> dict:
    """Health check validating MongoDB connectivity."""
    try:
        await ping_mongo()
        return {
            "status": "ok",
            "mongodb": "connected",
        }
    except Exception as e:
        logger.warning(f"Health check MongoDB ping failed: {e}")
        return {
            "status": "degraded",
            "mongodb": "disconnected",
        }


# 5. API Routers
app.include_router(auth_router, prefix="/api/v1")
app.include_router(users_router, prefix="/api/v1")
app.include_router(connections_router, prefix="/api/v1")
app.include_router(ws_router, prefix="/api/v1")


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("app.main:app", host=settings.HOST, port=settings.PORT, reload=True)

