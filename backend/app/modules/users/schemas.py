"""User API schemas (Pydantic v2)."""

from __future__ import annotations

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, EmailStr, Field


class UserCreate(BaseModel):
    """Schema for creating a new user (admin action)."""

    email: EmailStr
    name: str = Field(..., min_length=1, max_length=255)
    role: str = Field(..., pattern="^(examiner|controller|admin)$")
    password: str = Field(..., min_length=8, max_length=128)


class UserUpdate(BaseModel):
    """Schema for updating a user."""

    name: str | None = Field(None, min_length=1, max_length=255)
    role: str | None = Field(None, pattern="^(examiner|controller|admin)$")
    is_active: bool | None = None


class UserResponse(BaseModel):
    """Schema for user API response."""

    id: UUID
    email: str
    name: str
    role: str
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class UserListResponse(BaseModel):
    """Paginated list of users."""

    items: list[UserResponse]
    total: int
    page: int
    page_size: int
    total_pages: int
