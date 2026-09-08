"""Pydantic models for WebSocket frame validation and serialisation.

Wire format is JSON. All frames have a `type` discriminator field.
Clients send: "message" | "ack"
Server sends: "message" | "ack_relay" | "presence" | "error" | "delivered"
"""

from typing import Literal, Optional
from pydantic import BaseModel, Field, field_validator


# ---------------------------------------------------------------------------
# Incoming frames (client → server)
# ---------------------------------------------------------------------------


class IncomingMessageFrame(BaseModel):
    """A chat message sent by the authenticated user to another user."""

    type: Literal["message"]
    to_user_id: str = Field(..., min_length=1, max_length=128)
    text: str = Field(..., min_length=1, max_length=4000)
    client_message_id: str = Field(..., min_length=1, max_length=128)

    @field_validator("to_user_id", "client_message_id")
    @classmethod
    def no_whitespace_only(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Field must not be blank.")
        return v.strip()


class IncomingAckFrame(BaseModel):
    """Delivery acknowledgement sent by the recipient back to the server."""

    type: Literal["ack"]
    client_message_id: str = Field(..., min_length=1, max_length=128)


# ---------------------------------------------------------------------------
# Outgoing frames (server → client)
# ---------------------------------------------------------------------------


class OutgoingMessageFrame(BaseModel):
    """Message relayed from sender to recipient."""

    type: Literal["message"] = "message"
    from_user_id: str
    text: str
    client_message_id: str


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
