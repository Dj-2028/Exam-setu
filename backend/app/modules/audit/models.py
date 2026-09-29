"""Audit trail model — tamper-evident hash chain with Ed25519 signatures."""

from __future__ import annotations

from datetime import datetime
from uuid import UUID

from sqlalchemy import DateTime, String, Text, func
from sqlalchemy.dialects.postgresql import UUID as PGUUID, JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.core.utils import new_id
from app.db.base import Base


class AuditEntry(Base):
    """A single entry in the tamper-evident audit trail.

    Each entry contains:
    - The action that occurred
    - The actor (who did it)
    - The payload (what changed)
    - A hash chain linking it to the previous entry
    - An Ed25519 signature proving integrity

    The chain is append-only and verified nightly.
    """

    __tablename__ = "audit_entries"

    id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True), primary_key=True, default=new_id
    )
    sequence_number: Mapped[int] = mapped_column(
        nullable=False, unique=True, index=True
    )

    # What happened
    action: Mapped[str] = mapped_column(
        String(100), nullable=False, index=True
    )  # e.g., "mark.saved", "evaluation.completed", "flag.raised"

    # Who did it
    actor_id: Mapped[UUID | None] = mapped_column(
        PGUUID(as_uuid=True), nullable=True
    )
    actor_role: Mapped[str] = mapped_column(String(50), nullable=False, default="system")

    # What changed
    payload: Mapped[dict] = mapped_column(JSONB, nullable=False, default=dict)

    # Hash chain
    previous_hash: Mapped[str] = mapped_column(
        String(64), nullable=False
    )  # SHA-256 hex
    entry_hash: Mapped[str] = mapped_column(
        String(64), nullable=False, unique=True
    )  # SHA-256 hex

    # Ed25519 signature
    signature: Mapped[str] = mapped_column(
        Text, nullable=False
    )  # Base64-encoded signature
    signing_key_id: Mapped[str] = mapped_column(
        String(50), nullable=False
    )  # Key identifier

    # Timestamp
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    def __repr__(self) -> str:
        return f"<AuditEntry #{self.sequence_number} action={self.action}>"
