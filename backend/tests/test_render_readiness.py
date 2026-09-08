"""Tests verifying Render deployment readiness."""

import pytest
from httpx import AsyncClient, ASGITransport
from app.core.config import Settings
from app.main import app, _cors_origin_regex
import re


def test_app_exposed_correctly():
    """Confirms app is exposed as FastAPI instance."""
    from app.main import app as main_app
    assert main_app.title == "PlexoChat API"


def test_cors_regex_matches_vercel():
    """Confirms production CORS regex matches any .vercel.app origin."""
    prod_pattern = re.compile(r"^https://.*\.vercel\.app$")
    assert prod_pattern.fullmatch("https://plexochat.vercel.app")
    assert prod_pattern.fullmatch("https://plexochat-git-main-arupdas0825.vercel.app")
    assert prod_pattern.fullmatch("https://my-app-123.vercel.app")
    assert not prod_pattern.fullmatch("http://malicious-site.com")
    assert not prod_pattern.fullmatch("https://vercel.app.malicious.com")


@pytest.mark.asyncio
async def test_health_check_endpoint():
    """Confirms /health endpoint works for Render health check path."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert "status" in data


def test_settings_env_overrides():
    """Confirms Settings can take environment overrides."""
    custom_settings = Settings(
        ENVIRONMENT="production",
        MONGODB_URI="mongodb+srv://user:pass@cluster.mongodb.net/?appName=test",
        MONGODB_DATABASE="TestDB",
        CORS_ORIGINS=["https://custom-domain.com"],
        CORS_ORIGIN_REGEX=r"^https://.*\.vercel\.app$",
        FIREBASE_PROJECT_ID="test-project",
    )
    assert custom_settings.ENVIRONMENT == "production"
    assert custom_settings.database_name == "TestDB"
    assert "https://custom-domain.com" in custom_settings.CORS_ORIGINS
    assert custom_settings.CORS_ORIGIN_REGEX == r"^https://.*\.vercel\.app$"
    assert custom_settings.FIREBASE_PROJECT_ID == "test-project"
