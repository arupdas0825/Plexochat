"""Verification script for MongoDB Atlas connection."""

import asyncio
import sys
from pathlib import Path

_backend_dir = str(Path(__file__).resolve().parent)
if _backend_dir not in sys.path:
    sys.path.insert(0, _backend_dir)

from app.core.config import settings
from app.db.mongo import connect_to_mongo, ping_mongo, close_mongo_connection


async def main():
    print("--- MongoDB Atlas Connection Test ---")
    print(f"Target Database: {settings.database_name}")
    print("Connecting to MongoDB Atlas using configured MONGODB_URI...")
    try:
        await connect_to_mongo()
        is_healthy = await ping_mongo()
        if is_healthy:
            print("[SUCCESS] MongoDB Atlas ping succeeded! Database connection is verified.")
        else:
            print("[FAIL] Ping returned unexpected status.")
    except Exception as e:
        print(f"[ERROR] Connection to MongoDB Atlas failed: {e}")
    finally:
        await close_mongo_connection()
        print("MongoDB Atlas connection closed.")


if __name__ == "__main__":
    asyncio.run(main())
