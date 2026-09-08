"""MongoDB Atlas client initialization and connection management using Motor."""

from typing import Optional
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from app.core.config import settings
from app.core.logging import logger

client: Optional[AsyncIOMotorClient] = None
db: Optional[AsyncIOMotorDatabase] = None


async def connect_to_mongo() -> None:
    """Initializes Motor MongoDB client using MONGODB_URI and MONGODB_DATABASE from settings."""
    global client, db
    logger.info("Initializing MongoDB Atlas connection...")
    try:
        client = AsyncIOMotorClient(
            settings.MONGODB_URI,
            serverSelectionTimeoutMS=5000,
        )
        db = client[settings.database_name]
        # Perform startup ping check
        await ping_mongo()
        logger.info("MongoDB connection successful")
    except Exception as e:
        logger.error(f"Failed to connect to MongoDB Atlas: {e}")
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
