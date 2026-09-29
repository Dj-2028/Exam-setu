"""Flag and Moderation API schemas."""

from __future__ import annotations

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field


# ── Flag ──


class FlagCreate(BaseModel):
    flag_type: str = Field(
        ...,
        pattern="^(blank_answer|skipped_question|missing_signature|diagram_missing|examiner_outlier|uniform_marks|fast_marking|ai_divergence|manual)$",
    )
    severity: str = Field(default="medium", pattern="^(low|medium|high)$")
    message: str = Field(..., min_length=1, max_length=1000)
    script_id: UUID | None = None
    evaluation_id: UUID | None = None
    answer_mark_id: UUID | None = None
    examiner_id: UUID | None = None
    paper_id: UUID | None = None
    details: dict | None = None
    raised_by: str = Field(default="system", pattern="^(system|ai|examiner|controller)$")


class FlagResolve(BaseModel):
    status: str = Field(..., pattern="^(acknowledged|dismissed|escalated)$")
    resolution_note: str = Field(default="", max_length=1000)


class FlagResponse(BaseModel):
    id: UUID
    flag_type: str
    severity: str
    status: str
    script_id: UUID | None
    evaluation_id: UUID | None
    answer_mark_id: UUID | None
    examiner_id: UUID | None
    paper_id: UUID | None
    message: str
    details: dict | None
    raised_by: str
    resolved_by_id: UUID | None
    resolution_note: str | None
    resolved_at: datetime | None
    created_at: datetime

    model_config = {"from_attributes": True}


class FlagListResponse(BaseModel):
    items: list[FlagResponse]
    total: int
    page: int
    page_size: int
    total_pages: int


# ── Moderation ──


class ModerationRouteRequest(BaseModel):
    """Route a moderation case to a second examiner."""
    secondary_examiner_id: UUID


class ModerationReconcile(BaseModel):
    """Reconcile a moderation case (controller action)."""
    method: str = Field(..., pattern="^(average|higher|manual)$")
    final_total: float = Field(..., ge=0)
    note: str = Field(default="", max_length=1000)


class ModerationCaseResponse(BaseModel):
    id: UUID
    script_id: UUID
    paper_id: UUID
    risk_score: float
    risk_factors: dict | None
    primary_evaluation_id: UUID
    primary_total: float
    secondary_evaluation_id: UUID | None
    secondary_examiner_id: UUID | None
    secondary_total: float | None
    status: str
    reconciled_by_id: UUID | None
    final_total: float | None
    reconciliation_method: str | None
    reconciliation_note: str | None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class ModerationListResponse(BaseModel):
    items: list[ModerationCaseResponse]
    total: int
    page: int
    page_size: int
    total_pages: int
