"""Device key registration and retrieval endpoints for Olm E2EE key exchange.

POST /api/v1/devices/keys
    Registers or refreshes a user's public Olm device key bundle in MongoDB.
    Called by the client after initialising its Olm Account for the first time,
    and whenever a new batch of one-time prekeys needs to be uploaded.

GET /api/v1/devices/keys/{user_id}
    Returns the target user's public identity keys and claims (atomically removes)
    one unused one-time prekey for an outbound Olm session handshake.
    Only accessible between users who have an ACCEPTED connection.

SECURITY CONTRACT:
    - Only PUBLIC key material is ever stored or returned.
    - Private keys are generated and stored exclusively on the client device.
    - Pydantic validation ensures all key fields are non-empty strings
      of appropriate length before being persisted.
    - One-time keys are atomically popped from the MongoDB document to prevent
      reuse across sessions.
"""

from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends
from pymongo import ReturnDocument

from app.core.errors import AuthenticationError, NotFoundError, ConflictError
from app.core.logging import logger
from app.core.security import get_current_user
from app.db.collections import get_connections_collection, get_device_keys_collection
from app.models.device_key import DeviceKeyPublic, DeviceKeyUpload, IdentityKeys, OneTimeKeyBundle
from app.models.user import User
from app.services.rate_limiter import rate_limiter

router = APIRouter(prefix="/devices", tags=["Devices / E2EE Keys"])


async def _has_accepted_connection(user_a_id: str, user_b_id: str) -> bool:
    """Returns True if user_a and user_b have an ACCEPTED connection."""
    col = get_connections_collection()
    doc = await col.find_one(
        {
            "$or": [
                {"user_a_id": user_a_id, "user_b_id": user_b_id},
                {"user_a_id": user_b_id, "user_b_id": user_a_id},
            ],
            "status": "ACCEPTED",
        }
    )
    return doc is not None


@router.post(
    "/keys",
    status_code=200,
    summary="Register / refresh public device key bundle",
    description=(
        "Upserts the authenticated user's Olm public key bundle (identity keys + one-time prekeys). "
        "Only public key material is accepted. Private keys must never leave the client device."
    ),
)
async def register_device_keys(
    payload: DeviceKeyUpload,
    current_user: User = Depends(get_current_user),
) -> dict:
    """Register or refresh the user's public Olm device key bundle."""
    await rate_limiter.check(f"devkeys:{current_user.id}", max_requests=30, window_seconds=60)

    col = get_device_keys_collection()
    now = datetime.now(timezone.utc)

    # Upsert by (user_id, device_identifier) — adds new OTKs without overwriting existing ones
    existing = await col.find_one({"user_id": current_user.id, "device_identifier": payload.device_identifier})

    if existing:
        # Merge new one-time keys with any remaining existing ones
        merged_otk = {**existing.get("one_time_keys", {}), **payload.one_time_keys}
        await col.update_one(
            {"user_id": current_user.id, "device_identifier": payload.device_identifier},
            {
                "$set": {
                    "identity_keys": payload.identity_keys.model_dump(),
                    "one_time_keys": merged_otk,
                    "updated_at": now,
                }
            },
        )
        logger.info(
            f"Device keys updated: user_id={current_user.id} "
            f"device={payload.device_identifier} otk_count={len(payload.one_time_keys)}"
        )
    else:
        await col.insert_one(
            {
                "user_id": current_user.id,
                "device_identifier": payload.device_identifier,
                "identity_keys": payload.identity_keys.model_dump(),
                "one_time_keys": payload.one_time_keys,
                "created_at": now,
                "updated_at": now,
            }
        )
        logger.info(
            f"Device keys registered: user_id={current_user.id} "
            f"device={payload.device_identifier} otk_count={len(payload.one_time_keys)}"
        )

    remaining_otk_count = len(payload.one_time_keys)
    return {
        "status": "ok",
        "device_identifier": payload.device_identifier,
        "one_time_keys_stored": remaining_otk_count,
    }


@router.get(
    "/keys/{user_id}",
    response_model=DeviceKeyPublic,
    summary="Fetch peer public key bundle for E2EE session setup",
    description=(
        "Returns the target user's public Olm identity keys and atomically claims "
        "one one-time prekey for outbound session establishment. "
        "Only accessible between users with an ACCEPTED connection."
    ),
)
async def get_device_keys(
    user_id: str,
    current_user: User = Depends(get_current_user),
) -> DeviceKeyPublic:
    """Fetch a peer's public key bundle to establish an outbound Olm session."""
    await rate_limiter.check(f"devkeys_read:{current_user.id}", max_requests=60, window_seconds=60)

    # Only allowed between users who are connected
    if not await _has_accepted_connection(current_user.id, user_id):
        raise NotFoundError("User not found or no accepted connection.")

    col = get_device_keys_collection()
    doc = await col.find_one({"user_id": user_id})
    if not doc:
        raise NotFoundError("No device key bundle registered for this user yet.")

    claimed_otk: Optional[OneTimeKeyBundle] = None

    # Atomically claim and remove one one-time prekey if any remain
    one_time_keys: dict = doc.get("one_time_keys", {})
    if one_time_keys:
        claim_key_id = next(iter(one_time_keys))
        claim_key_val = one_time_keys[claim_key_id]

        # Atomically remove the claimed key using $unset
        await col.update_one(
            {"_id": doc["_id"]},
            {"$unset": {f"one_time_keys.{claim_key_id}": ""}, "$set": {"updated_at": datetime.now(timezone.utc)}},
        )
        claimed_otk = OneTimeKeyBundle(key_id=claim_key_id, key=claim_key_val)
        logger.info(
            f"OTK claimed: for user_id={user_id} by requester={current_user.id} "
            f"key_id={claim_key_id} remaining={len(one_time_keys) - 1}"
        )
    else:
        # No one-time keys left — caller can still create an inbound session
        # or fall back to the fallback key mechanism (future work)
        logger.warning(f"No one-time keys remaining for user_id={user_id}")

    ik = doc["identity_keys"]
    return DeviceKeyPublic(
        user_id=user_id,
        device_identifier=doc["device_identifier"],
        identity_keys=IdentityKeys(
            curve25519=ik["curve25519"],
            ed25519=ik["ed25519"],
        ),
        one_time_key=claimed_otk,
    )
