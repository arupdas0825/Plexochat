"""Connection and relationship models for PlexoChat."""

from datetime import datetime, timezone
from enum import Enum
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field


class ConnectionRequestStatus(str, Enum):
    PENDING = "PENDING"
    ACCEPTED = "ACCEPTED"
    DECLINED = "DECLINED"
    BLOCKED = "BLOCKED"
    CANCELLED = "CANCELLED"


class RelationshipStatus(str, Enum):
    NONE = "NONE"
    REQUEST_SENT = "REQUEST_SENT"
    REQUEST_RECEIVED = "REQUEST_RECEIVED"
    ACCEPTED = "ACCEPTED"
    BLOCKED = "BLOCKED"


class UserProfilePublic(BaseModel):
    """Publicly visible user profile including contextual relationship status."""
    model_config = ConfigDict(populate_by_name=True, extra="ignore")

    id: str
    username: str
    plexochat_id: str
    display_name: str
    photo_url: Optional[str] = None
    preferred_receiving_language: str = "en"
    relationship_status: RelationshipStatus = RelationshipStatus.NONE
    connection_request_id: Optional[str] = None


class ConnectionCreateRequest(BaseModel):
    """Payload to initiate a new connection request."""
    target_user_id: str = Field(..., description="MongoDB _id of target recipient")
    note: Optional[str] = Field(None, max_length=150, description="Optional brief greeting note")


class ConnectionRequestPublic(BaseModel):
    """Representation of an incoming or outgoing connection request."""
    model_config = ConfigDict(populate_by_name=True, extra="ignore")

    id: str
    sender_id: str
    receiver_id: str
    status: ConnectionRequestStatus
    created_at: datetime
    updated_at: datetime
    peer_profile: Optional[UserProfilePublic] = None


class ConnectionPublic(BaseModel):
    """Representation of an accepted connection."""
    model_config = ConfigDict(populate_by_name=True, extra="ignore")

    id: str
    peer_user_id: str
    peer_profile: UserProfilePublic
    status: str = "ACCEPTED"
    connected_at: datetime
