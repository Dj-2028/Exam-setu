"""Evaluation models — the core marking data.

Evaluation = one examiner evaluating one script.
AnswerMark = the mark given for one question within that evaluation.
"""

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
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.utils import new_id
from app.db.base import Base


class Evaluation(Base):
    """An evaluation assignment: one examiner → one script.

    Can be primary (first) or secondary (moderation).
    """

    __tablename__ = "evaluations"

    id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True), primary_key=True, default=new_id
    )
    script_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("scripts.id"), nullable=False, index=True
    )
    examiner_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True
    )
    paper_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("papers.id"), nullable=False, index=True
    )
    evaluation_type: Mapped[str] = mapped_column(
        Enum("primary", "secondary", name="evaluation_type"),
        default="primary",
        nullable=False,
    )
    status: Mapped[str] = mapped_column(
        Enum(
            "assigned",
            "in_progress",
            "completed",
            "submitted",
            name="evaluation_status",
        ),
        default="assigned",
        nullable=False,
        index=True,
    )
    total_marks: Mapped[float] = mapped_column(Float, nullable=True)
    started_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    completed_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    # Time tracking for anomaly detection
    total_time_seconds: Mapped[int] = mapped_column(
        Integer, nullable=False, default=0
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    # Relationships
    answer_marks: Mapped[list["AnswerMark"]] = relationship(
        "AnswerMark",
        back_populates="evaluation",
        cascade="all, delete-orphan",
    )

    def __repr__(self) -> str:
        return f"<Evaluation {self.id} script={self.script_id} status={self.status}>"


class AnswerMark(Base):
    """The mark given by an examiner for one question.

    Stores both the human-assigned mark and the AI suggestion (if any).
    The mark is ALWAYS the human's; the AI suggestion is for reference only.
    """

    __tablename__ = "answer_marks"

    id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True), primary_key=True, default=new_id
    )
    evaluation_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True),
        ForeignKey("evaluations.id"),
        nullable=False,
        index=True,
    )
    question_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True),
        ForeignKey("questions.id"),
        nullable=False,
    )
    region_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True),
        ForeignKey("regions.id"),
        nullable=True,
    )

    # ── Human-assigned mark ──
    mark: Mapped[float] = mapped_column(Float, nullable=True)
    is_marked: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)

    # ── AI suggestion (read-only reference) ──
    ai_band_min: Mapped[float] = mapped_column(Float, nullable=True)
    ai_band_max: Mapped[float] = mapped_column(Float, nullable=True)
    ai_confidence: Mapped[float] = mapped_column(Float, nullable=True)
    ai_reasons: Mapped[dict] = mapped_column(JSONB, nullable=True)
    ai_calibration_source: Mapped[str] = mapped_column(
        String(50), nullable=True
    )  # "cold_start" | "rubric" | "exemplars"
    ai_prompt_version: Mapped[str] = mapped_column(String(20), nullable=True)

    # ── Override tracking ──
    is_override: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=False
    )
    override_reason: Mapped[str] = mapped_column(Text, nullable=True)

    # ── Transcription (cached from region) ──
    transcription: Mapped[str] = mapped_column(Text, nullable=False, default="")
    transcription_confidence: Mapped[float] = mapped_column(
        Float, nullable=False, default=0.0
    )

    # ── Flags raised for this answer ──
    has_flag: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)

    # ── Timing ──
    time_spent_seconds: Mapped[int] = mapped_column(
        Integer, nullable=False, default=0
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    # Relationships
    evaluation: Mapped["Evaluation"] = relationship(
        "Evaluation", back_populates="answer_marks"
    )

    def __repr__(self) -> str:
        return f"<AnswerMark eval={self.evaluation_id} q={self.question_id} mark={self.mark}>"
