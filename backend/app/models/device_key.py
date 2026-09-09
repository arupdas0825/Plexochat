"""Pydantic models for device public key registration and retrieval (E2EE / Olm).

CRITICAL SECURITY RULES:
- Only PUBLIC key material ever passes through this module.
- Private keys are generated and stored exclusively on the client device (IndexedDB).
- The backend never generates, sees, stores, or logs any private key.
"""

from datetime import datetime
from typing import Dict, Optional
from pydantic import BaseModel, Field, field_validator


# ── Incoming / registration models ─────────────────────────────────────────────

class IdentityKeys(BaseModel):
    """Olm Account identity_keys() parsed result — public keys only."""
    curve25519: str = Field(..., min_length=40, max_length=64)
    ed25519: str = Field(..., min_length=40, max_length=64)


class DeviceKeyUpload(BaseModel):
    """
    Payload sent by the client when registering or refreshing its public key bundle.

    - identity_keys: Curve25519 + Ed25519 public keys from Olm Account.identity_keys().
    - one_time_keys: Map of key_id → Curve25519 one-time prekey value from
      Olm Account.one_time_keys(). These are consumed one-per-session-handshake.
    - device_identifier: Stable client-side device/session fingerprint (e.g. UUID4 in
      IndexedDB). Allows multiple devices per user.
    """
    device_identifier: str = Field(..., min_length=8, max_length=128)
    identity_keys: IdentityKeys
    one_time_keys: Dict[str, str] = Field(default_factory=dict)

    @field_validator("one_time_keys")
    @classmethod
    def limit_otk_count(cls, v: Dict[str, str]) -> Dict[str, str]:
        """Cap one-time-key upload batch to 100."""
        if len(v) > 100:
            raise ValueError("Cannot upload more than 100 one-time keys at once.")
        return v


class OneTimeKeyBundle(BaseModel):
    """A single claimed one-time prekey returned when establishing a session."""
    key_id: str
    key: str


class DeviceKeyPublic(BaseModel):
    """
    Public key bundle returned to clients performing a session handshake with a peer.
    Contains the peer's identity keys and one claimed (now consumed) one-time prekey.
    """
    user_id: str
    device_identifier: str
    identity_keys: IdentityKeys
    one_time_key: Optional[OneTimeKeyBundle] = None  # None if all OTKs exhausted


# ── Internal DB document model ─────────────────────────────────────────────────

class DeviceKeyDocument(BaseModel):
    """
    Shape of a document stored in the `device_keys` MongoDB collection.
    Only public key material — no private keys ever stored.
    """
    user_id: str
    device_identifier: str
    identity_keys: IdentityKeys
    one_time_keys: Dict[str, str]  # key_id → curve25519 value; consumed on claim
    created_at: datetime
    updated_at: datetime
