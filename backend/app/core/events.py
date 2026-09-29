"""In-process domain event bus.

Services publish events after transaction commit.
Other modules subscribe to react (e.g., moderation listens for EvaluationCompleted).
"""

from __future__ import annotations

import asyncio
from collections import defaultdict
from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Any, Callable, Coroutine
from uuid import UUID

from app.core.logging import get_logger

logger = get_logger(__name__)

# Type alias for event handlers
EventHandler = Callable[["DomainEvent"], Coroutine[Any, Any, None]]


@dataclass
class DomainEvent:
    """Base class for all domain events."""

    event_type: str = ""
    timestamp: datetime = field(default_factory=lambda: datetime.now(timezone.utc))
    actor_id: UUID | None = None
    payload: dict[str, Any] = field(default_factory=dict)


# ── Concrete events ──


@dataclass
class ScriptReady(DomainEvent):
    event_type: str = "script.ready"
    script_id: UUID | None = None
    paper_id: UUID | None = None


@dataclass
class EvaluationAssigned(DomainEvent):
    event_type: str = "evaluation.assigned"
    evaluation_id: UUID | None = None
    examiner_id: UUID | None = None
    script_id: UUID | None = None


@dataclass
class MarkSaved(DomainEvent):
    event_type: str = "mark.saved"
    evaluation_id: UUID | None = None
    answer_id: UUID | None = None
    question_number: int | None = None


@dataclass
class FlagRaised(DomainEvent):
    event_type: str = "flag.raised"
    flag_id: UUID | None = None
    flag_type: str = ""
    target_id: UUID | None = None


@dataclass
class FlagResolved(DomainEvent):
    event_type: str = "flag.resolved"
    flag_id: UUID | None = None


@dataclass
class EvaluationCompleted(DomainEvent):
    event_type: str = "evaluation.completed"
    evaluation_id: UUID | None = None
    script_id: UUID | None = None
    paper_id: UUID | None = None
    examiner_id: UUID | None = None
    total_marks: float | None = None


@dataclass
class ModerationRouted(DomainEvent):
    event_type: str = "moderation.routed"
    case_id: UUID | None = None
    script_id: UUID | None = None
    second_examiner_id: UUID | None = None


@dataclass
class CaseReconciled(DomainEvent):
    event_type: str = "case.reconciled"
    case_id: UUID | None = None
    script_id: UUID | None = None


@dataclass
class ResultsFinalized(DomainEvent):
    event_type: str = "results.finalized"
    paper_id: UUID | None = None


class EventBus:
    """Simple in-process pub/sub event bus for domain events."""

    def __init__(self) -> None:
        self._handlers: dict[str, list[EventHandler]] = defaultdict(list)

    def subscribe(self, event_type: str, handler: EventHandler) -> None:
        """Register a handler for an event type."""
        self._handlers[event_type].append(handler)
        logger.info("event_handler_registered", event_type=event_type)

    async def publish(self, event: DomainEvent) -> None:
        """Publish an event to all registered handlers.

        Handlers run concurrently. A failing handler does not stop others.
        """
        handlers = self._handlers.get(event.event_type, [])
        if not handlers:
            return

        logger.info(
            "event_published",
            event_type=event.event_type,
            handler_count=len(handlers),
        )

        tasks = [asyncio.create_task(h(event)) for h in handlers]
        results = await asyncio.gather(*tasks, return_exceptions=True)

        for i, result in enumerate(results):
            if isinstance(result, Exception):
                logger.error(
                    "event_handler_failed",
                    event_type=event.event_type,
                    handler_index=i,
                    error=str(result),
                )


# Singleton event bus
_event_bus: EventBus | None = None


def get_event_bus() -> EventBus:
    """Return the singleton event bus."""
    global _event_bus
    if _event_bus is None:
        _event_bus = EventBus()
    return _event_bus
