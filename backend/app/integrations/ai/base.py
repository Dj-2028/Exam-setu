"""AI provider abstraction: interfaces, implementations, and routing.

Each AI capability has an interface. Implementations wrap specific providers
(Gemini, Groq). The AI router picks the right provider per task.
"""

from __future__ import annotations

from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from enum import Enum


class AIProvider(str, Enum):
    GEMINI = "gemini"
    GROQ = "groq"


@dataclass
class Transcription:
    """Result of handwriting reading."""

    text: str = ""
    language: str = "en"  # "en" | "hi" | "mixed"
    confidence: float = 0.0  # 0–1
    low_confidence_spans: list[dict] = field(default_factory=list)


@dataclass
class DiagramResult:
    """Result of diagram presence check."""

    present: bool = False
    confidence: float = 0.0
    description: str = ""


@dataclass
class Suggestion:
    """AI-generated score band suggestion."""

    band_min: float = 0.0
    band_max: float = 0.0
    confidence: float = 0.0  # 0–1
    reasons: list[str] = field(default_factory=list)
    calibration_source: str = "cold_start"  # "cold_start" | "rubric" | "exemplars"
    prompt_version: str = ""
    low_confidence: bool = False


class HandwritingReader(ABC):
    """Interface for handwriting → text conversion."""

    @abstractmethod
    async def read(
        self, image_data: bytes, language_hint: str = "en"
    ) -> Transcription:
        ...


class DiagramChecker(ABC):
    """Interface for checking diagram presence."""

    @abstractmethod
    async def check(
        self, image_data: bytes, question_text: str
    ) -> DiagramResult:
        ...


class ScoreSuggester(ABC):
    """Interface for generating score band suggestions."""

    @abstractmethod
    async def suggest(self, context: dict) -> Suggestion:
        ...


class Summarizer(ABC):
    """Interface for generating evaluation summaries from structured facts."""

    @abstractmethod
    async def summarize(self, facts: dict, language: str = "en") -> str:
        ...
