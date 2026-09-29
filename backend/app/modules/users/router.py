"""User API routes — admin-only CRUD."""

from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, Depends, Query

from app.core.deps import AuthenticatedUser, DBSession
from app.core.security import require_roles
from app.modules.users.schemas import (
    UserCreate,
    UserListResponse,
    UserResponse,
    UserUpdate,
)
from app.modules.users.service import UserService

router = APIRouter(prefix="/users", tags=["users"])


@router.post(
    "",
    response_model=UserResponse,
    status_code=201,
    dependencies=[Depends(require_roles("admin"))],
)
async def create_user(
    data: UserCreate,
    db: DBSession,
    current_user: AuthenticatedUser,
):
    """Create a new user (admin only)."""
    svc = UserService(db)
    user = await svc.create_user(data)
    return user


@router.get(
    "",
    response_model=UserListResponse,
    dependencies=[Depends(require_roles("admin", "controller"))],
)
async def list_users(
    db: DBSession,
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    role: str | None = Query(default=None),
):
    """List all users with optional role filter."""
    svc = UserService(db)
    users, total = await svc.list_users(page=page, page_size=page_size, role_filter=role)
    total_pages = (total + page_size - 1) // page_size if page_size > 0 else 0
    return UserListResponse(
        items=[UserResponse.model_validate(u) for u in users],
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
    )


@router.get(
    "/me",
    response_model=UserResponse,
)
async def get_current_user_profile(
    db: DBSession,
    current_user: AuthenticatedUser,
):
    """Get the currently authenticated user's profile."""
    svc = UserService(db)
    user = await svc.get_user_by_firebase_uid(current_user.uid)
    if not user:
        # First login — auto-create from Firebase claims
        from app.modules.users.schemas import UserCreate
        # This path shouldn't normally occur since admins create users first
        from app.core.errors import NotFoundError
        raise NotFoundError("User profile not found. Contact your administrator.")
    return user


@router.get(
    "/{user_id}",
    response_model=UserResponse,
    dependencies=[Depends(require_roles("admin"))],
)
async def get_user(user_id: UUID, db: DBSession):
    """Get a specific user by ID (admin only)."""
    svc = UserService(db)
    return await svc.get_user_by_id(user_id)


@router.patch(
    "/{user_id}",
    response_model=UserResponse,
    dependencies=[Depends(require_roles("admin"))],
)
async def update_user(user_id: UUID, data: UserUpdate, db: DBSession):
    """Update a user's profile or role (admin only)."""
    svc = UserService(db)
    return await svc.update_user(user_id, data)


@router.post(
    "/{user_id}/deactivate",
    response_model=UserResponse,
    dependencies=[Depends(require_roles("admin"))],
)
async def deactivate_user(user_id: UUID, db: DBSession):
    """Deactivate a user (admin only)."""
    svc = UserService(db)
    return await svc.deactivate_user(user_id)
