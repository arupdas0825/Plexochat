"""Connection management router: search, requests, accept, decline, block, and chat unlock."""

from datetime import datetime, timezone
from typing import List, Optional
from bson import ObjectId
from fastapi import APIRouter, Depends, status
from pymongo import ReturnDocument

from app.core.errors import (
    AuthenticationError,
    AuthorizationError,
    ConflictError,
    NotFoundError,
)
from app.core.logging import logger
from app.core.security import get_current_user
from app.db.collections import (
    get_connections_collection,
    get_connection_requests_collection,
    get_users_collection,
)
from app.models.connection import (
    ConnectionCreateRequest,
    ConnectionPublic,
    ConnectionRequestPublic,
    ConnectionRequestStatus,
    RelationshipStatus,
    UserProfilePublic,
)
from app.models.user import User
from app.services.connection_manager import connection_manager
from app.services.rate_limiter import rate_limiter

router = APIRouter(prefix="/connections", tags=["Connections"])


def _to_object_id_or_str(val: str):
    """Safely converts string to ObjectId if valid, else returns string."""
    return ObjectId(val) if ObjectId.is_valid(val) else val


async def _fetch_public_profile(user_id: str) -> Optional[UserProfilePublic]:
    """Helper to fetch a user document and convert to UserProfilePublic."""
    users_col = get_users_collection()
    query = {"_id": _to_object_id_or_str(user_id)}
    doc = await users_col.find_one(query)
    if not doc:
        return None
    return UserProfilePublic(
        id=str(doc["_id"]),
        username=doc.get("username", "user"),
        plexochat_id=doc.get("plexochat_id", doc.get("username", "px_user")),
        display_name=doc.get("display_name") or doc.get("username") or "User",
        photo_url=doc.get("photo_url"),
        preferred_receiving_language=doc.get("preferred_receiving_language", "en"),
        relationship_status=RelationshipStatus.ACCEPTED,
        online=connection_manager.is_online(str(doc["_id"])),
    )


@router.post(
    "/requests",
    response_model=ConnectionRequestPublic,
    status_code=status.HTTP_201_CREATED,
    summary="Send a connection request",
    description="Sends a single connection request to target user. Rate-limited and cooldown-checked.",
)
async def send_connection_request(
    payload: ConnectionCreateRequest,
    current_user: User = Depends(get_current_user),
) -> ConnectionRequestPublic:
    """Creates or re-activates a connection request."""
    target_id = payload.target_user_id.strip()

    # 1. Basic validations
    if target_id == current_user.id:
        raise ConflictError("You cannot send a connection request to yourself.")

    # 2. Rate limit (10 requests/min) & cooldown (30s per target)
    await rate_limiter.check(f"req_rate:{current_user.id}", max_requests=10, window_seconds=60)
    await rate_limiter.check_cooldown(
        f"cooldown:{current_user.id}:{target_id}",
        cooldown_seconds=30,
        error_message="Please wait before sending another request to this user.",
    )

    # 3. Ensure target user exists
    users_col = get_users_collection()
    target_doc = await users_col.find_one({"_id": _to_object_id_or_str(target_id)})
    if not target_doc:
        raise NotFoundError("Target user not found.")
    target_id_str = str(target_doc["_id"])

    # 4. Check existing connections table
    conn_col = get_connections_collection()
    existing_conn = await conn_col.find_one(
        {
            "$or": [
                {"user_a_id": current_user.id, "user_b_id": target_id_str},
                {"user_a_id": target_id_str, "user_b_id": current_user.id},
            ]
        }
    )
    if existing_conn:
        if existing_conn.get("status") == "ACCEPTED":
            raise ConflictError("You are already connected with this user.")
        if existing_conn.get("status") == "BLOCKED":
            if existing_conn.get("blocked_by") == current_user.id:
                raise ConflictError("You have blocked this user. Unblock them first.")
            # Target blocked current user -> neutral 404
            raise NotFoundError("Target user not found.")

    # 5. Check connection_requests table
    req_col = get_connection_requests_collection()
    existing_req = await req_col.find_one(
        {
            "$or": [
                {"sender_id": current_user.id, "receiver_id": target_id_str},
                {"sender_id": target_id_str, "receiver_id": current_user.id},
            ]
        }
    )

    now = datetime.now(timezone.utc)

    if existing_req:
        current_status = existing_req.get("status")
        if current_status == ConnectionRequestStatus.PENDING:
            if existing_req["sender_id"] == current_user.id:
                raise ConflictError("A connection request is already pending.")
            else:
                raise ConflictError("This user has already sent you a connection request. Please accept it.")
        elif current_status == ConnectionRequestStatus.ACCEPTED:
            raise ConflictError("You are already connected with this user.")
        elif current_status == ConnectionRequestStatus.BLOCKED:
            raise NotFoundError("Target user not found.")
        # If DECLINED or CANCELLED: allow re-requesting by updating the single document
        req_id = existing_req["_id"]
        update_result = await req_col.find_one_and_update(
            {"_id": req_id},
            {
                "$set": {
                    "sender_id": current_user.id,
                    "receiver_id": target_id_str,
                    "status": ConnectionRequestStatus.PENDING,
                    "note": payload.note,
                    "updated_at": now,
                }
            },
            return_document=ReturnDocument.AFTER,
        )
        saved_req = update_result
    else:
        # Create brand new request
        new_doc = {
            "sender_id": current_user.id,
            "receiver_id": target_id_str,
            "status": ConnectionRequestStatus.PENDING,
            "note": payload.note,
            "created_at": now,
            "updated_at": now,
        }
        ins_res = await req_col.insert_one(new_doc)
        new_doc["_id"] = ins_res.inserted_id
        saved_req = new_doc

    req_id_str = str(saved_req["_id"])

    # 6. Real-time WebSocket notification if receiver is online
    if connection_manager.is_online(target_id_str):
        await connection_manager.send_to_user(
            target_id_str,
            {
                "type": "CONNECTION_REQUEST_RECEIVED",
                "data": {
                    "request_id": req_id_str,
                    "sender_id": current_user.id,
                    "sender_profile": {
                        "id": current_user.id,
                        "username": current_user.username,
                        "plexochat_id": current_user.plexochat_id,
                        "display_name": current_user.display_name,
                        "photo_url": current_user.photo_url,
                        "preferred_receiving_language": current_user.preferred_receiving_language,
                    },
                    "note": payload.note,
                    "created_at": now.isoformat(),
                },
            },
        )

    peer_prof = await _fetch_public_profile(target_id_str)
    return ConnectionRequestPublic(
        id=req_id_str,
        sender_id=current_user.id,
        receiver_id=target_id_str,
        status=ConnectionRequestStatus.PENDING,
        created_at=saved_req.get("created_at", now),
        updated_at=saved_req.get("updated_at", now),
        peer_profile=peer_prof,
    )


@router.get(
    "/requests/incoming",
    response_model=List[ConnectionRequestPublic],
    summary="Get pending incoming connection requests",
)
async def get_incoming_requests(
    current_user: User = Depends(get_current_user),
) -> List[ConnectionRequestPublic]:
    """List all pending incoming requests for the authenticated user."""
    await rate_limiter.check(f"read:{current_user.id}", max_requests=120, window_seconds=60)
    req_col = get_connection_requests_collection()
    cursor = req_col.find(
        {"receiver_id": current_user.id, "status": ConnectionRequestStatus.PENDING}
    ).sort("created_at", -1)

    results: List[ConnectionRequestPublic] = []
    async for doc in cursor:
        sender_id = doc["sender_id"]
        sender_prof = await _fetch_public_profile(sender_id)
        results.append(
            ConnectionRequestPublic(
                id=str(doc["_id"]),
                sender_id=sender_id,
                receiver_id=current_user.id,
                status=ConnectionRequestStatus.PENDING,
                created_at=doc["created_at"],
                updated_at=doc.get("updated_at", doc["created_at"]),
                peer_profile=sender_prof,
            )
        )
    return results


@router.get(
    "/requests/outgoing",
    response_model=List[ConnectionRequestPublic],
    summary="Get pending outgoing connection requests",
)
async def get_outgoing_requests(
    current_user: User = Depends(get_current_user),
) -> List[ConnectionRequestPublic]:
    """List all pending outgoing requests sent by the authenticated user."""
    await rate_limiter.check(f"read:{current_user.id}", max_requests=120, window_seconds=60)
    req_col = get_connection_requests_collection()
    cursor = req_col.find(
        {"sender_id": current_user.id, "status": ConnectionRequestStatus.PENDING}
    ).sort("created_at", -1)

    results: List[ConnectionRequestPublic] = []
    async for doc in cursor:
        target_id = doc["receiver_id"]
        target_prof = await _fetch_public_profile(target_id)
        results.append(
            ConnectionRequestPublic(
                id=str(doc["_id"]),
                sender_id=current_user.id,
                receiver_id=target_id,
                status=ConnectionRequestStatus.PENDING,
                created_at=doc["created_at"],
                updated_at=doc.get("updated_at", doc["created_at"]),
                peer_profile=target_prof,
            )
        )
    return results


@router.post(
    "/requests/{request_id}/accept",
    summary="Accept a connection request",
)
async def accept_connection_request(
    request_id: str,
    current_user: User = Depends(get_current_user),
) -> dict:
    """Accept an incoming connection request and unlock chat."""
    req_col = get_connection_requests_collection()
    req = await req_col.find_one({"_id": _to_object_id_or_str(request_id)})
    if not req:
        raise NotFoundError("Connection request not found.")

    if req["receiver_id"] != current_user.id:
        raise AuthorizationError("You do not have permission to accept this request.")

    if req["status"] != ConnectionRequestStatus.PENDING:
        raise ConflictError(f"Request cannot be accepted (current status: {req['status']}).")

    now = datetime.now(timezone.utc)
    sender_id = req["sender_id"]

    # 1. Update request status to ACCEPTED
    await req_col.update_one(
        {"_id": req["_id"]},
        {"$set": {"status": ConnectionRequestStatus.ACCEPTED, "updated_at": now}},
    )

    # 2. Upsert connections document
    conn_col = get_connections_collection()
    user_a, user_b = sorted([current_user.id, sender_id])

    await conn_col.find_one_and_update(
        {
            "$or": [
                {"user_a_id": current_user.id, "user_b_id": sender_id},
                {"user_a_id": sender_id, "user_b_id": current_user.id},
            ]
        },
        {
            "$set": {
                "user_a_id": user_a,
                "user_b_id": user_b,
                "status": "ACCEPTED",
                "updated_at": now,
            },
            "$setOnInsert": {
                "created_at": now,
            },
        },
        upsert=True,
    )

    # 3. WebSocket notification to sender
    if connection_manager.is_online(sender_id):
        await connection_manager.send_to_user(
            sender_id,
            {
                "type": "CONNECTION_ACCEPTED",
                "data": {
                    "request_id": str(req["_id"]),
                    "peer_id": current_user.id,
                    "peer_profile": {
                        "id": current_user.id,
                        "username": current_user.username,
                        "plexochat_id": current_user.plexochat_id,
                        "display_name": current_user.display_name,
                        "photo_url": current_user.photo_url,
                        "preferred_receiving_language": current_user.preferred_receiving_language,
                    },
                    "connected_at": now.isoformat(),
                },
            },
        )

    logger.info(f"Connection accepted between {current_user.id} and {sender_id}")
    return {"status": "success", "message": "Connection accepted.", "connected_user_id": sender_id}


@router.post(
    "/requests/{request_id}/decline",
    summary="Decline a connection request",
)
async def decline_connection_request(
    request_id: str,
    current_user: User = Depends(get_current_user),
) -> dict:
    """Decline an incoming connection request."""
    req_col = get_connection_requests_collection()
    req = await req_col.find_one({"_id": _to_object_id_or_str(request_id)})
    if not req:
        raise NotFoundError("Connection request not found.")

    if req["receiver_id"] != current_user.id:
        raise AuthorizationError("You do not have permission to decline this request.")

    if req["status"] != ConnectionRequestStatus.PENDING:
        raise ConflictError(f"Request cannot be declined (current status: {req['status']}).")

    now = datetime.now(timezone.utc)
    await req_col.update_one(
        {"_id": req["_id"]},
        {"$set": {"status": ConnectionRequestStatus.DECLINED, "updated_at": now}},
    )

    logger.info(f"Connection declined by {current_user.id} for request {request_id}")
    return {"status": "success", "message": "Connection declined."}


@router.post(
    "/{user_id}/block",
    summary="Block a user and revoke chat access",
)
async def block_user(
    user_id: str,
    current_user: User = Depends(get_current_user),
) -> dict:
    """Block a user immediately revokes chat access, rejects WS message frames, and prevents new requests."""
    if user_id == current_user.id:
        raise ConflictError("You cannot block yourself.")

    users_col = get_users_collection()
    target_doc = await users_col.find_one({"_id": _to_object_id_or_str(user_id)})
    if not target_doc:
        raise NotFoundError("User not found.")
    target_id = str(target_doc["_id"])

    now = datetime.now(timezone.utc)
    user_a, user_b = sorted([current_user.id, target_id])

    # 1. Upsert connections document as BLOCKED
    conn_col = get_connections_collection()
    await conn_col.find_one_and_update(
        {
            "$or": [
                {"user_a_id": current_user.id, "user_b_id": target_id},
                {"user_a_id": target_id, "user_b_id": current_user.id},
            ]
        },
        {
            "$set": {
                "user_a_id": user_a,
                "user_b_id": user_b,
                "status": "BLOCKED",
                "blocked_by": current_user.id,
                "updated_at": now,
            },
            "$setOnInsert": {
                "created_at": now,
            },
        },
        upsert=True,
    )

    # 2. Update any pending or existing connection requests to BLOCKED
    req_col = get_connection_requests_collection()
    await req_col.update_many(
        {
            "$or": [
                {"sender_id": current_user.id, "receiver_id": target_id},
                {"sender_id": target_id, "receiver_id": current_user.id},
            ]
        },
        {"$set": {"status": ConnectionRequestStatus.BLOCKED, "updated_at": now}},
    )

    # 3. Real-time notification to current user and target (revoke chat)
    revoke_frame = {
        "type": "CONNECTION_REVOKED",
        "data": {"peer_id": target_id, "status": "BLOCKED"},
    }
    await connection_manager.send_to_user(current_user.id, revoke_frame)

    logger.info(f"User {current_user.id} blocked user {target_id}")
    return {"status": "success", "message": "User blocked successfully."}


@router.post(
    "/{user_id}/unblock",
    summary="Unblock a previously blocked user",
)
async def unblock_user(
    user_id: str,
    current_user: User = Depends(get_current_user),
) -> dict:
    """Unblock a user."""
    conn_col = get_connections_collection()
    result = await conn_col.delete_one(
        {
            "$or": [
                {"user_a_id": current_user.id, "user_b_id": user_id, "blocked_by": current_user.id},
                {"user_a_id": user_id, "user_b_id": current_user.id, "blocked_by": current_user.id},
            ],
            "status": "BLOCKED",
        }
    )
    if result.deleted_count == 0:
        raise NotFoundError("Blocked relationship not found.")

    logger.info(f"User {current_user.id} unblocked user {user_id}")
    return {"status": "success", "message": "User unblocked successfully."}


@router.get(
    "",
    response_model=List[ConnectionPublic],
    summary="List accepted connections",
    description="Returns all active, accepted connections for the authenticated user.",
)
async def list_connections(
    current_user: User = Depends(get_current_user),
) -> List[ConnectionPublic]:
    """Returns all ACCEPTED connections with full peer profiles."""
    await rate_limiter.check(f"read:{current_user.id}", max_requests=120, window_seconds=60)
    conn_col = get_connections_collection()
    cursor = conn_col.find(
        {
            "$or": [
                {"user_a_id": current_user.id},
                {"user_b_id": current_user.id},
            ],
            "status": "ACCEPTED",
        }
    ).sort("updated_at", -1)

    connections: List[ConnectionPublic] = []
    async for doc in cursor:
        peer_id = doc["user_b_id"] if doc["user_a_id"] == current_user.id else doc["user_a_id"]
        peer_profile = await _fetch_public_profile(peer_id)
        if not peer_profile:
            continue
        connections.append(
            ConnectionPublic(
                id=str(doc["_id"]),
                peer_user_id=peer_id,
                peer_profile=peer_profile,
                status="ACCEPTED",
                connected_at=doc.get("created_at", datetime.now(timezone.utc)),
            )
        )
    return connections
