"""User service — CRUD operations and Firebase sync."""

from __future__ import annotations

import json
from uuid import UUID

from firebase_admin import auth as firebase_auth
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.core.errors import ConflictError, NotFoundError
from app.core.logging import get_logger
from app.modules.users.models import User
from app.modules.users.schemas import UserCreate, UserUpdate

logger = get_logger(__name__)


class UserService:
    """Business logic for user management."""

    def __init__(self, db: AsyncSession) -> None:
        self._db = db

    async def create_user(self, data: UserCreate) -> User:
        """Create a user in Firebase and the local database.

        Firebase is the source of truth for auth; the local DB stores role metadata.
        """
        # Check for existing email
        existing = await self._db.execute(
            select(User).where(User.email == data.email)
        )
        if existing.scalar_one_or_none():
            raise ConflictError(f"User with email {data.email} already exists.")

        # Create Firebase user
        try:
            firebase_user = firebase_auth.create_user(
                email=data.email,
                password=data.password,
                display_name=data.name,
            )
        except firebase_auth.EmailAlreadyExistsError:
            raise ConflictError(f"Email {data.email} already exists in Firebase.")

        # Set custom claims (role)
        firebase_auth.set_custom_user_claims(
            firebase_user.uid, {"role": data.role}
        )

        # Create local user record
        user = User(
            firebase_uid=firebase_user.uid,
            email=data.email,
            name=data.name,
            role=data.role,
        )
        self._db.add(user)
        await self._db.commit()
        await self._db.refresh(user)

        logger.info(
            "user_created",
            user_id=str(user.id),
            email=user.email,
            role=user.role,
        )
        return user

    async def get_user_by_id(self, user_id: UUID) -> User:
        """Fetch a user by internal ID."""
        result = await self._db.execute(
            select(User).where(User.id == user_id)
        )
        user = result.scalar_one_or_none()
        if not user:
            raise NotFoundError(f"User {user_id} not found.")
        return user

    async def get_user_by_firebase_uid(self, firebase_uid: str) -> User | None:
        """Fetch a user by Firebase UID."""
        result = await self._db.execute(
            select(User).where(User.firebase_uid == firebase_uid)
        )
        return result.scalar_one_or_none()

    async def list_users(
        self,
        page: int = 1,
        page_size: int = 20,
        role_filter: str | None = None,
    ) -> tuple[list[User], int]:
        """List users with pagination and optional role filter."""
        query = select(User)
        count_query = select(func.count()).select_from(User)

        if role_filter:
            query = query.where(User.role == role_filter)
            count_query = count_query.where(User.role == role_filter)

        # Get total count
        total_result = await self._db.execute(count_query)
        total = total_result.scalar() or 0

        # Get paginated results
        offset = (page - 1) * page_size
        query = query.order_by(User.created_at.desc()).offset(offset).limit(page_size)
        result = await self._db.execute(query)
        users = list(result.scalars().all())

        return users, total

    async def update_user(self, user_id: UUID, data: UserUpdate) -> User:
        """Update a user's profile or role."""
        user = await self.get_user_by_id(user_id)

        if data.name is not None:
            user.name = data.name
        if data.is_active is not None:
            user.is_active = data.is_active
        if data.role is not None:
            user.role = data.role
            # Sync role to Firebase custom claims
            firebase_auth.set_custom_user_claims(
                user.firebase_uid, {"role": data.role}
            )

        await self._db.commit()
        await self._db.refresh(user)

        logger.info("user_updated", user_id=str(user.id))
        return user

    async def deactivate_user(self, user_id: UUID) -> User:
        """Soft-deactivate a user (they can no longer sign in)."""
        user = await self.get_user_by_id(user_id)
        user.is_active = False

        # Disable in Firebase too
        firebase_auth.update_user(user.firebase_uid, disabled=True)

        await self._db.commit()
        await self._db.refresh(user)

        logger.info("user_deactivated", user_id=str(user.id))
        return user
