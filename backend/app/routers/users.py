"""User discovery, profile lookup, and search endpoints."""

import re
from typing import List, Optional
from bson import ObjectId
from fastapi import APIRouter, Depends, Query

from app.core.errors import NotFoundError
from app.core.logging import logger
from app.core.security import get_current_user
from app.db.collections import (
    get_users_collection,
    get_connections_collection,
    get_connection_requests_collection,
)
from app.models.connection import RelationshipStatus, UserProfilePublic
from app.models.user import User
from app.services.rate_limiter import rate_limiter

router = APIRouter(prefix="/users", tags=["Users"])


async def _get_blocked_user_ids(user_id: str) -> set[str]:
    """Returns a set of user IDs where a block relationship exists (in either direction)."""
    conn_col = get_connections_collection()
    cursor = conn_col.find(
        {
            "$or": [
                {"user_a_id": user_id},
                {"user_b_id": user_id},
            ],
            "status": "BLOCKED",
        }
    )
    blocked_ids: set[str] = set()
    async for doc in cursor:
        peer_id = doc["user_b_id"] if doc["user_a_id"] == user_id else doc["user_a_id"]
        blocked_ids.add(peer_id)
    return blocked_ids


async def _resolve_relationship(current_user_id: str, target_user_id: str) -> tuple[RelationshipStatus, Optional[str]]:
    """Determines the contextual relationship status and request ID between two users."""
    conn_col = get_connections_collection()
    # 1. Check connections table
    conn = await conn_col.find_one(
        {
            "$or": [
                {"user_a_id": current_user_id, "user_b_id": target_user_id},
                {"user_a_id": target_user_id, "user_b_id": current_user_id},
            ]
        }
    )
    if conn:
        if conn.get("status") == "ACCEPTED":
            return RelationshipStatus.ACCEPTED, None
        if conn.get("status") == "BLOCKED":
            if conn.get("blocked_by") == current_user_id:
                return RelationshipStatus.BLOCKED, None
            # If target blocked current_user, pretend neutral NONE
            return RelationshipStatus.NONE, None

    # 2. Check pending requests
    req_col = get_connection_requests_collection()
    req = await req_col.find_one(
        {
            "$or": [
                {"sender_id": current_user_id, "receiver_id": target_user_id, "status": "PENDING"},
                {"sender_id": target_user_id, "receiver_id": current_user_id, "status": "PENDING"},
            ]
        }
    )
    if req:
        req_id = str(req["_id"])
        if req["sender_id"] == current_user_id:
            return RelationshipStatus.REQUEST_SENT, req_id
        return RelationshipStatus.REQUEST_RECEIVED, req_id

    return RelationshipStatus.NONE, None


@router.get(
    "/search",
    response_model=List[UserProfilePublic],
    summary="Search users by username, handle, or display name",
    description="Rate-limited discovery endpoint. Excludes self and blocked users.",
)
async def search_users(
    q: str = Query(..., min_length=1, max_length=50, description="Search query string"),
    current_user: User = Depends(get_current_user),
) -> List[UserProfilePublic]:
    """Search for other users across username, plexochat_id, and display_name."""
    # Enforce search rate limit: 30 requests / minute
    await rate_limiter.check(f"search:{current_user.id}", max_requests=30, window_seconds=60)

    clean_query = q.strip()
    if len(clean_query) < 2:
        return []

    safe_regex = re.escape(clean_query)
    regex_pattern = {"$regex": safe_regex, "$options": "i"}

    # Exclude blocked users & current user
    blocked_ids = await _get_blocked_user_ids(current_user.id)
    excluded_ids = blocked_ids | {current_user.id}

    users_col = get_users_collection()
    query_filter: dict = {
        "$and": [
            {
                "$or": [
                    {"username": regex_pattern},
                    {"plexochat_id": regex_pattern},
                    {"display_name": regex_pattern},
                ]
            }
        ]
    }

    # If valid MongoDB ObjectIds exist in excluded_ids, convert them; otherwise string match
    excluded_object_ids = []
    excluded_str_ids = []
    for ex_id in excluded_ids:
        if ObjectId.is_valid(ex_id):
            excluded_object_ids.append(ObjectId(ex_id))
        excluded_str_ids.append(ex_id)

    id_exclusions = []
    if excluded_object_ids:
        id_exclusions.append({"_id": {"$nin": excluded_object_ids}})
    if excluded_str_ids:
        id_exclusions.append({"firebase_uid": {"$nin": excluded_str_ids}})

    if id_exclusions:
        query_filter["$and"].extend(id_exclusions)

    cursor = users_col.find(query_filter).limit(20)
    results: List[UserProfilePublic] = []

    async for doc in cursor:
        target_id = str(doc["_id"])
        rel_status, req_id = await _resolve_relationship(current_user.id, target_id)

        # Do not return users who blocked current_user or are blocked
        if rel_status == RelationshipStatus.BLOCKED:
            continue

        results.append(
            UserProfilePublic(
                id=target_id,
                username=doc.get("username", "user"),
                plexochat_id=doc.get("plexochat_id", doc.get("username", "px_user")),
                display_name=doc.get("display_name") or doc.get("username") or "User",
                photo_url=doc.get("photo_url"),
                preferred_receiving_language=doc.get("preferred_receiving_language", "en"),
                relationship_status=rel_status,
                connection_request_id=req_id,
            )
        )

    return results


@router.get(
    "/{user_id}/profile",
    response_model=UserProfilePublic,
    summary="Get user profile with relationship status",
    description="Returns public profile and relationship status relative to the requesting user.",
)
async def get_user_profile(
    user_id: str,
    current_user: User = Depends(get_current_user),
) -> UserProfilePublic:
    """Fetch user profile with contextual relationship state."""
    # Enforce read rate limit: 120 requests / minute
    await rate_limiter.check(f"read:{current_user.id}", max_requests=120, window_seconds=60)

    users_col = get_users_collection()
    query: dict = {}
    if ObjectId.is_valid(user_id):
        query = {"$or": [{"_id": ObjectId(user_id)}, {"_id": user_id}]}
    else:
        query = {"_id": user_id}

    target_doc = await users_col.find_one(query)
    if not target_doc:
        # Fallback search by username or plexochat_id
        target_doc = await users_col.find_one({"$or": [{"username": user_id}, {"plexochat_id": user_id}]})

    if not target_doc:
        raise NotFoundError("User not found.")

    target_id = str(target_doc["_id"])
    rel_status, req_id = await _resolve_relationship(current_user.id, target_id)

    return UserProfilePublic(
        id=target_id,
        username=target_doc.get("username", "user"),
        plexochat_id=target_doc.get("plexochat_id", target_doc.get("username", "px_user")),
        display_name=target_doc.get("display_name") or target_doc.get("username") or "User",
        photo_url=target_doc.get("photo_url"),
        preferred_receiving_language=target_doc.get("preferred_receiving_language", "en"),
        relationship_status=rel_status,
        connection_request_id=req_id,
    )
