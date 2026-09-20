"""Models for per-conversation settings and preferences."""

from datetime import datetime, timezone
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field, field_validator
from app.core.languages import validate_language_code


class ConversationPreferences(BaseModel):
    """User-specific settings for a 1:1 conversation with a peer."""
    model_config = ConfigDict(populate_by_name=True, extra="ignore")

    user_id: str = Field(..., description="ID of the user owning this preference")
    peer_id: str = Field(..., description="ID of the peer user in this conversation")
    muted: bool = Field(default=False, description="Whether notifications are muted")
    favorite: bool = Field(default=False, description="Whether this conversation is pinned/favorited")
    disappearing_ttl: Optional[int] = Field(
        default=None,
        description="Message expiration TTL in seconds (e.g. 86400, 604800, 7776000, or null)",
    )
    per_chat_language_override: Optional[str] = Field(
        default=None,
        description="Optional language code override for this chat",
    )
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    @field_validator("per_chat_language_override")
    @classmethod
    def validate_override(cls, v: Optional[str]) -> Optional[str]:
        return validate_language_code(v)


class ConversationPreferencesUpdate(BaseModel):
    """Payload to update per-conversation settings."""
    muted: Optional[bool] = None
    favorite: Optional[bool] = None
    disappearing_ttl: Optional[int] = None
    per_chat_language_override: Optional[str] = None

    @field_validator("per_chat_language_override")
    @classmethod
    def validate_override(cls, v: Optional[str]) -> Optional[str]:
        return validate_language_code(v)
