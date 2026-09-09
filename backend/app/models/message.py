"""Pydantic models for WebSocket frame validation and serialisation.

Wire format is JSON. All frames have a `type` discriminator field.
Clients send:  "message" | "ack" | "ping"
Server sends:  "message" | "ack_relay" | "presence" | "error" | "delivered" | "pong" | "queued"

E2EE NOTE:
    Since Phase 5 (E2EE implementation), the `text` field in message frames carries
    an opaque Olm ciphertext blob (base64-encoded). The backend relay NEVER decrypts
    or inspects message content — it only routes based on `to_user_id`/`from_user_id`
    and `client_message_id`.

    Wire envelope fields:
      - ciphertext:    base64-encoded Olm ciphertext string
      - message_type:  0 = Olm PRE_KEY message (first message to a new session)
                       1 = Olm MESSAGE (ongoing double-ratchet message)

    The backend is intentionally unaware of the plaintext, translated text, or
    language metadata — all of that is inside the encrypted payload and decrypted
    client-side only.
"""

from typing import Literal, Optional
from pydantic import BaseModel, Field, field_validator, model_validator


# ---------------------------------------------------------------------------
# Incoming frames (client → server)
# ---------------------------------------------------------------------------


class IncomingMessageFrame(BaseModel):
    """A chat message sent by the authenticated user to another user.

    E2EE: `ciphertext` is an opaque Olm-encrypted blob. `message_type` indicates
    whether this is a PRE_KEY (0) or ongoing MESSAGE (1) Olm message.
    The backend relays both fields without decryption.
    `text` is supported as an alias for backward compatibility.
    """

    type: Literal["message"]
    to_user_id: str = Field(..., min_length=1, max_length=128)
    ciphertext: Optional[str] = Field(default=None, max_length=65536)
    text: Optional[str] = Field(default=None, max_length=65536)
    # 0 = Olm PRE_KEY, 1 = Olm MESSAGE (regular ratchet)
    message_type: int = Field(default=0, ge=0, le=1)
    client_message_id: str = Field(..., min_length=1, max_length=128)

    @field_validator("to_user_id", "client_message_id")
    @classmethod
    def no_whitespace_only(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Field must not be blank.")
        return v.strip()

    @model_validator(mode="after")
    def sync_ciphertext_and_text(self) -> "IncomingMessageFrame":
        if not self.ciphertext and not self.text:
            raise ValueError("Either ciphertext or text must be provided.")
        if not self.ciphertext and self.text:
            self.ciphertext = self.text
        elif not self.text and self.ciphertext:
            self.text = self.ciphertext
        return self


class IncomingAckFrame(BaseModel):
    """Delivery acknowledgement sent by the recipient back to the server."""

    type: Literal["ack"]
    client_message_id: str = Field(..., min_length=1, max_length=128)


# ---------------------------------------------------------------------------
# Outgoing frames (server → client)
# ---------------------------------------------------------------------------


class OutgoingMessageFrame(BaseModel):
    """Message relayed from sender to recipient.

    E2EE: contains opaque `ciphertext` and `message_type` — no plaintext ever.
    `text` is also populated with the ciphertext for backward-compatibility.
    """

    type: Literal["message"] = "message"
    from_user_id: str
    ciphertext: Optional[str] = None
    text: Optional[str] = None
    message_type: int = 0
    client_message_id: str

    @model_validator(mode="after")
    def sync_outgoing(self) -> "OutgoingMessageFrame":
        if self.ciphertext and not self.text:
            self.text = self.ciphertext
        elif self.text and not self.ciphertext:
            self.ciphertext = self.text
        return self


class OutgoingAckRelayFrame(BaseModel):
    """Delivery ack relayed back to the original sender so the UI can show 'delivered'."""

    type: Literal["ack_relay"] = "ack_relay"
    client_message_id: str


class PresenceFrame(BaseModel):
    """Broadcast when a user goes online or offline."""

    type: Literal["presence"] = "presence"
    user_id: str
    status: Literal["online", "offline"]


class DeliveredOfflineFrame(BaseModel):
    """Sent to recipient when a pending (offline-queued) message is flushed on reconnect."""

    type: Literal["delivered"] = "delivered"
    client_message_id: str


class ErrorFrame(BaseModel):
    """Structured error sent in response to a bad frame — does NOT close the connection."""

    type: Literal["error"] = "error"
    code: str
    message: str
    client_message_id: Optional[str] = None
