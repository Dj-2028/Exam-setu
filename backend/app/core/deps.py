"""Shared FastAPI dependencies."""

from __future__ import annotations

from typing import Annotated

from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import Settings, get_settings
from app.core.security import CurrentUser, get_current_user
from app.db.session import get_db_session

# Typed dependency aliases for use in route signatures
DBSession = Annotated[AsyncSession, Depends(get_db_session)]
AppSettings = Annotated[Settings, Depends(get_settings)]
AuthenticatedUser = Annotated[CurrentUser, Depends(get_current_user)]
