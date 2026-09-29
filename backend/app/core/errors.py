"""Application exception classes and FastAPI error handlers.

All domain exceptions map to the single error format described in backend.md §6.
"""

from __future__ import annotations

from typing import Any

from fastapi import FastAPI, Request
from fastapi.responses import ORJSONResponse

from app.core.logging import get_logger

logger = get_logger(__name__)


# ────────────────────────── Base Exceptions ──────────────────────────


class AppError(Exception):
    """Base application error with a structured error code."""

    status_code: int = 500
    error_code: str = "internal_error"
    message: str = "An unexpected error occurred."

    def __init__(
        self,
        message: str | None = None,
        *,
        error_code: str | None = None,
        details: dict[str, Any] | None = None,
    ) -> None:
        self.message = message or self.__class__.message
        if error_code:
            self.error_code = error_code
        self.details = details or {}
        super().__init__(self.message)


class BadRequestError(AppError):
    status_code = 400
    error_code = "bad_request"
    message = "The request is malformed."


class UnauthorizedError(AppError):
    status_code = 401
    error_code = "unauthorized"
    message = "Authentication is required."


class ForbiddenError(AppError):
    status_code = 403
    error_code = "forbidden"
    message = "You are not authorized to perform this action."


class NotFoundError(AppError):
    status_code = 404
    error_code = "not_found"
    message = "The requested resource was not found."


class ConflictError(AppError):
    status_code = 409
    error_code = "conflict"
    message = "The request conflicts with the current state."


class ValidationError(AppError):
    status_code = 422
    error_code = "validation_error"
    message = "Input validation failed."


class RateLimitError(AppError):
    status_code = 429
    error_code = "rate_limited"
    message = "Too many requests. Please try again later."


# ────────────────────────── Error Handlers ──────────────────────────


def _build_error_response(
    status_code: int,
    error_code: str,
    message: str,
    details: dict[str, Any] | None = None,
    request_id: str | None = None,
) -> ORJSONResponse:
    """Build the single error format response."""
    body: dict[str, Any] = {
        "error": {
            "code": error_code,
            "message": message,
        }
    }
    if details:
        body["error"]["details"] = details
    if request_id:
        body["error"]["request_id"] = request_id
    return ORJSONResponse(status_code=status_code, content=body)


async def app_error_handler(request: Request, exc: AppError) -> ORJSONResponse:
    """Handle all AppError subclasses."""
    request_id = getattr(request.state, "request_id", None)
    return _build_error_response(
        status_code=exc.status_code,
        error_code=exc.error_code,
        message=exc.message,
        details=exc.details if exc.details else None,
        request_id=request_id,
    )


async def unhandled_error_handler(
    request: Request, exc: Exception
) -> ORJSONResponse:
    """Handle unexpected errors — never leak internals."""
    request_id = getattr(request.state, "request_id", None)
    logger.error(
        "unhandled_error",
        error=str(exc),
        request_id=request_id,
        exc_info=True,
    )
    return _build_error_response(
        status_code=500,
        error_code="internal_error",
        message="An unexpected error occurred.",
        request_id=request_id,
    )


def register_error_handlers(app: FastAPI) -> None:
    """Register all error handlers on the FastAPI app."""
    app.add_exception_handler(AppError, app_error_handler)  # type: ignore[arg-type]
    app.add_exception_handler(Exception, unhandled_error_handler)
