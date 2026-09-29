"""Analytics API routes — examiner metrics and anomaly detection."""

from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, Depends, Query

from app.core.deps import DBSession
from app.core.security import require_roles
from app.modules.analytics.schemas import (
    ExaminerMetricsListResponse,
    ExaminerMetricsResponse,
    PaperAnalyticsResponse,
)
from app.modules.analytics.service import AnalyticsService

router = APIRouter(prefix="/analytics", tags=["analytics"])


@router.get(
    "/paper/{paper_id}",
    response_model=PaperAnalyticsResponse,
    dependencies=[Depends(require_roles("controller", "admin"))],
)
async def get_paper_analytics(paper_id: UUID, db: DBSession):
    """Get aggregate analytics for a paper across all examiners."""
    svc = AnalyticsService(db)
    data = await svc.get_paper_analytics(paper_id)
    return PaperAnalyticsResponse(**data)


@router.post(
    "/compute/{examiner_id}/{paper_id}",
    response_model=ExaminerMetricsResponse,
    dependencies=[Depends(require_roles("controller", "admin"))],
)
async def compute_metrics(examiner_id: UUID, paper_id: UUID, db: DBSession):
    """Recompute metrics for a specific examiner on a paper."""
    svc = AnalyticsService(db)
    metrics = await svc.compute_examiner_metrics(examiner_id, paper_id)
    return ExaminerMetricsResponse.model_validate(metrics)


@router.get(
    "/examiners",
    response_model=ExaminerMetricsListResponse,
    dependencies=[Depends(require_roles("controller", "admin"))],
)
async def list_examiner_metrics(
    db: DBSession,
    paper_id: UUID | None = Query(default=None),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
):
    """List examiner metrics ranked by anomaly score."""
    svc = AnalyticsService(db)
    metrics, total = await svc.list_examiner_metrics(
        paper_id=paper_id, page=page, page_size=page_size
    )
    total_pages = (total + page_size - 1) // page_size if page_size > 0 else 0
    return ExaminerMetricsListResponse(
        items=[ExaminerMetricsResponse.model_validate(m) for m in metrics],
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
    )
