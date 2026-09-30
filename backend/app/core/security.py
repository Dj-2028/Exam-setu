"""Security: Clerk token verification, current-user context, role guards."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Annotated
from uuid import UUID

import jwt
from jwt import PyJWKClient
from fastapi import Depends, Request

from app.core.config import Settings, get_settings
from app.core.errors import ForbiddenError, UnauthorizedError
from app.core.logging import get_logger

logger = get_logger(__name__)

# ────────────────────────── JWKS Cache ──────────────────────────

_jwks_clients: dict[str, PyJWKClient] = {}


def _get_jwks_client(jwks_url: str) -> PyJWKClient:
    """Get or create a cached PyJWKClient for the given JWKS URL."""
    if jwks_url not in _jwks_clients:
        _jwks_clients[jwks_url] = PyJWKClient(jwks_url, cache_keys=True)
    return _jwks_clients[jwks_url]


# ────────────────────────── Current User ──────────────────────────


@dataclass
class CurrentUser:
    """The authenticated user context, available in every request."""

    uid: str  # Clerk user ID (e.g. user_2...)
    user_id: UUID | None = None  # Local database user ID
    email: str = ""
    role: str = ""  # "examiner" | "controller" | "admin"
    name: str = ""


def _extract_token(request: Request) -> str:
    """Extract the Bearer token from the Authorization header."""
    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        raise UnauthorizedError("Missing or invalid Authorization header.")
    return auth_header[7:].strip()


async def get_current_user(
    request: Request,
    settings: Annotated[Settings, Depends(get_settings)],
) -> CurrentUser:
    """FastAPI dependency: verify the Clerk JWT session token and build user context."""
    token = _extract_token(request)

    # In dev mode, allow dev convenience token if explicitly configured
    if settings.env == "dev" and token.startswith("dev-mock-"):
        mock_role = token.replace("dev-mock-", "")
        return CurrentUser(
            uid="user_mock_dev",
            email=f"{mock_role}@examsetu.dev",
            role=mock_role if mock_role in ("examiner", "controller", "admin") else "admin",
            name=f"Dev {mock_role.capitalize()}",
        )

    try:
        # Determine JWKS URL from token issuer or settings
        jwks_url = settings.clerk_jwks_url
        unverified_claims = jwt.decode(token, options={"verify_signature": False})
        iss = unverified_claims.get("iss", "")

        # If issuer is a Clerk frontend API domain and default jwks is used, point to the issuer's JWKS
        if iss and ("clerk" in iss or "accounts.dev" in iss):
            jwks_url = f"{iss.rstrip('/')}/.well-known/jwks.json"

        client = _get_jwks_client(jwks_url)
        signing_key = client.get_signing_key_from_jwt(token)

        decoded = jwt.decode(
            token,
            signing_key.key,
            algorithms=["RS256"],
            options={"verify_aud": False},
        )
    except jwt.ExpiredSignatureError:
        raise UnauthorizedError("Token has expired. Please sign in again.")
    except jwt.InvalidTokenError as e:
        logger.error("token_invalid", error=str(e))
        raise UnauthorizedError("Invalid authentication token.")
    except Exception as e:
        logger.error("token_verification_failed", error=str(e))
        raise UnauthorizedError("Authentication failed.")

    uid = decoded.get("sub", "")
    if not uid:
        raise UnauthorizedError("Invalid token: missing subject (sub).")

    # Extract role from Clerk metadata or custom claims
    metadata = decoded.get("public_metadata") or decoded.get("metadata") or {}
    role = (
        decoded.get("role")
        or metadata.get("role")
        or ""
    )

    # Extract email & name if available in token
    email = decoded.get("email") or ""
    if not email and "email_addresses" in decoded:
        emails = decoded.get("email_addresses", [])
        if emails and isinstance(emails, list):
            email = emails[0].get("email_address", "")

    name = decoded.get("name", "")
    if not name and ("first_name" in decoded or "last_name" in decoded):
        name = f"{decoded.get('first_name', '')} {decoded.get('last_name', '')}".strip()

    return CurrentUser(
        uid=uid,
        email=email,
        role=role,
        name=name,
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
