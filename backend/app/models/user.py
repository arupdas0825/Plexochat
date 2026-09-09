"""User models and Pydantic validation schemas."""

from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field, field_validator

# Validated language codes — must match frontend SUPPORTED_LANGUAGES list.
# Any value outside this set is rejected by the API.
SUPPORTED_LANGUAGE_CODES = {"en", "bn", "de", "es", "fr", "ja", "ar"}


def _validate_language_code(v: Optional[str]) -> Optional[str]:
    """Shared validator for preferred_receiving_language fields."""
    if v is None:
        return v
    v = v.strip().lower()
    if v not in SUPPORTED_LANGUAGE_CODES:
        raise ValueError(
            f"Unsupported language code '{v}'. "
            f"Must be one of: {', '.join(sorted(SUPPORTED_LANGUAGE_CODES))}"
        )
    return v


class UserBase(BaseModel):
    username: str = Field(..., min_length=3, max_length=30, pattern=r"^[a-z0-9_]{3,30}$")
    plexochat_id: str = Field(..., min_length=3, max_length=30, pattern=r"^[a-zA-Z0-9_.-]{3,30}$")
    display_name: str = Field(..., min_length=1, max_length=50)
    preferred_receiving_language: str = Field(default="en", min_length=2, max_length=10)

    @field_validator("username")
    @classmethod
    def normalize_username(cls, v: str) -> str:
        return v.strip().lower()

    @field_validator("display_name")
    @classmethod
    def clean_display_name(cls, v: str) -> str:
        return v.strip()

    @field_validator("preferred_receiving_language")
    @classmethod
    def validate_language(cls, v: str) -> str:
        result = _validate_language_code(v)
        return result if result is not None else "en"


class UserBootstrap(BaseModel):
    """Payload sent by client immediately after first Firebase sign-up/login."""
    username: str = Field(..., min_length=3, max_length=30, pattern=r"^[a-z0-9_]{3,30}$")
    plexochat_id: Optional[str] = Field(None, min_length=3, max_length=30, pattern=r"^[a-zA-Z0-9_.-]{3,30}$")
    display_name: str = Field(..., min_length=1, max_length=50)
    preferred_receiving_language: str = Field(default="en", min_length=2, max_length=10)

    @field_validator("username")
    @classmethod
    def normalize_username(cls, v: str) -> str:
        return v.strip().lower()

    @field_validator("preferred_receiving_language")
    @classmethod
    def validate_language(cls, v: str) -> str:
        result = _validate_language_code(v)
        return result if result is not None else "en"


class UserUpdate(BaseModel):
    """Payload for updating user profile fields."""
    display_name: Optional[str] = Field(None, min_length=1, max_length=50)
    preferred_receiving_language: Optional[str] = Field(None, min_length=2, max_length=10)

    @field_validator("display_name")
    @classmethod
    def clean_display_name(cls, v: Optional[str]) -> Optional[str]:
        return v.strip() if v else None

    @field_validator("preferred_receiving_language")
    @classmethod
    def validate_language(cls, v: Optional[str]) -> Optional[str]:
        return _validate_language_code(v)


class UserPublic(BaseModel):
    """Search-safe user representation exposed in discovery endpoints."""
    id: str
    username: str
    plexochat_id: str
    display_name: str
    preferred_receiving_language: str


class User(UserBase):
    """Internal user model corresponding to MongoDB `users` collection."""
    model_config = ConfigDict(populate_by_name=True, extra="ignore")

    id: str = Field(default="", alias="_id")
    firebase_uid: str
    email: Optional[str] = None
    photo_url: Optional[str] = None
    profile_photo_reference: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    def to_public(self) -> UserPublic:
        return UserPublic(
            id=str(self.id),
            username=self.username,
            plexochat_id=self.plexochat_id,
            display_name=self.display_name,
            preferred_receiving_language=self.preferred_receiving_language,
        )
