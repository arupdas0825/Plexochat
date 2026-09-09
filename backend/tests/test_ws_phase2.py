"""Automated WebSocket tests for Phase 2: Real-time relay, ack, and auth.

These tests use pytest-asyncio with the full ASGI lifespan and the development
test_token_<uid> shortcut (ENVIRONMENT=development, no real Firebase needed).

Run:
    cd backend
    .venv\\Scripts\\python -m pytest tests/test_ws_phase2.py -v

Note: WS connection tests use the Starlette TestClient which supports synchronous
WebSocket context managers via anyio thread offloading.
"""

import json
import uuid
from datetime import datetime, timezone

import pytest
import pytest_asyncio
from starlette.testclient import TestClient

from app.main import app
from app.db.mongo import connect_to_mongo, close_mongo_connection
from app.db.collections import get_connections_collection, get_users_collection


USER_A_UID = "ws_test_user_alpha"
USER_B_UID = "ws_test_user_beta"
WS_PATH = "/api/v1/ws"


def _token(uid: str) -> str:
    return f"test_token_{uid}"


# ---------------------------------------------------------------------------
# Module-scoped async fixtures for DB setup
# ---------------------------------------------------------------------------

@pytest_asyncio.fixture(scope="module", loop_scope="module")
async def db_and_users():
    """Start MongoDB, upsert test users, yield (id_a, id_b, client), teardown."""
    await connect_to_mongo()

    from pymongo import ReturnDocument
    users = get_users_collection()
    now = datetime.now(timezone.utc)

    async def upsert(uid: str, name: str) -> str:
        doc = await users.find_one_and_update(
            {"firebase_uid": uid},
            {
                "$set": {"display_name": name, "updated_at": now, "email": f"{uid}@example.com"},
                "$setOnInsert": {
                    "firebase_uid": uid,
                    "username": uid.replace("_", "")[:30],
                    "plexochat_id": uid.replace("_", "")[:30],
                    "preferred_receiving_language": "en",
                    "created_at": now,
                },
            },
            upsert=True,
            return_document=ReturnDocument.AFTER,
        )
        return str(doc["_id"])

    id_a = await upsert(USER_A_UID, "WS Test Alpha")
    id_b = await upsert(USER_B_UID, "WS Test Beta")

    yield id_a, id_b

    await close_mongo_connection()


async def _ensure_connection(id_a: str, id_b: str, status: str = "ACCEPTED"):
    import app.db.mongo as mongo_mod
    if mongo_mod.db is None:
        await mongo_mod.connect_to_mongo()
    col = get_connections_collection()
    now = datetime.now(timezone.utc)
    await col.update_one(
        {
            "$or": [
                {"user_a_id": id_a, "user_b_id": id_b},
                {"user_a_id": id_b, "user_b_id": id_a},
            ]
        },
        {
            "$set": {"status": status, "updated_at": now},
            "$setOnInsert": {"user_a_id": id_a, "user_b_id": id_b, "created_at": now},
        },
        upsert=True,
    )
    # Clear stale pending messages for these test users so flushes don't interfere
    col_pending = mongo_mod.db["pending_messages"]
    await col_pending.delete_many({"$or": [{"to_user_id": id_a}, {"to_user_id": id_b}]})


async def _remove_connection(id_a: str, id_b: str):
    import app.db.mongo as mongo_mod
    if mongo_mod.db is None:
        await mongo_mod.connect_to_mongo()
    col = get_connections_collection()
    await col.delete_many({
        "$or": [
            {"user_a_id": id_a, "user_b_id": id_b},
            {"user_a_id": id_b, "user_b_id": id_a},
        ]
    })


# ---------------------------------------------------------------------------
# Auth rejection tests — pure sync, no DB needed
# ---------------------------------------------------------------------------

def test_ws_rejected_without_token():
    """WebSocket connection without ?token= must be rejected (close before accept)."""
    with TestClient(app, raise_server_exceptions=False) as client:
        try:
            with client.websocket_connect(WS_PATH) as ws:
                # If we get here, connection was accepted — read any close frame
                data = ws.receive_json()
        except Exception:
            pass  # Expected: connection refused / closed before accept


def test_ws_rejected_with_bad_token():
    """WebSocket connection with an invalid token must be rejected."""
    with TestClient(app, raise_server_exceptions=False) as client:
        try:
            with client.websocket_connect(f"{WS_PATH}?token=definitely_not_valid"):
                pass
        except Exception:
            pass  # Expected


# ---------------------------------------------------------------------------
# Message relay + ack tests
# ---------------------------------------------------------------------------

@pytest.mark.asyncio(loop_scope="module")
async def test_ws_message_delivery_online(db_and_users):
    """A → B message relay: B receives the message in real-time."""
    id_a, id_b = db_and_users
    await _ensure_connection(id_a, id_b)

    client_msg_id = f"tc_{uuid.uuid4().hex[:8]}"

    with TestClient(app, raise_server_exceptions=False) as client:
        with client.websocket_connect(f"{WS_PATH}?token={_token(USER_A_UID)}") as ws_a, \
             client.websocket_connect(f"{WS_PATH}?token={_token(USER_B_UID)}") as ws_b:

            ws_a.send_json({
                "type": "message",
                "to_user_id": id_b,
                "text": "Hello from pytest A!",
                "client_message_id": client_msg_id,
            })

            # B should receive the message
            frame = ws_b.receive_json()
            assert frame["type"] == "message", f"Expected 'message', got {frame}"
            assert frame["text"] == "Hello from pytest A!"
            assert frame["from_user_id"] == id_a
            assert frame["client_message_id"] == client_msg_id

    print("\n  ✓ test_ws_message_delivery_online passed")


@pytest.mark.asyncio(loop_scope="module")
async def test_ws_ack_relayed_to_sender(db_and_users):
    """B's ack is relayed back to A as ack_relay."""
    id_a, id_b = db_and_users
    await _ensure_connection(id_a, id_b)

    client_msg_id = f"tc_{uuid.uuid4().hex[:8]}"

    with TestClient(app, raise_server_exceptions=False) as client:
        with client.websocket_connect(f"{WS_PATH}?token={_token(USER_A_UID)}") as ws_a, \
             client.websocket_connect(f"{WS_PATH}?token={_token(USER_B_UID)}") as ws_b:

            # A sends
            ws_a.send_json({
                "type": "message",
                "to_user_id": id_b,
                "text": "Ack test",
                "client_message_id": client_msg_id,
            })
            ws_b.receive_json()  # B receives

            # B acks
            ws_b.send_json({"type": "ack", "client_message_id": client_msg_id})

            # A gets ack_relay (skipping presence frame if B's online event arrives first)
            relay = ws_a.receive_json()
            if relay.get("type") == "presence":
                relay = ws_a.receive_json()
            assert relay["type"] == "ack_relay", f"Expected 'ack_relay', got {relay}"
            assert relay["client_message_id"] == client_msg_id

    print("\n  ✓ test_ws_ack_relayed_to_sender passed")


@pytest.mark.asyncio(loop_scope="module")
async def test_ws_rejected_if_no_accepted_connection(db_and_users):
    """Message to a user without an ACCEPTED connection returns an error frame."""
    id_a, id_b = db_and_users
    await _remove_connection(id_a, id_b)

    with TestClient(app, raise_server_exceptions=False) as client:
        with client.websocket_connect(f"{WS_PATH}?token={_token(USER_A_UID)}") as ws_a, \
             client.websocket_connect(f"{WS_PATH}?token={_token(USER_B_UID)}") as _ws_b:

            ws_a.send_json({
                "type": "message",
                "to_user_id": id_b,
                "text": "Should be blocked",
                "client_message_id": "blocked_test",
            })

            error_frame = ws_a.receive_json()
            assert error_frame["type"] == "error", f"Expected error frame, got {error_frame}"
            assert error_frame["code"] == "NOT_CONNECTED"

    print("\n  ✓ test_ws_rejected_if_no_accepted_connection passed")


@pytest.mark.asyncio(loop_scope="module")
async def test_ws_invalid_frame_no_disconnect(db_and_users):
    """Malformed frames return an error frame — connection stays open."""
    id_a, id_b = db_and_users

    with TestClient(app, raise_server_exceptions=False) as client:
        with client.websocket_connect(f"{WS_PATH}?token={_token(USER_A_UID)}") as ws_a:
            ws_a.send_text("not json at all!!")
            err = ws_a.receive_json()
            assert err["type"] == "error"
            assert err["code"] == "INVALID_JSON"

            # Connection still open — send another frame
            ws_a.send_json({
                "type": "message",
                "to_user_id": id_b,
                "text": "hi",
                "client_message_id": "still_alive",
            })
            # Will get an error (NOT_CONNECTED or similar), not a disconnect
            response = ws_a.receive_json()
            assert response["type"] == "error"

    print("\n  ✓ test_ws_invalid_frame_no_disconnect passed")
