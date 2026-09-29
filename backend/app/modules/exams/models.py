"""Exam, Paper, and Question models."""

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


class Exam(Base):
    """Top-level examination container (e.g., "B.Sc Physics Sem-4 June 2026")."""

    __tablename__ = "exams"

    id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True), primary_key=True, default=new_id
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    code: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    session: Mapped[str] = mapped_column(
        String(50), nullable=False, default=""
    )  # e.g., "June 2026"
    status: Mapped[str] = mapped_column(
        Enum("draft", "active", "completed", "archived", name="exam_status"),
        default="draft",
        nullable=False,
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
    papers: Mapped[list["Paper"]] = relationship(
        "Paper", back_populates="exam", cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return f"<Exam {self.code}: {self.name}>"


class Paper(Base):
    """A paper within an exam (e.g., "PHY-401 Quantum Mechanics").

    Contains the question template and evaluation config.
    """

    __tablename__ = "papers"

    id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True), primary_key=True, default=new_id
    )
    exam_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("exams.id"), nullable=False, index=True
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    code: Mapped[str] = mapped_column(String(50), nullable=False)
    total_marks: Mapped[float] = mapped_column(Float, nullable=False, default=100.0)
    passing_marks: Mapped[float] = mapped_column(Float, nullable=False, default=33.0)
    increment: Mapped[float] = mapped_column(
        Float, nullable=False, default=0.5
    )  # Mark increment (0.5 or 1.0)
    language: Mapped[str] = mapped_column(
        String(10), nullable=False, default="en"
    )  # "en" | "hi" | "mixed"
    status: Mapped[str] = mapped_column(
        Enum(
            "draft",
            "questions_set",
            "scripts_uploaded",
            "evaluation_in_progress",
            "evaluation_complete",
            "results_finalized",
            name="paper_status",
        ),
        default="draft",
        nullable=False,
    )

    # Evaluation config
    moderation_threshold: Mapped[float] = mapped_column(
        Float, nullable=False, default=0.15
    )  # % deviation to trigger second evaluation
    ai_suggestions_enabled: Mapped[bool] = mapped_column(
        Boolean, default=True, nullable=False
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
    exam: Mapped["Exam"] = relationship("Exam", back_populates="papers")
    questions: Mapped[list["Question"]] = relationship(
        "Question", back_populates="paper", cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return f"<Paper {self.code}: {self.name}>"


class Question(Base):
    """A question in a paper's marking template.

    Defines max marks, expected answer type, and optional rubric/model answer.
    """

    __tablename__ = "questions"

    id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True), primary_key=True, default=new_id
    )
    paper_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("papers.id"), nullable=False, index=True
    )
    question_number: Mapped[int] = mapped_column(Integer, nullable=False)
    sub_part: Mapped[str] = mapped_column(
        String(10), nullable=False, default=""
    )  # e.g., "a", "b", "i", "ii"
    text: Mapped[str] = mapped_column(Text, nullable=False, default="")
    max_marks: Mapped[float] = mapped_column(Float, nullable=False)
    answer_type: Mapped[str] = mapped_column(
        Enum(
            "text",
            "text_with_diagram",
            "diagram_only",
            "numerical",
            "mcq",
            name="answer_type",
        ),
        default="text",
        nullable=False,
    )
    rubric: Mapped[str] = mapped_column(Text, nullable=False, default="")
    model_answer: Mapped[str] = mapped_column(Text, nullable=False, default="")
    order_index: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    # Expected page range (helps the segmentation algorithm)
    expected_pages_min: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    expected_pages_max: Mapped[int] = mapped_column(Integer, nullable=False, default=2)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    # Relationships
    paper: Mapped["Paper"] = relationship("Paper", back_populates="questions")

    def __repr__(self) -> str:
        label = f"Q{self.question_number}"
        if self.sub_part:
            label += f"({self.sub_part})"
        return f"<Question {label} max={self.max_marks}>"
