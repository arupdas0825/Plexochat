"""MongoDB index management and data integrity initialization."""

import re
import uuid
from pymongo import ASCENDING
from pymongo.errors import DuplicateKeyError

from app.core.logging import logger
from app.db.collections import (
    get_users_collection,
    get_connections_collection,
    get_connection_requests_collection,
)


def _sanitize_username(candidate: str) -> str:
    """Sanitize candidate string to fit ^[a-z0-9_]{3,30}$."""
    clean = re.sub(r"[^a-z0-9_]", "", candidate.lower())
    if len(clean) < 3:
        clean = f"user_{clean}"
    if len(clean) < 3:
        clean = f"user_{uuid.uuid4().hex[:6]}"
    return clean[:30]


def _sanitize_plexochat_id(candidate: str) -> str:
    """Sanitize candidate string to fit ^[a-zA-Z0-9_.-]{3,30}$."""
    clean = re.sub(r"[^a-zA-Z0-9_.-]", "", candidate)
    if len(clean) < 3:
        clean = f"px_{clean}"
    if len(clean) < 3:
        clean = f"px_{uuid.uuid4().hex[:6]}"
    return clean[:30]


async def safe_backfill_users() -> None:
    """Safely backfills missing username, plexochat_id, display_name on existing user documents.
    
    This ensures that unique index creation does not collide on null values and
    that existing OAuth accounts validate cleanly against the User Pydantic schema.
    """
    users_col = get_users_collection()
    cursor = users_col.find(
        {
            "$or": [
                {"username": {"$exists": False}},
                {"username": None},
                {"username": ""},
                {"plexochat_id": {"$exists": False}},
                {"plexochat_id": None},
                {"plexochat_id": ""},
                {"preferred_receiving_language": {"$exists": False}},
                {"display_name": {"$exists": False}},
                {"display_name": None},
                {"display_name": ""},
            ]
        }
    )

    async for doc in cursor:
        doc_id = doc["_id"]
        email = doc.get("email") or ""
        email_prefix = email.split("@")[0] if "@" in email else ""
        raw_name = doc.get("display_name") or email_prefix or f"user_{str(doc_id)[-6:]}"

        updates: dict = {}

        # 1. Backfill display_name if missing
        if not doc.get("display_name"):
            updates["display_name"] = raw_name[:50]

        # 2. Backfill preferred_receiving_language
        if not doc.get("preferred_receiving_language"):
            updates["preferred_receiving_language"] = "en"

        # 3. Backfill username
        if not doc.get("username"):
            base_un = _sanitize_username(email_prefix or raw_name)
            un = base_un
            counter = 1
            while await users_col.find_one({"username": un, "_id": {"$ne": doc_id}}):
                suffix = str(counter)
                un = f"{base_un[:30 - len(suffix)]}{suffix}"
                counter += 1
            updates["username"] = un

        # 4. Backfill plexochat_id
        if not doc.get("plexochat_id"):
            base_px = _sanitize_plexochat_id(doc.get("username") or updates.get("username") or raw_name)
            px = base_px
            counter = 1
            while await users_col.find_one({"plexochat_id": px, "_id": {"$ne": doc_id}}):
                suffix = str(counter)
                px = f"{base_px[:30 - len(suffix)]}{suffix}"
                counter += 1
            updates["plexochat_id"] = px

        if updates:
            logger.info(f"Backfilling user {doc_id}: {updates}")
            await users_col.update_one({"_id": doc_id}, {"$set": updates})


async def ensure_indexes() -> None:
    """Creates required indexes for users, connections, and connection_requests collections."""
    # First, safely backfill any legacy users so unique indexes do not fail
    try:
        await safe_backfill_users()
    except Exception as e:
        logger.warning(f"Error during users backfill: {e}")

    # 1. Users collection indexes
    users_col = get_users_collection()
    try:
        await users_col.create_index(
            [("firebase_uid", ASCENDING)],
            unique=True,
            name="uniq_users_firebase_uid",
            background=True,
        )
        await users_col.create_index(
            [("username", ASCENDING)],
            unique=True,
            name="uniq_users_username",
            background=True,
        )
        await users_col.create_index(
            [("plexochat_id", ASCENDING)],
            unique=True,
            name="uniq_users_plexochat_id",
            background=True,
        )
        logger.info("Users indexes ensured.")
    except Exception as e:
        logger.warning(f"Could not create user indexes: {e}")

    # 2. Connection Requests collection indexes
    requests_col = get_connection_requests_collection()
    try:
        # Unique pair (sender_id, receiver_id)
        await requests_col.create_index(
            [("sender_id", ASCENDING), ("receiver_id", ASCENDING)],
            unique=True,
            name="uniq_request_sender_receiver",
            background=True,
        )
        # Fast query for incoming requests
        await requests_col.create_index(
            [("receiver_id", ASCENDING), ("status", ASCENDING)],
            name="idx_request_receiver_status",
            background=True,
        )
        # Fast query for outgoing requests
        await requests_col.create_index(
            [("sender_id", ASCENDING), ("status", ASCENDING)],
            name="idx_request_sender_status",
            background=True,
        )
        logger.info("Connection requests indexes ensured.")
    except Exception as e:
        logger.warning(f"Could not create connection_requests indexes: {e}")

    # 3. Connections collection indexes
    conn_col = get_connections_collection()
    try:
        # Compound unique connection pair
        await conn_col.create_index(
            [("user_a_id", ASCENDING), ("user_b_id", ASCENDING)],
            unique=True,
            name="uniq_connection_pair",
            background=True,
        )
        await conn_col.create_index(
            [("user_a_id", ASCENDING), ("status", ASCENDING)],
            name="idx_connection_user_a_status",
            background=True,
        )
        await conn_col.create_index(
            [("user_b_id", ASCENDING), ("status", ASCENDING)],
            name="idx_connection_user_b_status",
            background=True,
        )
        logger.info("Connections indexes ensured.")
    except Exception as e:
        logger.warning(f"Could not create connections indexes: {e}")
