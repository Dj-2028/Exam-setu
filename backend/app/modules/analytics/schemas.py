"""Analytics API schemas."""

from __future__ import annotations

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel


class ExaminerMetricsResponse(BaseModel):
    id: UUID
    examiner_id: UUID
    paper_id: UUID
    scripts_evaluated: int
    scripts_pending: int
    avg_time_per_script_seconds: float
    avg_time_per_question_seconds: float
    avg_total_marks: float
    std_dev_total_marks: float
    mark_distribution: dict | None
    ai_suggestions_requested: int
    ai_suggestions_accepted: int
    ai_overrides: int
    avg_ai_divergence: float
    speed_anomaly_score: float
    uniformity_anomaly_score: float
    outlier_anomaly_score: float
    overall_anomaly_score: float
    updated_at: datetime

    model_config = {"from_attributes": True}


class ExaminerMetricsListResponse(BaseModel):
    items: list[ExaminerMetricsResponse]
    total: int
    page: int
    page_size: int
    total_pages: int


class PaperAnalyticsResponse(BaseModel):
    paper_id: str
    examiner_count: int
    total_evaluated: int
    total_pending: int
    avg_marks_overall: float
    avg_time_per_script: float | None = None
    anomalous_examiners: list[dict]
    examiners: list[dict]
