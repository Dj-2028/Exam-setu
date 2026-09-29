"""Auth module — login/sync endpoint and token refresh.

Firebase handles actual authentication. This module syncs the
Firebase user with the local database on first authenticated request.
"""

from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import AuthenticatedUser, DBSession
from app.core.security import CurrentUser
from app.modules.users.service import UserService

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/sync")
async def sync_user(
    db: DBSession,
    current_user: AuthenticatedUser,
):
    """Sync the authenticated Firebase user with the local database.

    Called after login to ensure the local user record exists and
    returns the full user profile including database ID.
    """
    svc = UserService(db)
    user = await svc.get_user_by_firebase_uid(current_user.uid)

    if not user:
        return {
            "synced": False,
            "message": "User not found. Contact your administrator.",
        }

    return {
        "synced": True,
        "user": {
            "id": str(user.id),
            "email": user.email,
            "name": user.name,
            "role": user.role,
            "is_active": user.is_active,
        },
    }
