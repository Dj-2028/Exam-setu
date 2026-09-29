"""Results API schemas."""

from __future__ import annotations

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field


class ResultEntryResponse(BaseModel):
    id: UUID
    script_id: UUID
    paper_id: UUID
    barcode: str
    primary_total: float
    secondary_total: float | None
    final_total: float
    max_marks: float
    percentage: float
    passed: bool
    is_moderated: bool
    has_flags: bool
    question_marks: dict | None
    finalized_at: datetime | None
    created_at: datetime

    model_config = {"from_attributes": True}


class ResultListResponse(BaseModel):
    items: list[ResultEntryResponse]
    total: int
    page: int
    page_size: int
    total_pages: int


class ResultSummaryResponse(BaseModel):
    paper_id: str
    total_results: int
    passed: int
    failed: int
    pass_rate: float
    avg_marks: float
    highest: float
    lowest: float
    moderated_count: int
    flagged_count: int


class ExportJobResponse(BaseModel):
    id: UUID
    paper_id: UUID
    format: str
    status: str
    storage_key: str
    row_count: int
    error: str | None
    created_at: datetime
    completed_at: datetime | None

    model_config = {"from_attributes": True}


class ExportRequest(BaseModel):
    format: str = Field(default="csv", pattern="^(csv|xlsx|pdf)$")
