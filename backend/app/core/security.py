"""Security: Firebase token verification, current-user context, role guards."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Annotated
from uuid import UUID

import firebase_admin
from fastapi import Depends, Request
from firebase_admin import auth as firebase_auth

from app.core.config import Settings, get_settings
from app.core.errors import ForbiddenError, UnauthorizedError
from app.core.logging import get_logger

logger = get_logger(__name__)

# ────────────────────────── Firebase Init ──────────────────────────

_firebase_app = None


def init_firebase(settings: Settings) -> None:
    """Initialize the Firebase Admin SDK (called once at startup)."""
    global _firebase_app
    if _firebase_app is not None:
        return

    import json

    cred_dict = json.loads(settings.firebase_service_account)
    if cred_dict:
        cred = firebase_admin.credentials.Certificate(cred_dict)
        _firebase_app = firebase_admin.initialize_app(cred)
    else:
        # In dev, might use FIREBASE_AUTH_EMULATOR_HOST
        _firebase_app = firebase_admin.initialize_app()


# ────────────────────────── Current User ──────────────────────────


@dataclass
class CurrentUser:
    """The authenticated user context, available in every request."""

    uid: str  # Firebase UID
    user_id: UUID | None = None  # Local database user ID
    email: str = ""
    role: str = ""  # "examiner" | "controller" | "admin"
    name: str = ""


def _extract_token(request: Request) -> str:
    """Extract the Bearer token from the Authorization header."""
    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        raise UnauthorizedError("Missing or invalid Authorization header.")
    return auth_header[7:]


async def get_current_user(
    request: Request,
    settings: Annotated[Settings, Depends(get_settings)],
) -> CurrentUser:
    """FastAPI dependency: verify the Firebase ID token and build user context.

    The actual database user lookup is done by the auth module's service layer,
    but for now this verifies the token and extracts claims.
    """
    token = _extract_token(request)

    try:
        decoded = firebase_auth.verify_id_token(token)
    except firebase_auth.ExpiredIdTokenError:
        raise UnauthorizedError("Token has expired. Please sign in again.")
    except firebase_auth.InvalidIdTokenError:
        raise UnauthorizedError("Invalid authentication token.")
    except Exception as e:
        logger.error("token_verification_failed", error=str(e))
        raise UnauthorizedError("Authentication failed.")

    role = decoded.get("role", "")
    if not role:
        raise ForbiddenError("No role assigned. Contact your administrator.")

    return CurrentUser(
        uid=decoded["uid"],
        email=decoded.get("email", ""),
        role=role,
        name=decoded.get("name", ""),
    )


# ────────────────────────── Role Guard ──────────────────────────


def require_roles(*allowed_roles: str):
    """Return a FastAPI dependency that enforces role membership.

    Usage in a router:
        @router.get("/admin-only", dependencies=[Depends(require_roles("admin"))])
    """

    async def _guard(
        current_user: Annotated[CurrentUser, Depends(get_current_user)],
    ) -> CurrentUser:
        if current_user.role not in allowed_roles:
            raise ForbiddenError(
                f"Role '{current_user.role}' is not authorized for this action."
            )
        return current_user

    return _guard
