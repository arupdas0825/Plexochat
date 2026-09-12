"""Conversation preferences router (mute, favorite, disappearing message TTL).

CRITICAL ARCHITECTURAL CONSTRAINT:
Conversations do not store message history on the server.
These preferences store only client-level preferences (muted, favorite, TTL)
per user per peer.
"""

from datetime import datetime, timezone
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pymongo import ReturnDocument

from app.core.security import get_current_user
from app.core.logging import logger
from app.db.collections import get_conversation_preferences_collection
from app.models.conversation import (
    ConversationPreferences,
    ConversationPreferencesUpdate,
)
from app.models.user import User

router = APIRouter(prefix="/conversations", tags=["Conversations"])


@router.get(
    "/{peer_id}/preferences",
    response_model=ConversationPreferences,
    summary="Get conversation preferences with peer",
    description="Fetches user-specific conversation preferences (muted, favorite, disappearing_ttl).",
)
async def get_conversation_preferences(
    peer_id: str,
    current_user: User = Depends(get_current_user),
) -> ConversationPreferences:
    """Returns conversation preferences for current_user with peer_id."""
    col = get_conversation_preferences_collection()
    doc = await col.find_one({"user_id": str(current_user.id), "peer_id": peer_id})

    if not doc:
        return ConversationPreferences(
            user_id=str(current_user.id),
            peer_id=peer_id,
            muted=False,
            favorite=False,
            disappearing_ttl=None,
            updated_at=datetime.now(timezone.utc),
        )

    return ConversationPreferences(
        user_id=doc["user_id"],
        peer_id=doc["peer_id"],
        muted=doc.get("muted", False),
        favorite=doc.get("favorite", False),
        disappearing_ttl=doc.get("disappearing_ttl"),
        updated_at=doc.get("updated_at", datetime.now(timezone.utc)),
    )


@router.patch(
    "/{peer_id}/preferences",
    response_model=ConversationPreferences,
    summary="Update conversation preferences with peer",
    description="Updates user-specific preferences (muted, favorite, disappearing_ttl) for this conversation.",
)
async def update_conversation_preferences(
    peer_id: str,
    payload: ConversationPreferencesUpdate,
    current_user: User = Depends(get_current_user),
) -> ConversationPreferences:
    """Updates and upserts conversation preferences."""
    now = datetime.now(timezone.utc)
    update_set: dict = {"updated_at": now}

    if payload.muted is not None:
        update_set["muted"] = payload.muted
    if payload.favorite is not None:
        update_set["favorite"] = payload.favorite
    if payload.disappearing_ttl is not None or "disappearing_ttl" in payload.model_fields_set:
        # Allow setting null/None to disable TTL
        update_set["disappearing_ttl"] = payload.disappearing_ttl

    col = get_conversation_preferences_collection()
    doc = await col.find_one_and_update(
        {"user_id": str(current_user.id), "peer_id": peer_id},
        {
            "$set": update_set,
            "$setOnInsert": {
                "user_id": str(current_user.id),
                "peer_id": peer_id,
            },
        },
        upsert=True,
        return_document=ReturnDocument.AFTER,
    )

    logger.info(
        f"Conversation preferences updated: user={current_user.id} peer={peer_id} "
        f"muted={doc.get('muted')} favorite={doc.get('favorite')} ttl={doc.get('disappearing_ttl')}"
    )

    return ConversationPreferences(
        user_id=doc["user_id"],
        peer_id=doc["peer_id"],
        muted=doc.get("muted", False),
        favorite=doc.get("favorite", False),
        disappearing_ttl=doc.get("disappearing_ttl"),
        updated_at=doc.get("updated_at", now),
    )
