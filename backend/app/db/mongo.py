"""MongoDB Atlas client initialization and connection management using Motor."""

from typing import Optional
import certifi
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from app.core.config import settings
from app.core.logging import logger

from urllib.parse import urlsplit
import pymongo
import motor

client: Optional[AsyncIOMotorClient] = None
db: Optional[AsyncIOMotorDatabase] = None


def _get_safe_mongo_diagnostics() -> dict:
    """Extracts non-sensitive diagnostic info from configuration. Never exposes secrets."""
    scheme = "unknown"
    host_masked = "unknown"
    try:
        parts = urlsplit(settings.MONGODB_URI)
        scheme = parts.scheme or "unknown"
        host_masked = parts.hostname or "unknown"
    except Exception:
        pass

    return {
        "scheme": scheme,
        "cluster_host": host_masked,
        "database": settings.database_name,
        "pymongo_version": pymongo.__version__,
        "motor_version": getattr(motor, "version", getattr(motor, "__version__", "unknown")),
        "tls_ca_file": "certifi" if certifi.where() else "default",
    }


async def connect_to_mongo() -> None:
    """Initializes Motor MongoDB client using MONGODB_URI and MONGODB_DATABASE from settings."""
    global client, db
    diag = _get_safe_mongo_diagnostics()
    logger.info(
        f"[MongoDB Diagnostic] Attempting connection: scheme={diag['scheme']} | "
        f"host={diag['cluster_host']} | db={diag['database']} | "
        f"pymongo={diag['pymongo_version']} | motor={diag['motor_version']} | "
        f"tls_ca={diag['tls_ca_file']} | timeout=10s"
    )
    try:
        client = AsyncIOMotorClient(
            settings.MONGODB_URI,
            serverSelectionTimeoutMS=10000,
            tlsCAFile=certifi.where(),
        )
        db = client[settings.database_name]
        # Perform startup ping check
        await ping_mongo()
        logger.info("[MongoDB Diagnostic] MongoDB connection successful and verified.")
    except Exception as e:
        err_str = str(e)
        if "TLSV1_ALERT_INTERNAL_ERROR" in err_str:
            category = "ATLAS_NETWORK_ACCESS_DENIED (Client IP is not whitelisted in MongoDB Atlas Network Access)"
        elif "Authentication failed" in err_str or "auth failed" in err_str.lower():
            category = "AUTHENTICATION_FAILED (MongoDB Atlas username/password rejected)"
        elif "ServerSelectionTimeoutError" in err_str:
            category = "SERVER_SELECTION_TIMEOUT (Could not reach cluster within 10s)"
        else:
            category = "CONNECTION_ERROR"

        logger.error(f"[MongoDB Diagnostic] Failure Category: {category} | Error: {e}")
        client = None
        db = None
        raise


async def ping_mongo() -> bool:
    """Sends a ping command to MongoDB Atlas to verify connection health."""
    if client is None:
        raise RuntimeError("MongoDB client is not initialized.")
    # The 'ping' command checks server availability and authentication
    await client.admin.command("ping")
    return True


async def close_mongo_connection() -> None:
    """Closes Motor MongoDB client connection cleanly."""
    global client, db
    if client:
        logger.info("Closing MongoDB Atlas connection...")
        client.close()
        client = None
        db = None
        logger.info("MongoDB Atlas connection closed.")


def get_database() -> AsyncIOMotorDatabase:
    """Exposes the active MongoDB database handle for application services."""
    if db is None:
        raise RuntimeError("MongoDB database is not initialized. Ensure connect_to_mongo() has been called.")
    return db
