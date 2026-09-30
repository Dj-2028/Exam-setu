"""User service — CRUD operations and Clerk sync."""

from __future__ import annotations

from uuid import UUID, uuid4

import httpx
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
        """Create a user in Clerk (if configured) and the local database.

        Clerk is the source of truth for auth; the local DB stores role metadata.
        """
        # Check for existing email in local DB
        existing = await self._db.execute(
            select(User).where(User.email == data.email)
        )
        if existing.scalar_one_or_none():
            raise ConflictError(f"User with email {data.email} already exists.")

        settings = get_settings()
        clerk_user_id = f"user_{uuid4().hex[:16]}"

        # If Clerk secret key is provided, provision in Clerk
        if settings.clerk_secret_key:
            async with httpx.AsyncClient() as client:
                res = await client.post(
                    "https://api.clerk.com/v1/users",
                    headers={"Authorization": f"Bearer {settings.clerk_secret_key}"},
                    json={
                        "email_address": [data.email],
                        "first_name": data.name,
                        "password": data.password,
                        "public_metadata": {"role": data.role},
                    },
                )
                if res.status_code == 422:
                    raise ConflictError(f"Email {data.email} already exists in Clerk or invalid data.")
                if res.status_code in (200, 201):
                    clerk_user_id = res.json().get("id", clerk_user_id)
                else:
                    logger.warning(
                        "clerk_user_creation_warning",
                        status=res.status_code,
                        body=res.text,
                    )
        else:
            logger.info("clerk_secret_key_not_set_using_generated_id", clerk_user_id=clerk_user_id)

        # Create local user record
        user = User(
            clerk_user_id=clerk_user_id,
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
            clerk_user_id=user.clerk_user_id,
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

    async def get_user_by_clerk_id(self, clerk_user_id: str) -> User | None:
        """Fetch a user by Clerk User ID."""
        result = await self._db.execute(
            select(User).where(User.clerk_user_id == clerk_user_id)
        )
        return result.scalar_one_or_none()

    # Backward-compatibility alias
    get_user_by_firebase_uid = get_user_by_clerk_id

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

        total_result = await self._db.execute(count_query)
        total = total_result.scalar() or 0

        offset = (page - 1) * page_size
        query = query.order_by(User.created_at.desc()).offset(offset).limit(page_size)
        result = await self._db.execute(query)
        users = list(result.scalars().all())

        return users, total

    async def update_user(self, user_id: UUID, data: UserUpdate) -> User:
        """Update a user's profile or role."""
        user = await self.get_user_by_id(user_id)
        settings = get_settings()

        if data.name is not None:
            user.name = data.name
        if data.is_active is not None:
            user.is_active = data.is_active
        if data.role is not None:
            user.role = data.role
            # Sync role to Clerk public metadata if key is configured
            if settings.clerk_secret_key:
                try:
                    async with httpx.AsyncClient() as client:
                        await client.patch(
                            f"https://api.clerk.com/v1/users/{user.clerk_user_id}/metadata",
                            headers={"Authorization": f"Bearer {settings.clerk_secret_key}"},
                            json={"public_metadata": {"role": data.role}},
                        )
                except Exception as e:
                    logger.warning("clerk_metadata_update_failed", error=str(e))

        await self._db.commit()
        await self._db.refresh(user)

        logger.info("user_updated", user_id=str(user.id))
        return user

    async def deactivate_user(self, user_id: UUID) -> User:
        """Soft-deactivate a user (they can no longer sign in)."""
        user = await self.get_user_by_id(user_id)
        user.is_active = False

        # Ban in Clerk if key is configured
        settings = get_settings()
        if settings.clerk_secret_key:
            try:
                async with httpx.AsyncClient() as client:
                    await client.post(
                        f"https://api.clerk.com/v1/users/{user.clerk_user_id}/ban",
                        headers={"Authorization": f"Bearer {settings.clerk_secret_key}"},
                    )
            except Exception as e:
                logger.warning("clerk_ban_failed", error=str(e))

        await self._db.commit()
        await self._db.refresh(user)

        logger.info("user_deactivated", user_id=str(user.id))
        return user
