"""Firebase ID token verification and current user resolution."""

import json
from typing import Optional
from fastapi import Depends, Header, WebSocket, status
import firebase_admin
from firebase_admin import auth as firebase_auth, credentials
from app.core.config import settings
from app.core.errors import AuthenticationError
from app.core.logging import logger
from app.db.collections import get_users_collection
from app.models.user import User

from google.auth.transport import requests as google_requests
from google.oauth2 import id_token as google_id_token

_firebase_app: Optional[firebase_admin.App] = None
_request_adapter = google_requests.Request()


def init_firebase() -> None:
    """Initializes Firebase Admin SDK using configured service account if available."""
    global _firebase_app
    if _firebase_app is not None or firebase_admin._apps:
        return

    logger.info("Initializing Firebase Admin SDK...")
    try:
        project_id = settings.FIREBASE_PROJECT_ID or "plexochat"
        cred = None
        if settings.FIREBASE_SERVICE_ACCOUNT_JSON and settings.FIREBASE_SERVICE_ACCOUNT_JSON.strip():
            raw_json = settings.FIREBASE_SERVICE_ACCOUNT_JSON.strip()
            try:
                cert_dict = json.loads(raw_json)
            except Exception:
                import base64
                try:
                    decoded = base64.b64decode(raw_json).decode("utf-8")
                    cert_dict = json.loads(decoded)
                except Exception:
                    raise
            cred = credentials.Certificate(cert_dict)
            _firebase_app = firebase_admin.initialize_app(cred, options={"projectId": project_id})
            logger.info("Firebase Admin SDK initialized with Service Account JSON.")
        elif settings.FIREBASE_SERVICE_ACCOUNT_PATH:
            cred = credentials.Certificate(settings.FIREBASE_SERVICE_ACCOUNT_PATH)
            _firebase_app = firebase_admin.initialize_app(cred, options={"projectId": project_id})
            logger.info("Firebase Admin SDK initialized with Service Account file.")
        else:
            logger.info(
                f"No service account credentials configured. Firebase tokens will be verified via Google public certificates (projectId={project_id})."
            )
    except Exception as e:
        logger.error(f"Failed to initialize Firebase Admin SDK: {e}")


def verify_firebase_id_token(token: str) -> dict:
    """Verifies a Firebase ID token and returns decoded token claims."""
    init_firebase()
    try:
        # Check if running in development mode with test token
        if settings.ENVIRONMENT == "development" and token.startswith("test_token_"):
            uid = token.replace("test_token_", "")
            return {
                "uid": uid,
                "sub": uid,
                "user_id": uid,
                "email": f"{uid}@example.com",
                "name": f"User {uid}",
                "email_verified": True,
            }

        # If Firebase Admin SDK was initialized with credentials, use it
        if _firebase_app is not None:
            decoded = firebase_auth.verify_id_token(token, check_revoked=True, clock_skew_seconds=60)
            return decoded

        # Otherwise verify cryptographically using Google public certs
        project_id = settings.FIREBASE_PROJECT_ID or "plexochat"
        raw_decoded = google_id_token.verify_firebase_token(
            token,
            _request_adapter,
            audience=project_id,
            clock_skew_in_seconds=60,
        )
        claims = dict(raw_decoded)
        if not claims.get("uid") and claims.get("sub"):
            claims["uid"] = claims["sub"]
        if not claims.get("uid") and claims.get("user_id"):
            claims["uid"] = claims["user_id"]
        return claims
    except Exception as e:
        logger.warning(f"Firebase token verification failed: {e}")
        raise AuthenticationError(
            message="Invalid or expired authentication credentials.",
            internal_details=str(e),
        )


async def get_current_user_from_token(token: str) -> User:
    """Validates token and fetches the User from MongoDB."""
    claims = verify_firebase_id_token(token)
    firebase_uid = claims.get("uid") or claims.get("sub")
    if not firebase_uid:
        raise AuthenticationError("Invalid token claims: missing subject UID.")

    users_col = get_users_collection()
    doc = await users_col.find_one({"firebase_uid": firebase_uid})
    if not doc:
        # User has authenticated with Firebase but has not yet called /api/v1/auth/bootstrap
        raise AuthenticationError(
            message="User profile not bootstrapped. Please complete profile setup.",
            internal_details=f"No user document found for firebase_uid {firebase_uid}",
        )

    doc["_id"] = str(doc["_id"])
    if not doc.get("display_name"):
        doc["display_name"] = (doc.get("email") or "").split("@")[0] or f"User_{doc['_id'][-4:]}"
    if not doc.get("username"):
        clean_un = "".join(c for c in (doc.get("email") or "").split("@")[0].lower() if c.isalnum() or c == "_")
        doc["username"] = (f"user_{clean_un}" if len(clean_un) < 3 else clean_un)[:30]
    if not doc.get("plexochat_id"):
        doc["plexochat_id"] = doc["username"]
    if not doc.get("preferred_receiving_language"):
        doc["preferred_receiving_language"] = "en"
    return User(**doc)


async def get_current_user(authorization: Optional[str] = Header(None)) -> User:
    """FastAPI dependency for protected HTTP endpoints.

    Expects 'Authorization: Bearer <firebase_id_token>'.
    """
    if not authorization:
        raise AuthenticationError("Missing Authorization header.")

    parts = authorization.split()
    if len(parts) != 2 or parts[0].lower() != "bearer":
        raise AuthenticationError("Invalid Authorization header format. Expected 'Bearer <token>'.")

    token = parts[1]
    return await get_current_user_from_token(token)


async def get_optional_current_user(authorization: Optional[str] = Header(None)) -> Optional[User]:
    """FastAPI dependency for optional authentication."""
    if not authorization:
        return None
    try:
        return await get_current_user(authorization)
    except AuthenticationError:
        return None


async def authenticate_websocket(websocket: WebSocket) -> User:
    """Authenticates WebSocket connection during the initial handshake.

    WEBSOCKET AUTHENTICATION HANDSHAKE SPECIFICATION:
    Browser WebSocket APIs do not support setting custom Authorization headers.
    Therefore, the Firebase ID token is passed as a query parameter on connection:
    `wss://api.plexochat.com/api/v1/ws?token=<firebase_id_token>`

    The token is validated BEFORE accepting the connection. If invalid, the connection
    is closed with code 4001 (Unauthorized).
    """
    token = websocket.query_params.get("token")
    if not token:
        logger.warning("WebSocket connection attempt missing token query parameter.")
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION, reason="Missing auth token")
        raise AuthenticationError("Missing WebSocket token")

    try:
        user = await get_current_user_from_token(token)
        return user
    except Exception as e:
        logger.warning(f"WebSocket authentication failed: {e}")
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION, reason="Authentication failed")
        raise AuthenticationError("WebSocket authentication failed", internal_details=str(e))
