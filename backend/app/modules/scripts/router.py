"""Script API routes — upload, status, and management."""

from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, Depends, Query

from app.core.deps import AuthenticatedUser, DBSession
from app.core.security import require_roles
from app.modules.scripts.schemas import (
    ProcessingStatusResponse,
    ScriptConfirmUpload,
    ScriptListResponse,
    ScriptResponse,
    ScriptUploadRequest,
    ScriptUploadResponse,
    PageResponse,
    RegionResponse,
)
from app.modules.scripts.service import ScriptService

router = APIRouter(prefix="/scripts", tags=["scripts"])


@router.post(
    "/upload",
    response_model=ScriptUploadResponse,
    status_code=201,
    dependencies=[Depends(require_roles("admin", "controller"))],
)
async def initiate_upload(data: ScriptUploadRequest, db: DBSession):
    """Initiate a script upload — returns a pre-signed URL for direct upload to R2."""
    svc = ScriptService(db)
    script, upload_url = await svc.initiate_upload(data)
    return ScriptUploadResponse(
        script_id=script.id,
        upload_url=upload_url,
        storage_key=script.storage_key,
    )


@router.post(
    "/{script_id}/confirm",
    response_model=ScriptResponse,
    dependencies=[Depends(require_roles("admin", "controller"))],
)
async def confirm_upload(
    script_id: UUID, data: ScriptConfirmUpload, db: DBSession
):
    """Confirm upload is complete and trigger the processing pipeline."""
    svc = ScriptService(db)
    script = await svc.confirm_upload(script_id, data.page_count)

    # Enqueue the processing pipeline
    # TODO: await arq_pool.enqueue_job("process_script", str(script.id))

    return _to_response(script)


@router.get("", response_model=ScriptListResponse)
async def list_scripts(
    db: DBSession,
    current_user: AuthenticatedUser,
    paper_id: UUID | None = Query(default=None),
    status: str | None = Query(default=None),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
):
    """List scripts with optional filters."""
    svc = ScriptService(db)
    scripts, total = await svc.list_scripts(
        paper_id=paper_id, status=status, page=page, page_size=page_size
    )
    total_pages = (total + page_size - 1) // page_size if page_size > 0 else 0
    return ScriptListResponse(
        items=[_to_response(s) for s in scripts],
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
    )


@router.get("/{script_id}", response_model=ScriptResponse)
async def get_script(
    script_id: UUID, db: DBSession, current_user: AuthenticatedUser
):
    """Get a specific script with its pages and regions."""
    svc = ScriptService(db)
    script = await svc.get_script(script_id)
    return _to_response(script)


@router.get("/{script_id}/status", response_model=ProcessingStatusResponse)
async def get_processing_status(
    script_id: UUID, db: DBSession, current_user: AuthenticatedUser
):
    """Get detailed processing status for a script."""
    svc = ScriptService(db)
    stats = await svc.get_processing_stats(script_id)
    return ProcessingStatusResponse(**stats)


@router.post(
    "/{script_id}/reprocess",
    response_model=ScriptResponse,
    dependencies=[Depends(require_roles("admin"))],
)
async def reprocess_script(script_id: UUID, db: DBSession):
    """Reprocess a failed script (admin only)."""
    svc = ScriptService(db)
    script = await svc.update_status(script_id, "splitting", error=None)

    # Re-enqueue the processing pipeline
    # TODO: await arq_pool.enqueue_job("process_script", str(script.id))

    return _to_response(script)


def _to_response(script) -> ScriptResponse:
    """Convert a Script model to API response."""
    pages = []
    if hasattr(script, "pages") and script.pages:
        for p in sorted(script.pages, key=lambda x: x.page_number):
            regions = []
            if hasattr(p, "regions") and p.regions:
                regions = [
                    RegionResponse.model_validate(r)
                    for r in sorted(p.regions, key=lambda x: x.order_index)
                ]
            pages.append(
                PageResponse(
                    id=p.id,
                    script_id=p.script_id,
                    page_number=p.page_number,
                    width=p.width,
                    height=p.height,
                    created_at=p.created_at,
                    regions=regions,
                )
            )

    return ScriptResponse(
        id=script.id,
        paper_id=script.paper_id,
        barcode=script.barcode,
        page_count=script.page_count,
        status=script.status,
        processing_error=script.processing_error,
        created_at=script.created_at,
        updated_at=script.updated_at,
        pages=pages,
    )
