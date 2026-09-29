"""Gemini AI provider implementation — vision tasks (OCR, diagram detection)."""

from __future__ import annotations

import google.generativeai as genai

from app.core.config import get_settings
from app.core.logging import get_logger
from app.integrations.ai.base import (
    DiagramChecker,
    DiagramResult,
    HandwritingReader,
    Transcription,
)

logger = get_logger(__name__)


class GeminiHandwritingReader(HandwritingReader):
    """Read handwritten text using Google Gemini's vision capabilities."""

    def __init__(self) -> None:
        settings = get_settings()
        genai.configure(api_key=settings.gemini_api_key)
        self._model = genai.GenerativeModel(settings.gemini_model_vision)
        self._timeout = settings.ai_handwriting_timeout

    async def read(
        self, image_data: bytes, language_hint: str = "en"
    ) -> Transcription:
        """Convert a handwritten answer image to text."""
        try:
            lang_desc = {
                "en": "English",
                "hi": "Hindi (Devanagari script)",
                "mixed": "English and Hindi mixed",
            }.get(language_hint, "English")

            prompt = (
                f"You are a handwriting recognition system. Read the handwritten text "
                f"in this image. The text is in {lang_desc}. "
                f"Return ONLY a JSON object with these fields:\n"
                f'- "text": the transcribed text\n'
                f'- "language": detected language ("en", "hi", or "mixed")\n'
                f'- "confidence": overall confidence 0.0–1.0\n'
                f'- "low_confidence_spans": array of {{"start": int, "end": int}} '
                f"for uncertain segments\n"
                f"Do not add any commentary outside the JSON."
            )

            image_part = {"mime_type": "image/png", "data": image_data}
            response = await self._model.generate_content_async(
                [prompt, image_part],
                generation_config=genai.GenerationConfig(
                    response_mime_type="application/json",
                    temperature=0.1,
                ),
            )

            import json
            result = json.loads(response.text)

            return Transcription(
                text=result.get("text", ""),
                language=result.get("language", language_hint),
                confidence=float(result.get("confidence", 0.5)),
                low_confidence_spans=result.get("low_confidence_spans", []),
            )

        except Exception as e:
            logger.error("gemini_handwriting_failed", error=str(e))
            raise


class GeminiDiagramChecker(DiagramChecker):
    """Check for diagram presence using Gemini vision."""

    def __init__(self) -> None:
        settings = get_settings()
        genai.configure(api_key=settings.gemini_api_key)
        self._model = genai.GenerativeModel(settings.gemini_model_vision)

    async def check(
        self, image_data: bytes, question_text: str
    ) -> DiagramResult:
        """Check whether a diagram/figure is present in the answer image."""
        try:
            prompt = (
                f"Examine this handwritten answer image for the question: "
                f'"{question_text}"\n\n'
                f"Return ONLY a JSON object:\n"
                f'- "present": boolean, true if a diagram/figure/graph/drawing exists\n'
                f'- "confidence": 0.0–1.0\n'
                f'- "description": brief description of what you see\n'
                f"Do not add commentary outside the JSON."
            )

            image_part = {"mime_type": "image/png", "data": image_data}
            response = await self._model.generate_content_async(
                [prompt, image_part],
                generation_config=genai.GenerationConfig(
                    response_mime_type="application/json",
                    temperature=0.1,
                ),
            )

            import json
            result = json.loads(response.text)

            return DiagramResult(
                present=bool(result.get("present", False)),
                confidence=float(result.get("confidence", 0.5)),
                description=result.get("description", ""),
            )

        except Exception as e:
            logger.error("gemini_diagram_check_failed", error=str(e))
            raise
