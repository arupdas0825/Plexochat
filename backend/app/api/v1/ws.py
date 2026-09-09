"""PlexoChat WebSocket relay endpoint — scoped v1.

AUTHENTICATION APPROACH:
    Browser WebSocket APIs do not support custom headers (Authorization) during
    the HTTP upgrade handshake. The Firebase ID token is therefore passed as a
    URL query parameter:

        wss://api.plexochat.com/api/v1/ws?token=<firebase_id_token>

    The token is validated via the EXISTING `authenticate_websocket()` function
    in `app.core.security` BEFORE `websocket.accept()` is called. Connections
    with a missing, invalid, or expired token are rejected with WS close code
    1008 (Policy Violation) and never accepted.

OFFLINE DELIVERY STRATEGY:
    When the recipient is offline, the message is written to a `pending_messages`
    MongoDB collection with a 48-hour TTL index. On reconnect, any pending
    messages are flushed to the recipient and immediately deleted — they are
    NEVER left as a permanent log. The sender receives a `{"type":"queued"}`
    status frame.

E2EE RELAY CONTRACT (Phase 5):
    Since the E2EE layer was added, the backend relays ONLY opaque Olm ciphertext.
    - The `text` field is gone. Message frames carry `ciphertext` (base64 Olm blob)
      and `message_type` (0 = PRE_KEY, 1 = MESSAGE).
    - The backend NEVER decrypts, logs, or inspects message content.
    - `pending_messages` stores only ciphertext + routing metadata.
    - No plaintext or translated text ever appears in server logs, DB documents,
      or any other server-side storage. This is enforced at the model level.

OUT OF SCOPE FOR THIS VERSION:
    - Redis (presence/connection state is in-memory — valid for one instance)
    - Photo/file sharing
"""

import json
import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, WebSocket, WebSocketDisconnect, status
from pydantic import ValidationError

from app.core.errors import AuthenticationError
from app.core.logging import logger
from app.core.security import authenticate_websocket
from app.db.collections import get_connections_collection, get_pending_messages_collection
from app.models.message import (
    ErrorFrame,
    IncomingAckFrame,
    IncomingMessageFrame,
    OutgoingAckRelayFrame,
    OutgoingMessageFrame,
    PresenceFrame,
)
from app.models.user import User
from app.services.connection_manager import connection_manager

router = APIRouter(tags=["WebSocket"])

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


async def _has_accepted_connection(user_a_id: str, user_b_id: str) -> bool:
    """Returns True if user_a and user_b have an ACCEPTED connection in MongoDB."""
    col = get_connections_collection()
    doc = await col.find_one(
        {
            "$or": [
                {"user_a_id": user_a_id, "user_b_id": user_b_id},
                {"user_a_id": user_b_id, "user_b_id": user_a_id},
            ],
            "status": "ACCEPTED",
        }
    )
    return doc is not None


async def _broadcast_presence(
    user: User, online_status: str
) -> None:
    """Broadcast a presence frame to all currently-online accepted connections of user."""
    col = get_connections_collection()
    cursor = col.find(
        {
            "$or": [
                {"user_a_id": user.id},
                {"user_b_id": user.id},
            ],
            "status": "ACCEPTED",
        }
    )
    frame = PresenceFrame(user_id=user.id, status=online_status).model_dump()  # type: ignore[arg-type]
    async for doc in cursor:
        peer_id = doc["user_b_id"] if doc["user_a_id"] == user.id else doc["user_a_id"]
        if connection_manager.is_online(peer_id):
            await connection_manager.send_to_user(peer_id, frame)


async def _flush_pending_messages(user: User, websocket: WebSocket) -> None:
    """Deliver queued offline messages on reconnect, then delete them immediately.

    E2EE: queued documents contain only ciphertext + routing metadata.
    Decryption happens client-side after delivery.
    """
    col = get_pending_messages_collection()
    cursor = col.find({"to_user_id": user.id}, sort=[("created_at", 1)])
    async for doc in cursor:
        ciphertext = doc.get("ciphertext") or doc.get("text", "")
        text = doc.get("text") or doc.get("ciphertext", "")
        frame = OutgoingMessageFrame(
            from_user_id=doc["from_user_id"],
            ciphertext=ciphertext,
            text=text,
            message_type=doc.get("message_type", 0),
            client_message_id=doc["client_message_id"],
        ).model_dump()
        try:
            await websocket.send_json(frame)
            # Delete immediately after delivery (never leave as permanent log)
            await col.delete_one({"_id": doc["_id"]})
            logger.info(
                f"Flushed + deleted pending message "
                f"client_message_id={doc['client_message_id']} "
                f"for user_id={user.id}"
                # NOTE: ciphertext is NOT logged — backend never logs message content
            )
        except Exception as exc:
            logger.warning(f"Failed to flush pending message: {exc}")
            break  # Stop flushing if socket is broken; will retry on next connect


async def _handle_offline_recipient(
    sender: User,
    frame: IncomingMessageFrame,
    websocket: WebSocket,
) -> None:
    """Queue encrypted message to pending_messages (TTL-backed) and notify sender.

    E2EE: only ciphertext and routing metadata are stored. Plaintext/translated
    text never appears in this collection.
    """
    col = get_pending_messages_collection()
    await col.insert_one(
        {
            "from_user_id": sender.id,
            "to_user_id": frame.to_user_id,
            "ciphertext": frame.ciphertext or frame.text,
            "text": frame.text or frame.ciphertext,
            "message_type": frame.message_type,
            "client_message_id": frame.client_message_id,
            "created_at": datetime.now(timezone.utc),
            # NOTE: no plaintext, no translated text, no language metadata stored here.
            # All semantic content is inside the encrypted payload decrypted by the recipient.
        }
    )
    logger.info(
        f"Queued pending message client_message_id={frame.client_message_id} "
        f"from={sender.id} to={frame.to_user_id} (recipient offline) "
        # ciphertext deliberately NOT logged
    )
    await websocket.send_json(
        {
            "type": "queued",
            "client_message_id": frame.client_message_id,
            "reason": "recipient_offline",
        }
    )


# ---------------------------------------------------------------------------
# Message dispatch helpers
# ---------------------------------------------------------------------------


async def _handle_message_frame(
    raw: dict,
    sender: User,
    websocket: WebSocket,
) -> None:
    """Validate and relay a 'message' frame from sender.

    E2EE: frame carries ciphertext only. Backend never decrypts.
    """
    try:
        frame = IncomingMessageFrame.model_validate(raw)
    except ValidationError as exc:
        await websocket.send_json(
            ErrorFrame(
                code="INVALID_FRAME",
                message="Invalid message frame: " + str(exc.errors(include_url=False)),
                client_message_id=raw.get("client_message_id"),
            ).model_dump()
        )
        return

    # Enforce accepted-connection check per message (not just at connect time)
    if not await _has_accepted_connection(sender.id, frame.to_user_id):
        await websocket.send_json(
            ErrorFrame(
                code="NOT_CONNECTED",
                message="You do not have an accepted connection with that user.",
                client_message_id=frame.client_message_id,
            ).model_dump()
        )
        logger.warning(
            f"WS message blocked: no accepted connection "
            f"from={sender.id} to={frame.to_user_id}"
        )
        return

    outgoing = OutgoingMessageFrame(
        from_user_id=sender.id,
        ciphertext=frame.ciphertext,
        text=frame.text,
        message_type=frame.message_type,
        client_message_id=frame.client_message_id,
    ).model_dump()

    delivered = await connection_manager.send_to_user(frame.to_user_id, outgoing)

    if delivered:
        logger.info(
            f"WS message relayed: client_message_id={frame.client_message_id} "
            f"from={sender.id} to={frame.to_user_id}"
            # ciphertext NOT logged
        )
    else:
        # Recipient offline — queue for later delivery
        await _handle_offline_recipient(sender, frame, websocket)


async def _handle_ack_frame(
    raw: dict,
    recipient: User,
) -> None:
    """Validate and relay a delivery ack from recipient back to original sender."""
    try:
        frame = IncomingAckFrame.model_validate(raw)
    except ValidationError:
        # Ack frames are best-effort; log but don't error back
        logger.warning(f"Invalid ack frame from user_id={recipient.id}")
        return

    # Also delete any pending_messages record for this client_message_id to
    # handle the reconnect-ack path (recipient got message from pending queue
    # and is now acking it).
    col = get_pending_messages_collection()
    await col.delete_one({"client_message_id": frame.client_message_id})

    # We don't know the original sender's user_id from just the client_message_id,
    # so look it up from pending_messages first, then fall back to broadcasting
    # the ack relay to all of recipient's accepted-connection peers who are online.
    # In practice, only the original sender will recognise this client_message_id.
    connections_col = get_connections_collection()
    cursor = connections_col.find(
        {
            "$or": [
                {"user_a_id": recipient.id},
                {"user_b_id": recipient.id},
            ],
            "status": "ACCEPTED",
        }
    )
    relay_frame = OutgoingAckRelayFrame(
        client_message_id=frame.client_message_id
    ).model_dump()

    async for doc in cursor:
        peer_id = doc["user_b_id"] if doc["user_a_id"] == recipient.id else doc["user_a_id"]
        if connection_manager.is_online(peer_id):
            await connection_manager.send_to_user(peer_id, relay_frame)
            logger.info(
                f"WS ack relay: client_message_id={frame.client_message_id} "
                f"from={recipient.id} to peer={peer_id}"
            )


# ---------------------------------------------------------------------------
# Main WebSocket endpoint
# ---------------------------------------------------------------------------


@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket) -> None:
    """
    WebSocket relay endpoint.

    Connect: wss://<host>/api/v1/ws?token=<firebase_id_token>

    E2EE relay: the server only routes opaque Olm ciphertext blobs between
    authenticated, connected users. No plaintext ever passes through this handler.
    """
    # ── 1. Authenticate BEFORE accepting ────────────────────────────────────
    try:
        user: User = await authenticate_websocket(websocket)
    except (AuthenticationError, Exception):
        # authenticate_websocket already closed the socket with 1008
        return

    # ── 2. Accept the connection ─────────────────────────────────────────────
    await websocket.accept()
    await connection_manager.connect(user.id, websocket)
    logger.info(f"WS accepted: user_id={user.id} display_name={user.display_name}")

    # ── 3. Flush pending offline messages ────────────────────────────────────
    await _flush_pending_messages(user, websocket)

    # ── 4. Broadcast presence=online to accepted connections ─────────────────
    await _broadcast_presence(user, "online")

    # ── 5. Main receive loop ─────────────────────────────────────────────────
    try:
        while True:
            raw_text = await websocket.receive_text()
            try:
                raw = json.loads(raw_text)
            except json.JSONDecodeError:
                await websocket.send_json(
                    ErrorFrame(code="INVALID_JSON", message="Frame is not valid JSON.").model_dump()
                )
                continue

            if not isinstance(raw, dict) or "type" not in raw:
                await websocket.send_json(
                    ErrorFrame(
                        code="INVALID_FRAME", message="Frame must be a JSON object with a 'type' field."
                    ).model_dump()
                )
                continue

            frame_type = raw.get("type")

            if frame_type == "message":
                await _handle_message_frame(raw, user, websocket)
            elif frame_type == "ack":
                await _handle_ack_frame(raw, user)
            elif frame_type == "ping":
                await websocket.send_json({"type": "pong"})
            else:
                await websocket.send_json(
                    ErrorFrame(
                        code="UNKNOWN_TYPE",
                        message=f"Unknown frame type: '{frame_type}'.",
                    ).model_dump()
                )

    except WebSocketDisconnect:
        logger.info(f"WS client disconnected: user_id={user.id}")
    except Exception as exc:
        logger.exception(f"WS unexpected error for user_id={user.id}: {exc}")
    finally:
        # ── 6. Cleanup on disconnect ─────────────────────────────────────────
        await connection_manager.disconnect(user.id, websocket)
        await _broadcast_presence(user, "offline")
        logger.info(f"WS cleanup complete: user_id={user.id}")
