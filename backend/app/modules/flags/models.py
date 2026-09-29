"""Flag and Moderation models."""

from __future__ import annotations

from datetime import datetime
from uuid import UUID

from sqlalchemy import (
    DateTime,
    Enum,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
    Boolean,
    func,
)
from sqlalchemy.dialects.postgresql import UUID as PGUUID, JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.core.utils import new_id
from app.db.base import Base


class Flag(Base):
    """A flag raised on a script, answer, or examiner behaviour.

    Flags can be raised by:
    - The processing pipeline (blank answer, missing signature)
    - The AI layer (diagram missing, AI divergence)
    - The analytics engine (uniform marks, fast marking, outlier)
    - A human (manual escalation)
    """

    __tablename__ = "flags"

    id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True), primary_key=True, default=new_id
    )
    flag_type: Mapped[str] = mapped_column(
        Enum(
            "blank_answer",
            "skipped_question",
            "missing_signature",
            "diagram_missing",
            "examiner_outlier",
            "uniform_marks",
            "fast_marking",
            "ai_divergence",
            "manual",
            name="flag_type",
        ),
        nullable=False,
    )
    severity: Mapped[str] = mapped_column(
        Enum("low", "medium", "high", name="flag_severity"),
        nullable=False,
        default="medium",
    )
    status: Mapped[str] = mapped_column(
        Enum("open", "acknowledged", "dismissed", "escalated", name="flag_status"),
        nullable=False,
        default="open",
        index=True,
    )

    # Target (polymorphic — one of these will be set)
    script_id: Mapped[UUID | None] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("scripts.id"), nullable=True, index=True
    )
    evaluation_id: Mapped[UUID | None] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("evaluations.id"), nullable=True
    )
    answer_mark_id: Mapped[UUID | None] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("answer_marks.id"), nullable=True
    )
    examiner_id: Mapped[UUID | None] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("users.id"), nullable=True
    )
    paper_id: Mapped[UUID | None] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("papers.id"), nullable=True, index=True
    )

    # Details
    message: Mapped[str] = mapped_column(Text, nullable=False, default="")
    details: Mapped[dict | None] = mapped_column(JSONB, nullable=True)

    # Resolution
    resolved_by_id: Mapped[UUID | None] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("users.id"), nullable=True
    )
    resolution_note: Mapped[str] = mapped_column(Text, nullable=True)
    resolved_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    raised_by: Mapped[str] = mapped_column(
        String(50), nullable=False, default="system"
    )  # "system" | "ai" | "examiner" | "controller"

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    def __repr__(self) -> str:
        return f"<Flag {self.flag_type} severity={self.severity} status={self.status}>"


class ModerationCase(Base):
    """A moderation case created when a script needs second evaluation.

    Tracks the risk score, routing decision, and reconciliation outcome.
    """

    __tablename__ = "moderation_cases"

    id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True), primary_key=True, default=new_id
    )
    script_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("scripts.id"), nullable=False, index=True
    )
    paper_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("papers.id"), nullable=False, index=True
    )

    # Risk assessment
    risk_score: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    risk_factors: Mapped[dict | None] = mapped_column(JSONB, nullable=True)

    # First evaluation reference
    primary_evaluation_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("evaluations.id"), nullable=False
    )
    primary_total: Mapped[float] = mapped_column(Float, nullable=False)

    # Second evaluation (assigned after routing)
    secondary_evaluation_id: Mapped[UUID | None] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("evaluations.id"), nullable=True
    )
    secondary_examiner_id: Mapped[UUID | None] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("users.id"), nullable=True
    )
    secondary_total: Mapped[float | None] = mapped_column(Float, nullable=True)

    # Reconciliation
    status: Mapped[str] = mapped_column(
        Enum(
            "pending_routing",
            "routed",
            "second_in_progress",
            "pending_reconciliation",
            "reconciled",
            name="moderation_status",
        ),
        default="pending_routing",
        nullable=False,
        index=True,
    )
    reconciled_by_id: Mapped[UUID | None] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("users.id"), nullable=True
    )
    final_total: Mapped[float | None] = mapped_column(Float, nullable=True)
    reconciliation_method: Mapped[str | None] = mapped_column(
        String(50), nullable=True
    )  # "average" | "higher" | "manual"
    reconciliation_note: Mapped[str] = mapped_column(Text, nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    def __repr__(self) -> str:
        return f"<ModerationCase script={self.script_id} status={self.status}>"
