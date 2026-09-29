"""Evaluation API schemas."""

from __future__ import annotations

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field


# ── Evaluation ──


class EvaluationAssign(BaseModel):
    """Assign a script to an examiner for evaluation."""

    script_id: UUID
    examiner_id: UUID
    evaluation_type: str = Field(
        default="primary", pattern="^(primary|secondary)$"
    )


class EvaluationResponse(BaseModel):
    id: UUID
    script_id: UUID
    examiner_id: UUID
    paper_id: UUID
    evaluation_type: str
    status: str
    total_marks: float | None
    total_time_seconds: int
    started_at: datetime | None
    completed_at: datetime | None
    created_at: datetime
    updated_at: datetime
    answer_marks: list["AnswerMarkResponse"] = []

    model_config = {"from_attributes": True}


class EvaluationListResponse(BaseModel):
    items: list[EvaluationResponse]
    total: int
    page: int
    page_size: int
    total_pages: int


class EvaluationStart(BaseModel):
    """Start an evaluation session (sets started_at)."""

    pass


class EvaluationSubmit(BaseModel):
    """Submit a completed evaluation for finalization."""

    total_time_seconds: int = Field(default=0, ge=0)


# ── Answer Mark ──


class MarkSave(BaseModel):
    """Save a mark for a single question.

    This is the core marking action. The mark is ALWAYS the human's decision.
    """

    question_id: UUID
    region_id: UUID | None = None
    mark: float = Field(..., ge=0)
    time_spent_seconds: int = Field(default=0, ge=0)


class MarkOverride(BaseModel):
    """Override a mark with a reason (when diverging from AI suggestion)."""

    mark: float = Field(..., ge=0)
    reason: str = Field(..., min_length=1, max_length=500)


class AnswerMarkResponse(BaseModel):
    id: UUID
    evaluation_id: UUID
    question_id: UUID
    region_id: UUID | None
    mark: float | None
    is_marked: bool
    ai_band_min: float | None
    ai_band_max: float | None
    ai_confidence: float | None
    ai_reasons: dict | None
    is_override: bool
    override_reason: str | None
    transcription: str
    transcription_confidence: float
    has_flag: bool
    time_spent_seconds: int
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


# ── AI Suggestion ──


class AISuggestionRequest(BaseModel):
    """Request an AI score suggestion for an answer."""

    evaluation_id: UUID
    question_id: UUID
    region_id: UUID | None = None


class AISuggestionResponse(BaseModel):
    """AI-generated score suggestion (read-only, never authoritative)."""

    question_id: UUID
    band_min: float
    band_max: float
    confidence: float
    reasons: list[str]
    calibration_source: str
    prompt_version: str


# ── Workspace ──


class WorkspaceResponse(BaseModel):
    """Full evaluation workspace data — everything needed to render the UI."""

    evaluation: EvaluationResponse
    script: "ScriptSummary"
    paper: "PaperSummary"
    questions: list["QuestionSummary"]
    pages: list["PageSummary"]
    marks: list[AnswerMarkResponse]


class ScriptSummary(BaseModel):
    id: UUID
    barcode: str
    page_count: int
    status: str


class PaperSummary(BaseModel):
    id: UUID
    name: str
    code: str
    total_marks: float
    passing_marks: float
    increment: float
    language: str
    ai_suggestions_enabled: bool


class QuestionSummary(BaseModel):
    id: UUID
    question_number: int
    sub_part: str
    text: str
    max_marks: float
    answer_type: str
    rubric: str
    order_index: int


class PageSummary(BaseModel):
    id: UUID
    page_number: int
    width: int
    height: int
    regions: list["RegionSummary"]


class RegionSummary(BaseModel):
    id: UUID
    page_id: UUID
    question_id: UUID | None
    bbox_x: float
    bbox_y: float
    bbox_w: float
    bbox_h: float
    transcription: str
    transcription_confidence: float
    has_diagram: bool
    is_blank: bool
    storage_key: str | None
