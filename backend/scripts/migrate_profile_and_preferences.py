"""Migration script: backfill user profile fields and ensure conversation_preferences indexes."""

import asyncio
import os
import sys
from pathlib import Path

# Add backend directory to sys.path
backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_dir))

from pymongo import ASCENDING
from app.db.mongo import connect_to_mongo, close_mongo_connection
from app.db.collections import get_users_collection, get_conversation_preferences_collection
from app.core.logging import logger


async def run_migration():
    logger.info("Connecting to MongoDB for migration...")
    await connect_to_mongo()

    users_col = get_users_collection()
    conv_pref_col = get_conversation_preferences_collection()

    # 1. Backfill missing profile fields on existing users
    res = await users_col.update_many(
        {
            "$or": [
                {"bio": {"$exists": False}},
                {"spoken_languages": {"$exists": False}},
                {"learning_languages": {"$exists": False}},
                {"interests": {"$exists": False}},
            ]
        },
        {
            "$set": {
                "bio": None,
                "spoken_languages": [],
                "learning_languages": [],
                "interests": [],
            }
        },
    )
    logger.info(f"User documents checked/updated: matched={res.matched_count} modified={res.modified_count}")

    # 2. Ensure compound unique index on conversation_preferences
    idx_name = await conv_pref_col.create_index(
        [("user_id", ASCENDING), ("peer_id", ASCENDING)],
        unique=True,
        name="conv_pref_user_peer_unique",
        background=True,
    )
    logger.info(f"Created/verified index on conversation_preferences: {idx_name}")

    await close_mongo_connection()
    logger.info("Migration completed successfully.")


if __name__ == "__main__":
    asyncio.run(run_migration())
