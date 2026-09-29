"""Exam, Paper, and Question API schemas."""

from __future__ import annotations

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field


# ── Exam ──


class ExamCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    code: str = Field(..., min_length=1, max_length=50)
    session: str = Field(default="", max_length=50)


class ExamUpdate(BaseModel):
    name: str | None = Field(None, min_length=1, max_length=255)
    session: str | None = Field(None, max_length=50)
    status: str | None = Field(
        None, pattern="^(draft|active|completed|archived)$"
    )


class ExamResponse(BaseModel):
    id: UUID
    name: str
    code: str
    session: str
    status: str
    created_at: datetime
    updated_at: datetime
    paper_count: int = 0

    model_config = {"from_attributes": True}


class ExamListResponse(BaseModel):
    items: list[ExamResponse]
    total: int
    page: int
    page_size: int
    total_pages: int


# ── Paper ──


class PaperCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    code: str = Field(..., min_length=1, max_length=50)
    total_marks: float = Field(default=100.0, gt=0)
    passing_marks: float = Field(default=33.0, ge=0)
    increment: float = Field(default=0.5, gt=0)
    language: str = Field(default="en", pattern="^(en|hi|mixed)$")
    moderation_threshold: float = Field(default=0.15, ge=0, le=1)
    ai_suggestions_enabled: bool = True


class PaperUpdate(BaseModel):
    name: str | None = Field(None, min_length=1, max_length=255)
    total_marks: float | None = Field(None, gt=0)
    passing_marks: float | None = Field(None, ge=0)
    increment: float | None = Field(None, gt=0)
    language: str | None = Field(None, pattern="^(en|hi|mixed)$")
    status: str | None = None
    moderation_threshold: float | None = Field(None, ge=0, le=1)
    ai_suggestions_enabled: bool | None = None


class PaperResponse(BaseModel):
    id: UUID
    exam_id: UUID
    name: str
    code: str
    total_marks: float
    passing_marks: float
    increment: float
    language: str
    status: str
    moderation_threshold: float
    ai_suggestions_enabled: bool
    created_at: datetime
    updated_at: datetime
    question_count: int = 0

    model_config = {"from_attributes": True}


class PaperListResponse(BaseModel):
    items: list[PaperResponse]
    total: int
    page: int
    page_size: int
    total_pages: int


# ── Question ──


class QuestionCreate(BaseModel):
    question_number: int = Field(..., ge=1)
    sub_part: str = Field(default="", max_length=10)
    text: str = Field(default="")
    max_marks: float = Field(..., gt=0)
    answer_type: str = Field(
        default="text",
        pattern="^(text|text_with_diagram|diagram_only|numerical|mcq)$",
    )
    rubric: str = ""
    model_answer: str = ""
    order_index: int = 0
    expected_pages_min: int = Field(default=1, ge=1)
    expected_pages_max: int = Field(default=2, ge=1)


class QuestionUpdate(BaseModel):
    text: str | None = None
    max_marks: float | None = Field(None, gt=0)
    answer_type: str | None = Field(
        None,
        pattern="^(text|text_with_diagram|diagram_only|numerical|mcq)$",
    )
    rubric: str | None = None
    model_answer: str | None = None
    order_index: int | None = None
    expected_pages_min: int | None = Field(None, ge=1)
    expected_pages_max: int | None = Field(None, ge=1)


class QuestionResponse(BaseModel):
    id: UUID
    paper_id: UUID
    question_number: int
    sub_part: str
    text: str
    max_marks: float
    answer_type: str
    rubric: str
    model_answer: str
    order_index: int
    expected_pages_min: int
    expected_pages_max: int
    created_at: datetime

    model_config = {"from_attributes": True}


class QuestionListResponse(BaseModel):
    items: list[QuestionResponse]
    total: int


class QuestionBulkCreate(BaseModel):
    """Create multiple questions at once (for paper setup)."""

    questions: list[QuestionCreate]
