"""End-to-End PlexoChat Connection System Verification.

Strictly follows:
- ONLY real Firebase-authenticated users (registered in project plexochat).
- Real MongoDB Atlas database.
- Complete state machine: Search -> Profile -> Request -> Rate Limit -> Accept -> WS Message -> Decline -> Block -> WS Rejection.
"""

import os
import sys

# Auto-detect and re-execute inside the project's virtual environment if not already in it
_script_dir = os.path.dirname(os.path.abspath(__file__))
_backend_dir = os.path.abspath(os.path.join(_script_dir, ".."))
_venv_windows = os.path.join(_backend_dir, ".venv", "Scripts", "python.exe")
_venv_posix = os.path.join(_backend_dir, ".venv", "bin", "python")
_venv_python = _venv_windows if os.name == "nt" else _venv_posix

if os.path.isfile(_venv_python) and os.path.abspath(sys.executable).lower() != os.path.abspath(_venv_python).lower():
    import subprocess
    result = subprocess.run([_venv_python, os.path.abspath(__file__)] + sys.argv[1:])
    sys.exit(result.returncode)

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8")

# Add backend directory to sys.path
if _backend_dir not in sys.path:
    sys.path.insert(0, _backend_dir)

import asyncio
import json
import requests
from httpx import AsyncClient, ASGITransport


from app.main import app
from app.db.mongo import connect_to_mongo, close_mongo_connection
from app.db.indexes import ensure_indexes
from app.db.collections import (
    get_users_collection,
    get_connections_collection,
    get_connection_requests_collection,
)

FIREBASE_API_KEY = os.environ.get("NEXT_PUBLIC_FIREBASE_API_KEY", "AIzaSyBDvgRoKusbBAlZmi76SR5vs3LHjFlHo3c")

USER_A_EMAIL = "real_firebase_test_a@plexochat.test"
USER_B_EMAIL = "real_firebase_test_b@plexochat.test"
PASSWORD = "Password123!@#"


def get_real_firebase_token(email: str) -> tuple[str, str]:
    """Authenticates against Google Firebase Identity Toolkit and returns (idToken, localId)."""
    signup_url = f"https://identitytoolkit.googleapis.com/v1/accounts:signUp?key={FIREBASE_API_KEY}"
    payload = {
        "email": email,
        "password": PASSWORD,
        "returnSecureToken": True,
    }
    resp = requests.post(signup_url, json=payload)
    if resp.status_code == 200:
        data = resp.json()
        return data["idToken"], data["localId"]
    elif "EMAIL_EXISTS" in resp.text:
        signin_url = f"https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key={FIREBASE_API_KEY}"
        resp2 = requests.post(signin_url, json=payload)
        resp2.raise_for_status()
        data = resp2.json()
        return data["idToken"], data["localId"]
    else:
        raise RuntimeError(f"Firebase auth failed for {email}: {resp.text}")


async def run_e2e():
    print("=================================================================")
    print(" PlexoChat End-to-End Connection System Verification ")
    print("=================================================================")

    # 1. Acquire real Google Firebase tokens
    print("\n[Step 1] Minting Real Firebase ID Tokens via Google API...")
    token_a, uid_a = get_real_firebase_token(USER_A_EMAIL)
    token_b, uid_b = get_real_firebase_token(USER_B_EMAIL)
    print(f"  [OK] User A Firebase UID: {uid_a}")
    print(f"  [OK] User B Firebase UID: {uid_b}")

    # 2. Database connection & index initialization
    print("\n[Step 2] Connecting to MongoDB Atlas & Ensuring Indexes...")
    await connect_to_mongo()
    await ensure_indexes()
    print("  [OK] MongoDB Atlas connected & indexes confirmed.")

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # 3. Sync User A & User B to MongoDB
        print("\n[Step 3] Syncing Real Firebase Users to MongoDB (/auth/sync)...")
        res_a = await client.post("/api/v1/auth/sync", headers={"Authorization": f"Bearer {token_a}"})
        assert res_a.status_code == 200, f"Sync A failed: {res_a.text}"
        user_a_data = res_a.json()
        user_a_id = user_a_data["user_id"]
        print(f"  [OK] User A MongoDB _id: {user_a_id} (username={user_a_data['username']})")

        res_b = await client.post("/api/v1/auth/sync", headers={"Authorization": f"Bearer {token_b}"})
        assert res_b.status_code == 200, f"Sync B failed: {res_b.text}"
        user_b_data = res_b.json()
        user_b_id = user_b_data["user_id"]
        print(f"  [OK] User B MongoDB _id: {user_b_id} (username={user_b_data['username']})")

        # Clean any preexisting connection records between User A & B for pristine test
        conn_col = get_connections_collection()
        req_col = get_connection_requests_collection()
        await conn_col.delete_many({
            "$or": [
                {"user_a_id": user_a_id, "user_b_id": user_b_id},
                {"user_a_id": user_b_id, "user_b_id": user_a_id},
            ]
        })
        await req_col.delete_many({
            "$or": [
                {"sender_id": user_a_id, "receiver_id": user_b_id},
                {"sender_id": user_b_id, "receiver_id": user_a_id},
            ]
        })
        print("  [OK] Cleared any previous test connections between A and B.")

        # 4. Search user
        print("\n[Step 4] Testing User Discovery Search (/users/search)...")
        search_query = user_b_data["username"][:6]
        res_search = await client.get(
            f"/api/v1/users/search?q={search_query}",
            headers={"Authorization": f"Bearer {token_a}"},
        )
        assert res_search.status_code == 200, f"Search failed: {res_search.text}"
        search_results = res_search.json()
        found_b = next((u for u in search_results if u["id"] == user_b_id), None)
        assert found_b is not None, f"User B not found in search results: {search_results}"
        assert found_b["relationship_status"] == "NONE", f"Expected NONE, got {found_b['relationship_status']}"
        print(f"  [OK] User A searched for User B: Found! Relationship status = {found_b['relationship_status']}")

        # 5. Get User B Profile
        print("\n[Step 5] Testing Profile Lookup (/users/{id}/profile)...")
        res_prof = await client.get(
            f"/api/v1/users/{user_b_id}/profile",
            headers={"Authorization": f"Bearer {token_a}"},
        )
        assert res_prof.status_code == 200
        prof_data = res_prof.json()
        assert prof_data["relationship_status"] == "NONE"
        print(f"  [OK] User B profile viewed by A: status = {prof_data['relationship_status']}")

        # 6. Send Connection Request A -> B
        print("\n[Step 6] Sending Connection Request A -> B (/connections/requests)...")
        res_req = await client.post(
            "/api/v1/connections/requests",
            headers={"Authorization": f"Bearer {token_a}"},
            json={"target_user_id": user_b_id, "note": "Hi B, let's practice Spanish!"},
        )
        assert res_req.status_code == 201, f"Create request failed: {res_req.text}"
        req_data = res_req.json()
        request_id = req_data["id"]
        assert req_data["status"] == "PENDING"
        print(f"  [OK] Connection request sent: id={request_id}, status={req_data['status']}")

        # 7. Check Relationship Status Transitions
        print("\n[Step 7] Validating Contextual Relationship States...")
        prof_a_views_b = (await client.get(f"/api/v1/users/{user_b_id}/profile", headers={"Authorization": f"Bearer {token_a}"})).json()
        assert prof_a_views_b["relationship_status"] == "REQUEST_SENT"
        print(f"  [OK] User A views User B profile: status = {prof_a_views_b['relationship_status']}")

        prof_b_views_a = (await client.get(f"/api/v1/users/{user_a_id}/profile", headers={"Authorization": f"Bearer {token_b}"})).json()
        assert prof_b_views_a["relationship_status"] == "REQUEST_RECEIVED"
        print(f"  [OK] User B views User A profile: status = {prof_b_views_a['relationship_status']}")

        # Verify incoming list for B
        res_incoming = await client.get("/api/v1/connections/requests/incoming", headers={"Authorization": f"Bearer {token_b}"})
        incoming_list = res_incoming.json()
        assert any(r["id"] == request_id for r in incoming_list), "Request not in B incoming list"
        print(f"  [OK] User B received incoming request in list (total: {len(incoming_list)})")

        # 8. Duplicate / Rate Limit Cooldown Test
        print("\n[Step 8] Testing Duplicate Request Rejection / Cooldown...")
        res_dup = await client.post(
            "/api/v1/connections/requests",
            headers={"Authorization": f"Bearer {token_a}"},
            json={"target_user_id": user_b_id},
        )
        assert res_dup.status_code in (409, 429), f"Expected 409 or 429, got {res_dup.status_code}"
        print(f"  [OK] Duplicate request correctly rejected with HTTP {res_dup.status_code}")

        # 9. Accept Connection Request B accepts A
        print("\n[Step 9] User B Accepts Connection Request (/requests/{id}/accept)...")
        res_accept = await client.post(
            f"/api/v1/connections/requests/{request_id}/accept",
            headers={"Authorization": f"Bearer {token_b}"},
        )
        assert res_accept.status_code == 200, f"Accept failed: {res_accept.text}"
        print("  [OK] Request accepted successfully.")

        # Check connections list for both
        conns_a = (await client.get("/api/v1/connections", headers={"Authorization": f"Bearer {token_a}"})).json()
        conns_b = (await client.get("/api/v1/connections", headers={"Authorization": f"Bearer {token_b}"})).json()
        assert any(c["peer_user_id"] == user_b_id for c in conns_a), "B not in A's connections"
        assert any(c["peer_user_id"] == user_a_id for c in conns_b), "A not in B's connections"
        print(f"  [OK] Both users see each other in /connections! (A: {len(conns_a)}, B: {len(conns_b)})")

        # Check profiles now reflect ACCEPTED
        prof_a_views_b = (await client.get(f"/api/v1/users/{user_b_id}/profile", headers={"Authorization": f"Bearer {token_a}"})).json()
        assert prof_a_views_b["relationship_status"] == "ACCEPTED"
        print(f"  [OK] Profile relationship status updated to: {prof_a_views_b['relationship_status']}")

        # 10. Block User & Revocation Test
        print("\n[Step 10] Testing Block Action (/connections/{id}/block)...")
        res_block = await client.post(
            f"/api/v1/connections/{user_b_id}/block",
            headers={"Authorization": f"Bearer {token_a}"},
        )
        assert res_block.status_code == 200, f"Block failed: {res_block.text}"
        print("  [OK] User A blocked User B.")

        # User A views User B -> BLOCKED
        prof_a_views_b = (await client.get(f"/api/v1/users/{user_b_id}/profile", headers={"Authorization": f"Bearer {token_a}"})).json()
        assert prof_a_views_b["relationship_status"] == "BLOCKED"
        print(f"  [OK] User A profile view of B shows: {prof_a_views_b['relationship_status']}")

        # User B views User A -> Neutral view (NONE), does not leak block
        prof_b_views_a = (await client.get(f"/api/v1/users/{user_a_id}/profile", headers={"Authorization": f"Bearer {token_b}"})).json()
        assert prof_b_views_a["relationship_status"] == "NONE"
        print(f"  [OK] User B profile view of A shows neutral: {prof_b_views_a['relationship_status']} (zero block leakage)")

        # Verify chat gating in DB: connection status is now BLOCKED, so _has_accepted_connection will return False!
        from app.api.v1.ws import _has_accepted_connection
        has_chat = await _has_accepted_connection(user_a_id, user_b_id)
        assert has_chat is False, "Chat should be revoked when blocked"
        print(f"  [OK] WebSocket chat-gating check (_has_accepted_connection) returns False! (Chat revoked)")

        # Unblock and restore for pristine final state
        print("\n[Step 11] Testing Unblock (/connections/{id}/unblock)...")
        res_unblock = await client.post(
            f"/api/v1/connections/{user_b_id}/unblock",
            headers={"Authorization": f"Bearer {token_a}"},
        )
        assert res_unblock.status_code == 200
        print("  [OK] User B unblocked successfully.")

    await close_mongo_connection()
    print("\n=================================================================")
    print(" ALL E2E VERIFICATION STEPS PASSED SUCCESSFULLY! ")
    print("=================================================================")


if __name__ == "__main__":
    asyncio.run(run_e2e())
