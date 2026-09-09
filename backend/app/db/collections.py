"""Typed collection accessors for MongoDB.

CRITICAL ARCHITECTURAL CONSTRAINT:
There is NO durable messages or chat-history collection.
The only message-related collection is `pending_messages`, which is
a TEMPORARY store-and-forward queue governed by a 48-hour TTL index and
explicit deletion upon recipient acknowledgement. It must never grow into
a permanent message log.
"""

from motor.motor_asyncio import AsyncIOMotorCollection
from app.db.mongo import get_database


def get_users_collection() -> AsyncIOMotorCollection:
    """Returns the `users` collection."""
    return get_database()["users"]


def get_connections_collection() -> AsyncIOMotorCollection:
    """Returns the `connections` collection (stores ACCEPTED connection pairs)."""
    return get_database()["connections"]


def get_connection_requests_collection() -> AsyncIOMotorCollection:
    """Returns the `connection_requests` collection (stores pending, declined, and blocked requests)."""
    return get_database()["connection_requests"]


def get_pending_messages_collection() -> AsyncIOMotorCollection:
    """Returns the `pending_messages` TTL collection.

    This collection stores messages for offline recipients with a 48-hour TTL
    index on `created_at`. Records are deleted immediately upon delivery and
    must NEVER be treated as a permanent message store.
    """
    return get_database()["pending_messages"]


def get_device_keys_collection() -> AsyncIOMotorCollection:
    """Returns the `device_keys` collection.

    Stores per-device public key material (Olm identity key + one-time prekeys).
    PRIVATE KEYS ARE NEVER STORED HERE — only public key material registered
    by authenticated clients for E2EE session establishment.
    """
    return get_database()["device_keys"]


def get_collection(name: str) -> AsyncIOMotorCollection:
    """Returns a named collection from the active MongoDB database."""
    return get_database()[name]

