"""Script processing pipeline — background worker tasks.

Pipeline stages (idempotent):
  1. split_pdf     — PDF → individual page images
  2. clean_pages   — Deskew, denoise, contrast normalization
  3. segment_pages — Detect answer regions + map to questions
  4. detect_content — Check for diagrams, blanks
  5. transcribe_regions — OCR handwritten text (Gemini)

Each stage updates the script status and publishes SSE events.
The orchestrator (process_script) runs them in sequence.
"""

from __future__ import annotations

import asyncio
import io
from uuid import UUID

from app.core.logging import get_logger
from app.db.session import get_session_factory
from app.integrations.redis.pubsub import publish_event
from app.modules.scripts.service import ScriptService

logger = get_logger(__name__)


# ─────────────────────────── Orchestrator ───────────────────────────


async def process_script(ctx: dict, script_id: str) -> dict:
    """Main orchestrator — runs the full processing pipeline.

    This is the ARQ job entry point. It runs each stage in sequence,
    updating status after each. If any stage fails, the script is
    marked as failed and the error is recorded.
    """
    sid = UUID(script_id)
    factory = get_session_factory()

    stages = [
        ("splitting", split_pdf),
        ("cleaning", clean_pages),
        ("segmenting", segment_pages),
        ("detecting", detect_content),
        ("transcribing", transcribe_regions),
    ]

    for status, stage_fn in stages:
        try:
            async with factory() as db:
                svc = ScriptService(db)
                await svc.update_status(sid, status)

            await publish_event(
                f"script:{script_id}",
                "script.processing",
                {"script_id": script_id, "stage": status},
            )

            await stage_fn(sid)

        except Exception as e:
            logger.error(
                "pipeline_stage_failed",
                script_id=script_id,
                stage=status,
                error=str(e),
                exc_info=True,
            )
            async with factory() as db:
                svc = ScriptService(db)
                await svc.update_status(sid, status, error=str(e))

            await publish_event(
                f"script:{script_id}",
                "script.error",
                {"script_id": script_id, "stage": status, "error": str(e)},
            )
            return {"status": "failed", "stage": status, "error": str(e)}

    # Mark as ready
    async with factory() as db:
        svc = ScriptService(db)
        await svc.update_status(sid, "ready")

    await publish_event(
        f"script:{script_id}",
        "script.ready",
        {"script_id": script_id},
    )

    logger.info("pipeline_complete", script_id=script_id)
    return {"status": "ready"}


# ─────────────────────────── Stage 1: Split PDF ───────────────────────────


async def split_pdf(script_id: UUID) -> None:
    """Split a PDF into individual page images using PyMuPDF."""
    factory = get_session_factory()

    async with factory() as db:
        svc = ScriptService(db)
        script = await svc.get_script(script_id)
        storage_key = script.storage_key
        paper_id = script.paper_id

    # Download the PDF from R2
    from app.integrations.storage.r2 import get_storage_client

    storage = get_storage_client()
    pdf_bytes = await storage.download(storage_key)

    # Split using PyMuPDF (runs in executor since it's CPU-bound)
    loop = asyncio.get_event_loop()
    pages_data = await loop.run_in_executor(None, _split_pdf_sync, pdf_bytes)

    # Upload each page image and create records
    async with factory() as db:
        svc = ScriptService(db)

        for page_num, (img_bytes, width, height) in enumerate(pages_data, start=1):
            page_key = (
                f"scripts/{paper_id}/{script_id}/pages/{page_num:03d}_raw.png"
            )
            await storage.upload(page_key, img_bytes, "image/png")

            await svc.add_page(
                script_id=script_id,
                page_number=page_num,
                storage_key=page_key,
                storage_key_original=page_key,
                width=width,
                height=height,
            )

        # Update page count
        script = await svc.get_script(script_id)
        script.page_count = len(pages_data)
        await db.commit()

    logger.info(
        "split_pdf_complete",
        script_id=str(script_id),
        page_count=len(pages_data),
    )


def _split_pdf_sync(pdf_bytes: bytes) -> list[tuple[bytes, int, int]]:
    """Synchronous PDF splitting using PyMuPDF.

    Returns: list of (image_bytes, width, height)
    """
    import fitz  # PyMuPDF

    doc = fitz.open(stream=pdf_bytes, filetype="pdf")
    pages = []

    for page in doc:
        # Render at 200 DPI for good OCR quality
        mat = fitz.Matrix(200 / 72, 200 / 72)
        pix = page.get_pixmap(matrix=mat)

        img_bytes = pix.tobytes("png")
        pages.append((img_bytes, pix.width, pix.height))

    doc.close()
    return pages


# ─────────────────────────── Stage 2: Clean Pages ───────────────────────────


async def clean_pages(script_id: UUID) -> None:
    """Clean page images: deskew, denoise, contrast normalization."""
    factory = get_session_factory()
    from app.integrations.storage.r2 import get_storage_client

    storage = get_storage_client()

    async with factory() as db:
        svc = ScriptService(db)
        script = await svc.get_script(script_id)

        for page in sorted(script.pages, key=lambda p: p.page_number):
            # Download raw page
            raw_bytes = await storage.download(page.storage_key)

            # Clean the image (CPU-bound)
            loop = asyncio.get_event_loop()
            cleaned_bytes, w, h = await loop.run_in_executor(
                None, _clean_image_sync, raw_bytes
            )

            # Upload cleaned version
            clean_key = page.storage_key.replace("_raw.png", "_clean.png")
            await storage.upload(clean_key, cleaned_bytes, "image/png")

            # Update page record
            page.storage_key = clean_key
            page.width = w
            page.height = h

        await db.commit()

    logger.info("clean_pages_complete", script_id=str(script_id))


def _clean_image_sync(image_bytes: bytes) -> tuple[bytes, int, int]:
    """Synchronous image cleaning using OpenCV.

    Steps: grayscale → denoise → adaptive threshold → deskew
    Returns: (cleaned_png_bytes, width, height)
    """
    import cv2
    import numpy as np
    from PIL import Image

    # Decode image
    nparr = np.frombuffer(image_bytes, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

    if img is None:
        return image_bytes, 0, 0

    # Convert to grayscale
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

    # Denoise
    denoised = cv2.fastNlMeansDenoising(gray, h=10)

    # Contrast normalization (CLAHE)
    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
    enhanced = clahe.apply(denoised)

    # Deskew
    coords = np.column_stack(np.where(enhanced > 0))
    if len(coords) > 100:
        angle = cv2.minAreaRect(coords)[-1]
        if angle < -45:
            angle = -(90 + angle)
        else:
            angle = -angle

        # Only correct if skew is significant (> 0.5°) but not too much (< 10°)
        if 0.5 < abs(angle) < 10:
            h_img, w_img = enhanced.shape
            center = (w_img // 2, h_img // 2)
            M = cv2.getRotationMatrix2D(center, angle, 1.0)
            enhanced = cv2.warpAffine(
                enhanced,
                M,
                (w_img, h_img),
                flags=cv2.INTER_CUBIC,
                borderMode=cv2.BORDER_REPLICATE,
            )

    # Encode as PNG
    h_out, w_out = enhanced.shape
    success, encoded = cv2.imencode(".png", enhanced)
    if not success:
        return image_bytes, 0, 0

    return encoded.tobytes(), w_out, h_out


# ─────────────────────────── Stage 3: Segment Pages ───────────────────────────


async def segment_pages(script_id: UUID) -> None:
    """Detect answer regions on each page and map to questions.

    Uses contour detection to find written areas, then maps them
    to questions based on page position and the question template.
    """
    factory = get_session_factory()
    from app.integrations.storage.r2 import get_storage_client
    from sqlalchemy import select
    from app.modules.exams.models import Question

    storage = get_storage_client()

    async with factory() as db:
        svc = ScriptService(db)
        script = await svc.get_script(script_id)

        # Get questions for this paper (ordered)
        result = await db.execute(
            select(Question)
            .where(Question.paper_id == script.paper_id)
            .order_by(Question.order_index)
        )
        questions = list(result.scalars().all())

        if not questions:
            # No question template — create one region per page
            for page in sorted(script.pages, key=lambda p: p.page_number):
                await svc.add_region(
                    page_id=page.id,
                    question_id=None,
                    bbox=(0, 0, 100, 100),
                    order_index=page.page_number - 1,
                )
            return

        # Simple mapping: distribute questions across pages proportionally
        total_pages = len(script.pages)
        sorted_pages = sorted(script.pages, key=lambda p: p.page_number)
        q_idx = 0

        for page in sorted_pages:
            # Download the page for contour analysis
            page_bytes = await storage.download(page.storage_key)

            loop = asyncio.get_event_loop()
            regions_detected = await loop.run_in_executor(
                None, _detect_regions_sync, page_bytes, page.width, page.height
            )

            if regions_detected and q_idx < len(questions):
                for i, bbox in enumerate(regions_detected):
                    qid = questions[q_idx].id if q_idx < len(questions) else None
                    await svc.add_region(
                        page_id=page.id,
                        question_id=qid,
                        bbox=bbox,
                        order_index=q_idx,
                    )
                    q_idx += 1
            elif q_idx < len(questions):
                # Fallback: one region per page for remaining questions
                await svc.add_region(
                    page_id=page.id,
                    question_id=questions[q_idx].id,
                    bbox=(0, 0, 100, 100),
                    order_index=q_idx,
                )
                q_idx += 1

    logger.info("segment_pages_complete", script_id=str(script_id))


def _detect_regions_sync(
    image_bytes: bytes, page_width: int, page_height: int
) -> list[tuple[float, float, float, float]]:
    """Detect written answer regions using contour analysis.

    Returns: list of (x%, y%, w%, h%) bounding boxes
    """
    import cv2
    import numpy as np

    nparr = np.frombuffer(image_bytes, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_GRAYSCALE)

    if img is None:
        return [(0, 0, 100, 100)]

    h, w = img.shape

    # Threshold to find written areas
    _, binary = cv2.threshold(img, 200, 255, cv2.THRESH_BINARY_INV)

    # Morphological operations to merge nearby text
    kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (50, 20))
    dilated = cv2.dilate(binary, kernel, iterations=3)

    # Find contours
    contours, _ = cv2.findContours(dilated, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

    if not contours:
        return [(0, 0, 100, 100)]

    # Filter and sort contours by vertical position
    regions = []
    min_area = (w * h) * 0.02  # At least 2% of page

    for cnt in contours:
        x, y, cw, ch = cv2.boundingRect(cnt)
        area = cw * ch
        if area >= min_area:
            # Convert to percentage coordinates
            regions.append((
                (x / w) * 100,
                (y / h) * 100,
                (cw / w) * 100,
                (ch / h) * 100,
            ))

    # Sort top-to-bottom
    regions.sort(key=lambda r: r[1])

    return regions if regions else [(0, 0, 100, 100)]


# ─────────────────────────── Stage 4: Detect Content ───────────────────────────


async def detect_content(script_id: UUID) -> None:
    """Detect blank regions and check for diagrams."""
    factory = get_session_factory()
    from app.integrations.storage.r2 import get_storage_client

    storage = get_storage_client()

    async with factory() as db:
        svc = ScriptService(db)
        script = await svc.get_script(script_id)

        for page in script.pages:
            page_bytes = await storage.download(page.storage_key)

            for region in page.regions:
                # Check if blank
                loop = asyncio.get_event_loop()
                is_blank = await loop.run_in_executor(
                    None,
                    _check_blank_sync,
                    page_bytes,
                    (region.bbox_x, region.bbox_y, region.bbox_w, region.bbox_h),
                )

                if is_blank:
                    await svc.mark_region_blank(region.id)
                    continue

                # Check for diagrams (using AI if question expects one)
                if region.question_id:
                    from sqlalchemy import select
                    from app.modules.exams.models import Question

                    q_result = await db.execute(
                        select(Question).where(Question.id == region.question_id)
                    )
                    question = q_result.scalar_one_or_none()

                    if question and question.answer_type in (
                        "text_with_diagram",
                        "diagram_only",
                    ):
                        try:
                            # Crop region and check via AI
                            region_bytes = await loop.run_in_executor(
                                None,
                                _crop_region_sync,
                                page_bytes,
                                (
                                    region.bbox_x,
                                    region.bbox_y,
                                    region.bbox_w,
                                    region.bbox_h,
                                ),
                            )

                            from app.integrations.ai.router import get_ai_router

                            ai = get_ai_router()
                            checker = ai.get_diagram_checker()
                            result = await checker.check(
                                region_bytes, question.text
                            )
                            await svc.update_region_diagram(
                                region.id,
                                has_diagram=result.present,
                                description=result.description,
                            )
                        except Exception as e:
                            logger.warning(
                                "diagram_check_failed",
                                region_id=str(region.id),
                                error=str(e),
                            )

    logger.info("detect_content_complete", script_id=str(script_id))


def _check_blank_sync(
    image_bytes: bytes,
    bbox: tuple[float, float, float, float],
) -> bool:
    """Check if a region is blank (< 5% ink coverage)."""
    import cv2
    import numpy as np

    nparr = np.frombuffer(image_bytes, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_GRAYSCALE)

    if img is None:
        return True

    h, w = img.shape
    x = int(bbox[0] * w / 100)
    y = int(bbox[1] * h / 100)
    rw = int(bbox[2] * w / 100)
    rh = int(bbox[3] * h / 100)

    # Crop region
    region = img[y : y + rh, x : x + rw]
    if region.size == 0:
        return True

    # Threshold and check ink coverage
    _, binary = cv2.threshold(region, 200, 255, cv2.THRESH_BINARY_INV)
    ink_ratio = np.count_nonzero(binary) / binary.size

    return ink_ratio < 0.05  # Less than 5% ink = blank


def _crop_region_sync(
    image_bytes: bytes,
    bbox: tuple[float, float, float, float],
) -> bytes:
    """Crop a region from a page image and return as PNG bytes."""
    import cv2
    import numpy as np

    nparr = np.frombuffer(image_bytes, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

    if img is None:
        return image_bytes

    h, w = img.shape[:2]
    x = int(bbox[0] * w / 100)
    y = int(bbox[1] * h / 100)
    rw = int(bbox[2] * w / 100)
    rh = int(bbox[3] * h / 100)

    region = img[y : y + rh, x : x + rw]
    _, encoded = cv2.imencode(".png", region)
    return encoded.tobytes()


# ─────────────────────────── Stage 5: Transcribe ───────────────────────────


async def transcribe_regions(script_id: UUID) -> None:
    """Transcribe handwritten text in all non-blank regions using Gemini."""
    factory = get_session_factory()
    from app.integrations.storage.r2 import get_storage_client
    from app.integrations.ai.router import get_ai_router

    storage = get_storage_client()
    ai = get_ai_router()
    reader = ai.get_handwriting_reader()

    async with factory() as db:
        svc = ScriptService(db)
        script = await svc.get_script(script_id)

        # Get paper language hint
        from sqlalchemy import select
        from app.modules.exams.models import Paper

        paper_result = await db.execute(
            select(Paper).where(Paper.id == script.paper_id)
        )
        paper = paper_result.scalar_one_or_none()
        language_hint = paper.language if paper else "en"

        for page in script.pages:
            page_bytes = await storage.download(page.storage_key)

            for region in page.regions:
                if region.is_blank:
                    continue  # Skip blank regions

                try:
                    # Crop the region
                    loop = asyncio.get_event_loop()
                    region_bytes = await loop.run_in_executor(
                        None,
                        _crop_region_sync,
                        page_bytes,
                        (
                            region.bbox_x,
                            region.bbox_y,
                            region.bbox_w,
                            region.bbox_h,
                        ),
                    )

                    # Store the cropped region image
                    region_key = f"scripts/{script.paper_id}/{script_id}/regions/{region.id}.png"
                    await storage.upload(region_key, region_bytes, "image/png")
                    region.storage_key = region_key

                    # OCR via Gemini
                    transcription = await reader.read(
                        region_bytes, language_hint=language_hint
                    )

                    await svc.update_region_transcription(
                        region_id=region.id,
                        transcription=transcription.text,
                        confidence=transcription.confidence,
                        language=transcription.language,
                    )

                except Exception as e:
                    logger.warning(
                        "transcription_failed",
                        region_id=str(region.id),
                        error=str(e),
                    )
                    # Mark with low confidence instead of failing
                    await svc.update_region_transcription(
                        region_id=region.id,
                        transcription="[Transcription failed]",
                        confidence=0.0,
                        language=language_hint,
                    )

        await db.commit()

    logger.info("transcribe_regions_complete", script_id=str(script_id))
