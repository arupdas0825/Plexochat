import uuid
from bson import ObjectId
from datetime import datetime, timezone
import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.models.user import User
from app.core.security import get_current_user
from app.db.collections import get_users_collection, get_conversation_preferences_collection


@pytest.mark.asyncio
async def test_conversation_preferences_crud():
    """Test getting and updating conversation preferences."""
    test_uid = f"user_{uuid.uuid4().hex[:8]}"
    test_user_id = str(ObjectId())
    peer_id = str(ObjectId())

    user_obj = User(
        _id=test_user_id,
        firebase_uid=test_uid,
        username=test_uid,
        plexochat_id=test_uid,
        display_name="Test Conv User",
        email=f"{test_uid}@example.com",
        preferred_receiving_language="en",
    )
    app.dependency_overrides[get_current_user] = lambda: user_obj

    try:
        async with app.router.lifespan_context(app):
            transport = ASGITransport(app=app)
            async with AsyncClient(transport=transport, base_url="http://test") as ac:
                # 1. GET preferences before creating (should return defaults)
                res = await ac.get(f"/api/v1/conversations/{peer_id}/preferences")
                assert res.status_code == 200
                data = res.json()
                assert data["user_id"] == test_user_id
                assert data["peer_id"] == peer_id
                assert data["muted"] is False
                assert data["favorite"] is False
                assert data["disappearing_ttl"] is None

                # 2. PATCH preferences (mute and set TTL to 24h)
                patch_res = await ac.patch(
                    f"/api/v1/conversations/{peer_id}/preferences",
                    json={"muted": True, "favorite": True, "disappearing_ttl": 86400},
                )
                assert patch_res.status_code == 200
                patched = patch_res.json()
                assert patched["muted"] is True
                assert patched["favorite"] is True
                assert patched["disappearing_ttl"] == 86400

                # 3. GET preferences again (should return updated)
                get_res = await ac.get(f"/api/v1/conversations/{peer_id}/preferences")
                assert get_res.status_code == 200
                updated = get_res.json()
                assert updated["muted"] is True
                assert updated["favorite"] is True
                assert updated["disappearing_ttl"] == 86400

                # 4. PATCH disable TTL (null)
                patch_off = await ac.patch(
                    f"/api/v1/conversations/{peer_id}/preferences",
                    json={"disappearing_ttl": None, "muted": False},
                )
                assert patch_off.status_code == 200
                assert patch_off.json()["disappearing_ttl"] is None
                assert patch_off.json()["muted"] is False

            conv_col = get_conversation_preferences_collection()
            await conv_col.delete_one({"user_id": test_user_id, "peer_id": peer_id})
    finally:
        app.dependency_overrides.pop(get_current_user, None)



@pytest.mark.asyncio
async def test_user_profile_with_extended_fields():
    """Test updating and fetching user profile with bio, languages, interests."""
    test_uid = f"user_{uuid.uuid4().hex[:8]}"
    oid = ObjectId()
    test_user_id = str(oid)

    user_obj = User(
        _id=test_user_id,
        firebase_uid=test_uid,
        username=test_uid,
        plexochat_id=test_uid,
        display_name="Test Extended User",
        email=f"{test_uid}@example.com",
        preferred_receiving_language="en",
    )
    app.dependency_overrides[get_current_user] = lambda: user_obj

    try:
        async with app.router.lifespan_context(app):
            users_col = get_users_collection()
            now = datetime.now(timezone.utc)
            await users_col.insert_one({
                "_id": oid,
                "firebase_uid": test_uid,
                "username": test_uid,
                "plexochat_id": test_uid,
                "display_name": "Test Extended User",
                "email": f"{test_uid}@example.com",
                "preferred_receiving_language": "en",
                "created_at": now,
                "updated_at": now,
            })

            transport = ASGITransport(app=app)
            async with AsyncClient(transport=transport, base_url="http://test") as ac:
                # 1. Update own profile with new fields
                patch_res = await ac.patch(
                    "/api/v1/users/me",
                    json={
                        "bio": "Building real-time cross-language messaging.",
                        "spoken_languages": ["English", "Bengali"],
                        "learning_languages": ["Spanish", "Japanese"],
                        "interests": ["AI", "Cryptography", "Travel"],
                    },
                )
                assert patch_res.status_code == 200
                res_data = patch_res.json()
                assert res_data["bio"] == "Building real-time cross-language messaging."
                assert "Bengali" in res_data["spoken_languages"]
                assert "Japanese" in res_data["learning_languages"]
                assert "Cryptography" in res_data["interests"]

                # 2. Fetch user profile
                get_res = await ac.get(f"/api/v1/users/{test_user_id}/profile")
                assert get_res.status_code == 200
                prof = get_res.json()
                assert prof["bio"] == "Building real-time cross-language messaging."
                assert "Bengali" in prof["spoken_languages"]
                assert "Japanese" in prof["learning_languages"]
                assert "Cryptography" in prof["interests"]

            await users_col.delete_one({"_id": oid})
    finally:
        app.dependency_overrides.pop(get_current_user, None)


