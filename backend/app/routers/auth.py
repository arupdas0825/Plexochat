"""Firebase authentication synchronization endpoint.

POST /api/v1/auth/sync
  - Verifies the Firebase ID token from the Authorization header.
  - Upserts a minimal user document into the MongoDB `users` collection.
  - Ensures valid username, plexochat_id, display_name.
  - Returns the stored user profile including MongoDB user_id.
  - Does NOT store passwords or raw tokens.
"""

from datetime import datetime, timezone
import re
import uuid
from typing import Optional

from fastapi import APIRouter, Header
from pydantic import BaseModel
from pymongo import ReturnDocument

from app.core.errors import AuthenticationError
from app.core.logging import logger
from app.core.security import verify_firebase_id_token
from app.db.collections import get_users_collection

router = APIRouter(tags=["Auth"])


class SyncResponse(BaseModel):
    """Safe user profile returned after upsert. No passwords or tokens stored."""
    user_id: str
    firebase_uid: str
    username: str
    plexochat_id: str
    email: Optional[str] = None
    display_name: Optional[str] = None
    photo_url: Optional[str] = None
    email_verified: bool = False
    preferred_receiving_language: str = "en"
    bio: Optional[str] = None
    spoken_languages: list[str] = []
    learning_languages: list[str] = []
    interests: list[str] = []
    created_at: datetime
    updated_at: datetime
    is_new_user: bool


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


async def sync_firebase_user_record(claims: dict) -> tuple[dict, bool]:
    """Ensures a Firebase-authenticated user document exists and is up to date in MongoDB.

    Returns (user_doc, is_new_user).
    """
    firebase_uid: str = claims.get("uid") or claims.get("sub") or ""
    if not firebase_uid:
        raise AuthenticationError("Invalid token: missing UID claim.")

    email: Optional[str] = claims.get("email")
    display_name: Optional[str] = claims.get("name")
    photo_url: Optional[str] = claims.get("picture")
    email_verified: bool = bool(claims.get("email_verified", False))

    now = datetime.now(timezone.utc)
    users_col = get_users_collection()

    existing = await users_col.find_one({"firebase_uid": firebase_uid})

    clean_display_name = (display_name or (email.split("@")[0] if email else f"User {firebase_uid[:6]}")).strip()[:50]

    if existing:
        username = existing.get("username")
        plexochat_id = existing.get("plexochat_id")
        lang = existing.get("preferred_receiving_language", "en")
        needs_update = False
        extra_set = {}

        if not username:
            base_un = _sanitize_username(email.split("@")[0] if email else "user")
            un = base_un
            counter = 1
            while await users_col.find_one({"username": un, "_id": {"$ne": existing["_id"]}}):
                suffix = str(counter)
                un = f"{base_un[:30 - len(suffix)]}{suffix}"
                counter += 1
            username = un
            extra_set["username"] = username
            needs_update = True

        if not plexochat_id:
            base_px = _sanitize_plexochat_id(username)
            px = base_px
            counter = 1
            while await users_col.find_one({"plexochat_id": px, "_id": {"$ne": existing["_id"]}}):
                suffix = str(counter)
                px = f"{base_px[:30 - len(suffix)]}{suffix}"
                counter += 1
            plexochat_id = px
            extra_set["plexochat_id"] = plexochat_id
            needs_update = True

        update_fields = {
            "email": email,
            "display_name": existing.get("display_name") or clean_display_name,
            "photo_url": photo_url or existing.get("photo_url"),
            "email_verified": email_verified,
            "preferred_receiving_language": lang,
            "updated_at": now,
            **extra_set,
        }

        result = await users_col.find_one_and_update(
            {"_id": existing["_id"]},
            {"$set": update_fields},
            return_document=ReturnDocument.AFTER,
        )
        is_new_user = False
        logger.info(f"Existing user synced: uid={firebase_uid} id={result['_id']}")
    else:
        # New user: generate initial username and plexochat_id
        base_un = _sanitize_username(email.split("@")[0] if email else f"user_{firebase_uid[:6]}")
        un = base_un
        counter = 1
        while await users_col.find_one({"username": un}):
            suffix = str(counter)
            un = f"{base_un[:30 - len(suffix)]}{suffix}"
            counter += 1
        username = un

        base_px = _sanitize_plexochat_id(username)
        px = base_px
        counter = 1
        while await users_col.find_one({"plexochat_id": px}):
            suffix = str(counter)
            px = f"{base_px[:30 - len(suffix)]}{suffix}"
            counter += 1
        plexochat_id = px

        new_doc = {
            "firebase_uid": firebase_uid,
            "email": email,
            "username": username,
            "plexochat_id": plexochat_id,
            "display_name": clean_display_name,
            "photo_url": photo_url,
            "email_verified": email_verified,
            "preferred_receiving_language": "en",
            "created_at": now,
            "updated_at": now,
        }
        insert_res = await users_col.insert_one(new_doc)
        new_doc["_id"] = insert_res.inserted_id
        result = new_doc
        is_new_user = True
        logger.info(f"New user created: uid={firebase_uid} id={result['_id']}")

    return result, is_new_user


@router.post(
    "/auth/sync",
    response_model=SyncResponse,
    summary="Sync Firebase user to MongoDB",
    description=(
        "Verifies a Firebase ID token and upserts the user into the MongoDB `users` collection. "
        "Called by the frontend after every successful Firebase login. "
        "Only safe profile fields are stored — no passwords, no tokens."
    ),
)
async def sync_firebase_user(
    authorization: Optional[str] = Header(None),
) -> SyncResponse:
    """Verifies the Firebase ID token and upserts the user document."""
    # ── 1. Parse Authorization header ────────────────────────────────────────
    if not authorization:
        raise AuthenticationError("Missing Authorization header.")

    parts = authorization.split()
    if len(parts) != 2 or parts[0].lower() != "bearer":
        raise AuthenticationError(
            "Invalid Authorization header format. Expected 'Bearer <token>'."
        )

    token = parts[1]

    # ── 2. Verify Firebase ID token ──────────────────────────────────────────
    claims = verify_firebase_id_token(token)

    # ── 3. Upsert into MongoDB ───────────────────────────────────────────────
    result, is_new_user = await sync_firebase_user_record(claims)

    return SyncResponse(
        user_id=str(result["_id"]),
        firebase_uid=result["firebase_uid"],
        username=result["username"],
        plexochat_id=result["plexochat_id"],
        email=result.get("email"),
        display_name=result.get("display_name"),
        photo_url=result.get("photo_url"),
        email_verified=result.get("email_verified", False),
        preferred_receiving_language=result.get("preferred_receiving_language", "en"),
        bio=result.get("bio"),
        spoken_languages=result.get("spoken_languages") or [],
        learning_languages=result.get("learning_languages") or [],
        interests=result.get("interests") or [],
        created_at=result["created_at"],
        updated_at=result["updated_at"],
        is_new_user=is_new_user,
    )
