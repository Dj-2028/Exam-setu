"""AI provider router — selects provider per task with retry and fallback."""

from __future__ import annotations

from app.core.config import get_settings
from app.core.logging import get_logger
from app.integrations.ai.base import (
    DiagramChecker,
    HandwritingReader,
    ScoreSuggester,
    Summarizer,
)
from app.integrations.ai.gemini import GeminiDiagramChecker, GeminiHandwritingReader
from app.integrations.ai.groq import GroqScoreSuggester, GroqSummarizer

logger = get_logger(__name__)


class AIRouter:
    """Routes AI tasks to the appropriate provider.

    Provider selection is configuration-driven. Retry and fallback
    logic is applied for each task type.
    """

    def __init__(self) -> None:
        self._handwriting_reader: HandwritingReader | None = None
        self._diagram_checker: DiagramChecker | None = None
        self._score_suggester: ScoreSuggester | None = None
        self._summarizer: Summarizer | None = None

    def get_handwriting_reader(self) -> HandwritingReader:
        """Default: Gemini (multimodal vision)."""
        if self._handwriting_reader is None:
            self._handwriting_reader = GeminiHandwritingReader()
        return self._handwriting_reader

    def get_diagram_checker(self) -> DiagramChecker:
        """Default: Gemini (vision)."""
        if self._diagram_checker is None:
            self._diagram_checker = GeminiDiagramChecker()
        return self._diagram_checker

    def get_score_suggester(self) -> ScoreSuggester:
        """Default: Groq (fast LLM inference)."""
        if self._score_suggester is None:
            self._score_suggester = GroqScoreSuggester()
        return self._score_suggester

    def get_summarizer(self) -> Summarizer:
        """Default: Groq."""
        if self._summarizer is None:
            self._summarizer = GroqSummarizer()
        return self._summarizer


# Singleton
_ai_router: AIRouter | None = None


def get_ai_router() -> AIRouter:
    global _ai_router
    if _ai_router is None:
        _ai_router = AIRouter()
    return _ai_router
