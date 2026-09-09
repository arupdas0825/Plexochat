"""Application configuration loaded via pydantic-settings from centralized .env."""

import json
from pathlib import Path
from typing import Any, List, Optional
from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

BACKEND_DIR = Path(__file__).resolve().parent.parent.parent
ROOT_DIR = BACKEND_DIR.parent


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=(
            str(ROOT_DIR / ".env"),
            str(BACKEND_DIR / ".env"),
            ".env",
        ),
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )

    # Server Configuration
    PORT: int = 8000
    HOST: str = "0.0.0.0"
    ENVIRONMENT: str = "development"
    CORS_ORIGINS: List[str] = Field(
        default=[
            "https://plexochat.vercel.app",
            "http://localhost:3000",
            "http://127.0.0.1:3000",
        ]
    )
    CORS_ORIGIN_REGEX: Optional[str] = None

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def parse_cors_origins(cls, v: Any) -> List[str]:
        if isinstance(v, str):
            clean_str = v.strip()
            if clean_str.startswith("[") and clean_str.endswith("]"):
                try:
                    return json.loads(clean_str)
                except Exception:
                    pass
            return [origin.strip() for origin in clean_str.split(",") if origin.strip()]
        elif isinstance(v, (list, set)):
            return list(v)
        return v

    # Firebase Authentication (Backend Admin SDK)
    FIREBASE_SERVICE_ACCOUNT_JSON: Optional[str] = None
    FIREBASE_SERVICE_ACCOUNT_PATH: Optional[str] = None
    FIREBASE_PROJECT_ID: Optional[str] = None

    # Google Cloud Translation API (server-side only — never exposed to frontend)
    GOOGLE_TRANSLATE_API_KEY: Optional[str] = None

    # MongoDB Atlas
    MONGODB_URI: str = "mongodb://localhost:27017"
    MONGODB_DATABASE: str = "PlexoChat"
    MONGODB_DB_NAME: Optional[str] = None

    @field_validator("MONGODB_URI", mode="before")
    @classmethod
    def clean_mongodb_uri(cls, v: Any) -> str:
        if isinstance(v, str):
            return v.strip().strip("'\"").strip()
        return v

    @property
    def database_name(self) -> str:
        return self.MONGODB_DB_NAME or self.MONGODB_DATABASE or "PlexoChat"


settings = Settings()
