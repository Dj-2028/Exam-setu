"""Results API routes — tabulation, results, and export."""

from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, Depends, Query
from fastapi.responses import RedirectResponse

from app.core.deps import AuthenticatedUser, DBSession
from app.core.security import require_roles
from app.modules.results.schemas import (
    ExportJobResponse,
    ExportRequest,
    ResultEntryResponse,
    ResultListResponse,
    ResultSummaryResponse,
)
from app.modules.results.service import ResultsService

router = APIRouter(prefix="/results", tags=["results"])


@router.post(
    "/tabulate/{paper_id}",
    response_model=list[ResultEntryResponse],
    dependencies=[Depends(require_roles("admin", "controller"))],
)
async def tabulate_paper(paper_id: UUID, db: DBSession):
    """Compute final results for all scripts in a paper."""
    svc = ResultsService(db)
    results = await svc.tabulate_paper(paper_id)
    return [ResultEntryResponse.model_validate(r) for r in results]


@router.get(
    "/{paper_id}",
    response_model=ResultListResponse,
    dependencies=[Depends(require_roles("admin", "controller"))],
)
async def list_results(
    paper_id: UUID,
    db: DBSession,
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=50, ge=1, le=200),
):
    """List finalized results for a paper."""
    svc = ResultsService(db)
    results, total = await svc.get_results(paper_id, page=page, page_size=page_size)
    total_pages = (total + page_size - 1) // page_size if page_size > 0 else 0
    return ResultListResponse(
        items=[ResultEntryResponse.model_validate(r) for r in results],
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
    )


@router.get(
    "/{paper_id}/summary",
    response_model=ResultSummaryResponse,
    dependencies=[Depends(require_roles("admin", "controller"))],
)
async def get_summary(paper_id: UUID, db: DBSession):
    """Get result summary statistics for a paper."""
    svc = ResultsService(db)
    summary = await svc.get_summary(paper_id)
    return ResultSummaryResponse(**summary)


@router.post(
    "/{paper_id}/export",
    response_model=ExportJobResponse,
    dependencies=[Depends(require_roles("admin", "controller"))],
)
async def create_export(
    paper_id: UUID,
    data: ExportRequest,
    db: DBSession,
    current_user: AuthenticatedUser,
):
    """Generate an export file (CSV/XLSX/PDF)."""
    from app.modules.users.service import UserService

    user_svc = UserService(db)
    user = await user_svc.get_user_by_clerk_id(current_user.uid)

    svc = ResultsService(db)
    job = await svc.generate_export(
        paper_id, data.format, requested_by_id=user.id if user else None
    )
    return ExportJobResponse.model_validate(job)


@router.get(
    "/exports/{job_id}",
    response_model=ExportJobResponse,
    dependencies=[Depends(require_roles("admin", "controller"))],
)
async def get_export(job_id: UUID, db: DBSession):
    """Check export job status."""
    svc = ResultsService(db)
    job = await svc.get_export_job(job_id)
    return ExportJobResponse.model_validate(job)


@router.get(
    "/exports/{job_id}/download",
    dependencies=[Depends(require_roles("admin", "controller"))],
)
async def download_export(job_id: UUID, db: DBSession):
    """Get a pre-signed download URL for a completed export."""
    svc = ResultsService(db)
    job = await svc.get_export_job(job_id)

    if job.status != "ready":
        from app.core.errors import BadRequestError
        raise BadRequestError(f"Export is not ready (status: {job.status}).")

    from app.integrations.storage.r2 import get_storage_client
    storage = get_storage_client()
    download_url = await storage.generate_download_url(job.storage_key, expires_in=3600)

    return RedirectResponse(url=download_url)
