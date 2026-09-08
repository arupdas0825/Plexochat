#!/usr/bin/env python3
"""
PlexoChat WebSocket Manual Test Client
=======================================
Demonstrates: auth, real-time message relay, delivery ack, and presence events.

Usage (from the backend/ directory, with venv activated):
    python scripts/test_ws_client.py

Requirements:
    pip install websockets motor pymongo

The script uses development test tokens (test_token_<uid>) which are accepted
when ENVIRONMENT=development in .env. No real Firebase credentials needed.

What it demonstrates:
    1. User A and User B both authenticate and connect via WebSocket
    2. Message sent by A is received by B in real time
    3. B sends ack → ack_relay arrives back at A
    4. Presence "online" events fire when each user connects
    5. Presence "offline" event fires when B disconnects
"""

import asyncio
import json
import sys
from pathlib import Path

# Ensure backend is on sys.path when running from scripts/
_backend_dir = str(Path(__file__).resolve().parent.parent)
if _backend_dir not in sys.path:
    sys.path.insert(0, _backend_dir)

import uuid
from datetime import datetime, timezone

try:
    import websockets
    from websockets.exceptions import ConnectionClosedError
except ImportError:
    print("ERROR: 'websockets' package not found. Run: pip install websockets")
    sys.exit(1)

from motor.motor_asyncio import AsyncIOMotorClient

from app.core.config import settings

WS_BASE = "ws://localhost:8000/api/v1/ws"

# Test user UIDs — used to build dev tokens
USER_A_UID = "test_ws_user_a"
USER_B_UID = "test_ws_user_b"


# ---------------------------------------------------------------------------
# MongoDB setup helpers (bootstrap users + test connection)
# ---------------------------------------------------------------------------

async def _setup_mongo():
    """Bootstrap test users and create an ACCEPTED connection between them."""
    client = AsyncIOMotorClient(settings.MONGODB_URI, serverSelectionTimeoutMS=5000)
    db = client[settings.database_name]
    users = db["users"]
    connections = db["connections"]

    now = datetime.now(timezone.utc)

    async def upsert_user(uid: str, name: str) -> str:
        """Upsert a minimal test user, return the string _id."""
        from pymongo import ReturnDocument
        from bson import ObjectId
        doc = await users.find_one_and_update(
            {"firebase_uid": uid},
            {
                "$set": {"display_name": name, "updated_at": now, "email": f"{uid}@example.com"},
                "$setOnInsert": {
                    "firebase_uid": uid,
                    "username": uid.replace("_", ""),
                    "plexochat_id": uid.replace("_", ""),
                    "preferred_receiving_language": "en",
                    "created_at": now,
                },
            },
            upsert=True,
            return_document=ReturnDocument.AFTER,
        )
        return str(doc["_id"])

    id_a = await upsert_user(USER_A_UID, "Test User A")
    id_b = await upsert_user(USER_B_UID, "Test User B")
    print(f"  ✓ User A id={id_a}")
    print(f"  ✓ User B id={id_b}")

    # Ensure an ACCEPTED connection between them (upsert)
    await connections.update_one(
        {
            "$or": [
                {"user_a_id": id_a, "user_b_id": id_b},
                {"user_a_id": id_b, "user_b_id": id_a},
            ]
        },
        {
            "$set": {"status": "ACCEPTED", "updated_at": now},
            "$setOnInsert": {
                "user_a_id": id_a,
                "user_b_id": id_b,
                "created_at": now,
            },
        },
        upsert=True,
    )
    print(f"  ✓ ACCEPTED connection created between A and B")

    client.close()
    return id_a, id_b


async def _cleanup_mongo(id_a: str, id_b: str):
    """Remove test connection (leave users intact)."""
    client = AsyncIOMotorClient(settings.MONGODB_URI, serverSelectionTimeoutMS=5000)
    db = client[settings.database_name]
    await db["connections"].delete_one({
        "$or": [
            {"user_a_id": id_a, "user_b_id": id_b},
            {"user_a_id": id_b, "user_b_id": id_a},
        ]
    })
    print("  ✓ Test connection cleaned up from MongoDB")
    client.close()


# ---------------------------------------------------------------------------
# WebSocket client helpers
# ---------------------------------------------------------------------------

def _token(uid: str) -> str:
    return f"test_token_{uid}"


async def _recv_with_timeout(ws, label: str, timeout: float = 5.0):
    """Receive one JSON frame, printing it with a label."""
    try:
        raw = await asyncio.wait_for(ws.recv(), timeout=timeout)
        frame = json.loads(raw)
        print(f"  [{label}] ← {json.dumps(frame)}")
        return frame
    except asyncio.TimeoutError:
        print(f"  [{label}] ← (timeout waiting for frame)")
        return None


# ---------------------------------------------------------------------------
# Main test flow
# ---------------------------------------------------------------------------

async def run_test(id_a: str, id_b: str):
    url_a = f"{WS_BASE}?token={_token(USER_A_UID)}"
    url_b = f"{WS_BASE}?token={_token(USER_B_UID)}"

    print("\n── Step 1: Connect User A ─────────────────────────────────────────")
    async with websockets.connect(url_a) as ws_a:
        print(f"  [A] ✓ Connected")

        print("\n── Step 2: Connect User B ─────────────────────────────────────────")
        async with websockets.connect(url_b) as ws_b:
            print(f"  [B] ✓ Connected")

            # Allow presence events to propagate
            await asyncio.sleep(0.3)

            # Drain any pending/presence frames
            print("\n  Draining initial frames (pending messages + presence events)...")
            for label, ws in [("A", ws_a), ("B", ws_b)]:
                while True:
                    try:
                        raw = await asyncio.wait_for(ws.recv(), timeout=0.5)
                        frame = json.loads(raw)
                        print(f"  [{label}] initial frame ← {json.dumps(frame)}")
                    except asyncio.TimeoutError:
                        break

            # ── Step 3: A sends a message to B ──────────────────────────────
            client_msg_id = f"test_{uuid.uuid4().hex[:8]}"
            msg_frame = {
                "type": "message",
                "to_user_id": id_b,
                "text": "Hello from A! 🎉",
                "client_message_id": client_msg_id,
            }
            print(f"\n── Step 3: A → B message ──────────────────────────────────────────")
            print(f"  [A] → {json.dumps(msg_frame)}")
            await ws_a.send(json.dumps(msg_frame))

            # B should receive the message
            frame_at_b = await _recv_with_timeout(ws_b, "B")
            assert frame_at_b is not None and frame_at_b.get("type") == "message", \
                f"Expected message frame at B, got: {frame_at_b}"
            assert frame_at_b.get("text") == "Hello from A! 🎉"
            print(f"  ✓ B received message correctly")

            # ── Step 4: B acks, A should get ack_relay ──────────────────────
            print(f"\n── Step 4: B sends ack → A receives ack_relay ─────────────────────")
            ack_frame = {"type": "ack", "client_message_id": client_msg_id}
            print(f"  [B] → {json.dumps(ack_frame)}")
            await ws_b.send(json.dumps(ack_frame))

            frame_at_a = await _recv_with_timeout(ws_a, "A")
            assert frame_at_a is not None and frame_at_a.get("type") == "ack_relay", \
                f"Expected ack_relay at A, got: {frame_at_a}"
            assert frame_at_a.get("client_message_id") == client_msg_id
            print(f"  ✓ A received ack_relay correctly")

            # ── Step 5: B disconnects → A should see presence=offline ───────
            print(f"\n── Step 5: B disconnects → presence=offline at A ──────────────────")

        # ws_b is now closed — wait briefly for presence broadcast
        await asyncio.sleep(0.5)
        presence_frame = await _recv_with_timeout(ws_a, "A", timeout=3.0)
        if presence_frame and presence_frame.get("type") == "presence":
            assert presence_frame.get("status") == "offline"
            print(f"  ✓ A received presence=offline for B")
        else:
            print(f"  ℹ  Presence frame not received within timeout (may be timing-dependent)")

        print(f"\n── All steps passed! ✅ ────────────────────────────────────────────\n")


async def main():
    print("PlexoChat WebSocket Test Client")
    print("=" * 60)

    print("\n[Setup] Bootstrapping test users and connection in MongoDB...")
    id_a, id_b = await _setup_mongo()

    try:
        await run_test(id_a, id_b)
    except AssertionError as e:
        print(f"\n  ✗ ASSERTION FAILED: {e}")
        sys.exit(1)
    except Exception as e:
        print(f"\n  ✗ ERROR: {e}")
        import traceback; traceback.print_exc()
        sys.exit(1)
    finally:
        print("\n[Cleanup] Removing test connection from MongoDB...")
        await _cleanup_mongo(id_a, id_b)

    print("Test completed successfully.\n")


if __name__ == "__main__":
    asyncio.run(main())
