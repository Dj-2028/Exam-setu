"""Script service — upload management and processing orchestration."""

from __future__ import annotations

from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.errors import BadRequestError, ConflictError, NotFoundError
from app.core.logging import get_logger
from app.core.utils import new_id
from app.integrations.storage.r2 import get_storage_client
from app.modules.scripts.models import Page, Region, Script
from app.modules.scripts.schemas import ScriptUploadRequest

logger = get_logger(__name__)


class ScriptService:
    """Business logic for script upload and processing orchestration."""

    def __init__(self, db: AsyncSession) -> None:
        self._db = db

    # ── Upload Flow ──

    async def initiate_upload(
        self, data: ScriptUploadRequest
    ) -> tuple[Script, str]:
        """Create a script record and generate a pre-signed upload URL.

        Returns: (script, upload_url)
        """
        # Check for duplicate barcode
        existing = await self._db.execute(
            select(Script).where(Script.barcode == data.barcode)
        )
        if existing.scalar_one_or_none():
            raise ConflictError(
                f"Script with barcode '{data.barcode}' already exists."
            )

        # Generate storage key
        script_id = new_id()
        storage_key = f"scripts/{data.paper_id}/{script_id}/original.pdf"

        # Create script record
        script = Script(
            id=script_id,
            paper_id=data.paper_id,
            barcode=data.barcode,
            storage_key=storage_key,
            status="uploaded",
        )
        self._db.add(script)
        await self._db.commit()
        await self._db.refresh(script)

        # Generate pre-signed upload URL
        storage = get_storage_client()
        upload_url = await storage.generate_upload_url(
            key=storage_key,
            content_type=data.content_type,
            expires_in=3600,
        )

        logger.info(
            "script_upload_initiated",
            script_id=str(script.id),
            barcode=script.barcode,
        )
        return script, upload_url

    async def confirm_upload(self, script_id: UUID, page_count: int = 0) -> Script:
        """Confirm upload is complete and trigger processing pipeline."""
        script = await self.get_script(script_id)

        if script.status != "uploaded":
            raise BadRequestError(
                f"Script is in status '{script.status}', expected 'uploaded'."
            )

        script.status = "splitting"
        if page_count > 0:
            script.page_count = page_count

        await self._db.commit()
        await self._db.refresh(script)

        logger.info(
            "script_upload_confirmed",
            script_id=str(script.id),
            barcode=script.barcode,
        )
        return script

    # ── Queries ──

    async def get_script(self, script_id: UUID) -> Script:
        result = await self._db.execute(
            select(Script)
            .options(
                selectinload(Script.pages).selectinload(Page.regions)
            )
            .where(Script.id == script_id)
        )
        script = result.scalar_one_or_none()
        if not script:
            raise NotFoundError(f"Script {script_id} not found.")
        return script

    async def get_script_by_barcode(self, barcode: str) -> Script:
        result = await self._db.execute(
            select(Script).where(Script.barcode == barcode)
        )
        script = result.scalar_one_or_none()
        if not script:
            raise NotFoundError(f"Script with barcode '{barcode}' not found.")
        return script

    async def list_scripts(
        self,
        paper_id: UUID | None = None,
        status: str | None = None,
        page: int = 1,
        page_size: int = 20,
    ) -> tuple[list[Script], int]:
        query = select(Script)
        count_query = select(func.count()).select_from(Script)

        if paper_id:
            query = query.where(Script.paper_id == paper_id)
            count_query = count_query.where(Script.paper_id == paper_id)
        if status:
            query = query.where(Script.status == status)
            count_query = count_query.where(Script.status == status)

        total_result = await self._db.execute(count_query)
        total = total_result.scalar() or 0

        offset = (page - 1) * page_size
        query = query.order_by(Script.created_at.desc()).offset(offset).limit(page_size)
        result = await self._db.execute(query)
        scripts = list(result.scalars().all())

        return scripts, total

    # ── Processing Status Updates (called by workers) ──

    async def update_status(
        self,
        script_id: UUID,
        status: str,
        error: str | None = None,
    ) -> Script:
        """Update script processing status (called by pipeline workers)."""
        result = await self._db.execute(
            select(Script).where(Script.id == script_id)
        )
        script = result.scalar_one_or_none()
        if not script:
            raise NotFoundError(f"Script {script_id} not found.")

        script.status = status
        if error:
            script.processing_error = error

        await self._db.commit()
        await self._db.refresh(script)

        logger.info(
            "script_status_updated",
            script_id=str(script.id),
            status=status,
        )
        return script

    async def add_page(
        self,
        script_id: UUID,
        page_number: int,
        storage_key: str,
        width: int,
        height: int,
        storage_key_original: str | None = None,
    ) -> Page:
        """Add a processed page to a script (called by splitting worker)."""
        page = Page(
            script_id=script_id,
            page_number=page_number,
            storage_key=storage_key,
            storage_key_original=storage_key_original,
            width=width,
            height=height,
        )
        self._db.add(page)
        await self._db.commit()
        await self._db.refresh(page)
        return page

    async def add_region(
        self,
        page_id: UUID,
        question_id: UUID | None,
        bbox: tuple[float, float, float, float],
        order_index: int = 0,
    ) -> Region:
        """Add a detected region to a page (called by segmentation worker)."""
        region = Region(
            page_id=page_id,
            question_id=question_id,
            bbox_x=bbox[0],
            bbox_y=bbox[1],
            bbox_w=bbox[2],
            bbox_h=bbox[3],
            order_index=order_index,
        )
        self._db.add(region)
        await self._db.commit()
        await self._db.refresh(region)
        return region

    async def update_region_transcription(
        self,
        region_id: UUID,
        transcription: str,
        confidence: float,
        language: str,
    ) -> Region:
        """Update a region with OCR transcription results."""
        result = await self._db.execute(
            select(Region).where(Region.id == region_id)
        )
        region = result.scalar_one_or_none()
        if not region:
            raise NotFoundError(f"Region {region_id} not found.")

        region.transcription = transcription
        region.transcription_confidence = confidence
        region.language_detected = language

        await self._db.commit()
        await self._db.refresh(region)
        return region

    async def update_region_diagram(
        self,
        region_id: UUID,
        has_diagram: bool,
        description: str = "",
    ) -> Region:
        """Update a region with diagram detection results."""
        result = await self._db.execute(
            select(Region).where(Region.id == region_id)
        )
        region = result.scalar_one_or_none()
        if not region:
            raise NotFoundError(f"Region {region_id} not found.")

        region.has_diagram = has_diagram
        region.diagram_description = description

        await self._db.commit()
        await self._db.refresh(region)
        return region

    async def mark_region_blank(self, region_id: UUID) -> Region:
        """Mark a region as blank (no answer written)."""
        result = await self._db.execute(
            select(Region).where(Region.id == region_id)
        )
        region = result.scalar_one_or_none()
        if not region:
            raise NotFoundError(f"Region {region_id} not found.")

        region.is_blank = True
        region.transcription = ""
        region.transcription_confidence = 1.0

        await self._db.commit()
        await self._db.refresh(region)
        return region

    async def get_processing_stats(self, script_id: UUID) -> dict:
        """Get processing statistics for a script."""
        script = await self.get_script(script_id)

        total_regions = 0
        transcribed_regions = 0
        for page in script.pages:
            for region in page.regions:
                total_regions += 1
                if region.transcription or region.is_blank:
                    transcribed_regions += 1

        pages_processed = len(script.pages)
        progress = 0.0
        if script.page_count > 0:
            progress = (pages_processed / script.page_count) * 50
        if total_regions > 0:
            progress += (transcribed_regions / total_regions) * 50

        return {
            "script_id": script.id,
            "barcode": script.barcode,
            "status": script.status,
            "page_count": script.page_count,
            "pages_processed": pages_processed,
            "regions_detected": total_regions,
            "regions_transcribed": transcribed_regions,
            "processing_error": script.processing_error,
            "progress_percent": round(progress, 1),
        }
