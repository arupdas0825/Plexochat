"""Centralized error handling and generic client responses (security.md §5)."""

import uuid
from typing import Any, Dict, Optional
from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException
from app.core.logging import logger, request_id_ctx


class PlexoChatException(Exception):
    """Base application exception."""

    def __init__(
        self,
        message: str = "An unexpected error occurred. Please try again.",
        status_code: int = status.HTTP_500_INTERNAL_SERVER_ERROR,
        code: str = "INTERNAL_ERROR",
        internal_details: Optional[str] = None,
    ):
        super().__init__(message)
        self.message = message
        self.status_code = status_code
        self.code = code
        self.internal_details = internal_details


class AuthenticationError(PlexoChatException):
    """Raised on authentication failures."""

    def __init__(
        self,
        message: str = "Authentication failed. Invalid or expired token.",
        internal_details: Optional[str] = None,
    ):
        super().__init__(
            message=message,
            status_code=status.HTTP_401_UNAUTHORIZED,
            code="AUTHENTICATION_FAILED",
            internal_details=internal_details,
        )


class AuthorizationError(PlexoChatException):
    """Raised on permission/connection-level authorization failures."""

    def __init__(
        self,
        message: str = "You do not have permission to perform this action.",
        internal_details: Optional[str] = None,
    ):
        super().__init__(
            message=message,
            status_code=status.HTTP_403_FORBIDDEN,
            code="FORBIDDEN",
            internal_details=internal_details,
        )


class NotFoundError(PlexoChatException):
    """Raised when a requested resource is not found."""

    def __init__(
        self,
        message: str = "Requested resource not found.",
        internal_details: Optional[str] = None,
    ):
        super().__init__(
            message=message,
            status_code=status.HTTP_404_NOT_FOUND,
            code="NOT_FOUND",
            internal_details=internal_details,
        )


class ConflictError(PlexoChatException):
    """Raised on unique constraint violations or duplicate requests."""

    def __init__(
        self,
        message: str = "Resource conflict. The requested item or handle is unavailable.",
        internal_details: Optional[str] = None,
    ):
        super().__init__(
            message=message,
            status_code=status.HTTP_409_CONFLICT,
            code="CONFLICT",
            internal_details=internal_details,
        )


class RateLimitExceededError(PlexoChatException):
    """Raised when client exceeds rate-limit threshold."""

    def __init__(
        self,
        message: str = "Too many requests. Please slow down and try again later.",
        retry_after: int = 60,
        internal_details: Optional[str] = None,
    ):
        super().__init__(
            message=message,
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            code="RATE_LIMIT_EXCEEDED",
            internal_details=internal_details,
        )
        self.retry_after = retry_after


def format_error_response(
    message: str,
    code: str,
    request_id: str,
    status_code: int,
    headers: Optional[Dict[str, str]] = None,
) -> JSONResponse:
    """Returns a consistent, user-safe generic error response."""
    return JSONResponse(
        status_code=status_code,
        content={
            "error": {
                "message": message,
                "code": code,
                "request_id": request_id,
            }
        },
        headers=headers,
    )


def register_exception_handlers(app: FastAPI) -> None:
    """Registers centralized exception handlers into the FastAPI app."""

    @app.exception_handler(PlexoChatException)
    async def plexochat_exception_handler(
        request: Request, exc: PlexoChatException
    ) -> JSONResponse:
        req_id = request_id_ctx.get() or str(uuid.uuid4())
        logger.warning(
            f"Handled application exception: code={exc.code}, status={exc.status_code}, "
            f"msg='{exc.message}', internal='{exc.internal_details}'"
        )
        headers = {}
        if isinstance(exc, RateLimitExceededError):
            headers["Retry-After"] = str(exc.retry_after)
        return format_error_response(
            message=exc.message,
            code=exc.code,
            request_id=req_id,
            status_code=exc.status_code,
            headers=headers,
        )

    @app.exception_handler(StarletteHTTPException)
    async def http_exception_handler(
        request: Request, exc: StarletteHTTPException
    ) -> JSONResponse:
        req_id = request_id_ctx.get() or str(uuid.uuid4())
        logger.warning(
            f"HTTP exception: status={exc.status_code}, detail='{exc.detail}'"
        )
        # Map raw 401/403/404 to safe messages
        msg = str(exc.detail) if exc.status_code != 500 else "An internal error occurred."
        return format_error_response(
            message=msg,
            code=f"HTTP_{exc.status_code}",
            request_id=req_id,
            status_code=exc.status_code,
        )

    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(
        request: Request, exc: RequestValidationError
    ) -> JSONResponse:
        req_id = request_id_ctx.get() or str(uuid.uuid4())
        # Log exact validation breakdown server-side
        logger.warning(f"Request validation failure: {exc.errors()}")
        # Return generic validation failure message without leaking raw model definitions
        return format_error_response(
            message="Invalid request payload or query parameters.",
            code="VALIDATION_ERROR",
            request_id=req_id,
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        )

    @app.exception_handler(Exception)
    async def generic_exception_handler(
        request: Request, exc: Exception
    ) -> JSONResponse:
        req_id = request_id_ctx.get() or str(uuid.uuid4())
        # CRITICAL: Log complete traceback and error details server-side only
        logger.exception(f"Unhandled server error: {str(exc)}")
        # Client receives strictly generic message
        return format_error_response(
            message="Something went wrong. Please try again later.",
            code="INTERNAL_SERVER_ERROR",
            request_id=req_id,
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )
