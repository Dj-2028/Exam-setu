"""SQLAlchemy declarative base and naming conventions."""

from __future__ import annotations

from sqlalchemy.orm import DeclarativeBase, MappedAsDataclass


class Base(DeclarativeBase):
    """Declarative base with naming conventions for constraints.

    This ensures Alembic can auto-generate constraint names consistently.
    """

    pass


# Naming convention for auto-generated constraint names
NAMING_CONVENTION = {
    "ix": "ix_%(column_0_label)s",
    "uq": "uq_%(table_name)s_%(column_0_name)s",
    "ck": "ck_%(table_name)s_%(constraint_name)s",
    "fk": "fk_%(table_name)s_%(column_0_name)s_%(referred_table_name)s",
    "pk": "pk_%(table_name)s",
}

Base.metadata.naming_convention = NAMING_CONVENTION  # type: ignore[assignment]
