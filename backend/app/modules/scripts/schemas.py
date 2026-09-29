"""Script API schemas."""

from __future__ import annotations

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field


# ── Script ──


class ScriptUploadRequest(BaseModel):
    """Request to initiate a script upload (pre-signed URL flow)."""

    paper_id: UUID
    barcode: str = Field(..., min_length=1, max_length=100)
    content_type: str = Field(default="application/pdf")


class ScriptUploadResponse(BaseModel):
    """Response with the pre-signed upload URL."""

    script_id: UUID
    upload_url: str
    storage_key: str


class ScriptConfirmUpload(BaseModel):
    """Confirm that a script upload is complete (triggers processing)."""

    page_count: int = Field(default=0, ge=0)


class ScriptResponse(BaseModel):
    """Full script API response."""

    id: UUID
    paper_id: UUID
    barcode: str
    page_count: int
    status: str
    processing_error: str | None = None
    created_at: datetime
    updated_at: datetime
    pages: list["PageResponse"] = []

    model_config = {"from_attributes": True}


class ScriptListResponse(BaseModel):
    items: list[ScriptResponse]
    total: int
    page: int
    page_size: int
    total_pages: int


class ScriptBulkUploadRequest(BaseModel):
    """Bulk upload request with multiple barcodes."""

    paper_id: UUID
    barcodes: list[str] = Field(..., min_length=1)


# ── Page ──


class PageResponse(BaseModel):
    id: UUID
    script_id: UUID
    page_number: int
    width: int
    height: int
    created_at: datetime
    regions: list["RegionResponse"] = []

    model_config = {"from_attributes": True}


# ── Region ──


class RegionResponse(BaseModel):
    id: UUID
    page_id: UUID
    question_id: UUID | None
    bbox_x: float
    bbox_y: float
    bbox_w: float
    bbox_h: float
    transcription: str
    transcription_confidence: float
    language_detected: str
    has_diagram: bool
    diagram_description: str
    is_blank: bool
    order_index: int
    created_at: datetime

    model_config = {"from_attributes": True}


# ── Processing Status ──


class ProcessingStatusResponse(BaseModel):
    """Detailed processing status for a script."""

    script_id: UUID
    barcode: str
    status: str
    page_count: int
    pages_processed: int
    regions_detected: int
    regions_transcribed: int
    processing_error: str | None = None
    progress_percent: float = 0.0
