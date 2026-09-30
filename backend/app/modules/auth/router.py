"""Auth module — login/sync endpoint.

Clerk handles authentication. This module syncs the
Clerk user with the local database on authenticated requests.
"""

from __future__ import annotations

from fastapi import APIRouter
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import AuthenticatedUser, DBSession
from app.modules.users.models import User
from app.modules.users.service import UserService

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/sync")
async def sync_user(
    db: DBSession,
    current_user: AuthenticatedUser,
):
    """Sync the authenticated Clerk user with the local database.

    Called after login to ensure the local user record exists and
    returns the full user profile including database ID.
    """
    svc = UserService(db)
    user = await svc.get_user_by_clerk_id(current_user.uid)

    if not user:
        # If user doesn't exist in local database yet, create them with current claims
        role = current_user.role or "examiner"
        email = current_user.email or f"{current_user.uid}@clerk.user"
        name = current_user.name or email.split("@")[0]

        user = User(
            clerk_user_id=current_user.uid,
            email=email,
            name=name,
            role=role,
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)

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
