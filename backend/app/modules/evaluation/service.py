"""Evaluation service — assignment, marking, AI suggestions, submission."""

from __future__ import annotations

from datetime import datetime, timezone
from uuid import UUID

from sqlalchemy import func, select, and_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.errors import BadRequestError, NotFoundError, ForbiddenError
from app.core.events import EventBus, DomainEvent
from app.core.logging import get_logger
from app.modules.evaluation.models import AnswerMark, Evaluation
from app.modules.evaluation.schemas import MarkSave
from app.modules.exams.models import Paper, Question
from app.modules.scripts.models import Page, Region, Script

logger = get_logger(__name__)


class EvaluationService:
    """Business logic for the evaluation workflow."""

    def __init__(self, db: AsyncSession) -> None:
        self._db = db

    # ── Assignment ──

    async def assign(
        self,
        script_id: UUID,
        examiner_id: UUID,
        paper_id: UUID,
        evaluation_type: str = "primary",
    ) -> Evaluation:
        """Assign a script to an examiner for evaluation."""
        # Verify script is ready
        script = await self._get_script(script_id)
        if script.status not in ("ready", "assigned"):
            raise BadRequestError(
                f"Script status is '{script.status}', must be 'ready' or 'assigned'."
            )

        # Check for duplicate assignment
        existing = await self._db.execute(
            select(Evaluation).where(
                and_(
                    Evaluation.script_id == script_id,
                    Evaluation.examiner_id == examiner_id,
                )
            )
        )
        if existing.scalar_one_or_none():
            raise BadRequestError("This script is already assigned to this examiner.")

        evaluation = Evaluation(
            script_id=script_id,
            examiner_id=examiner_id,
            paper_id=paper_id,
            evaluation_type=evaluation_type,
            status="assigned",
        )
        self._db.add(evaluation)

        # Update script status
        script.status = "assigned"

        await self._db.commit()
        await self._db.refresh(evaluation)

        logger.info(
            "evaluation_assigned",
            evaluation_id=str(evaluation.id),
            script_id=str(script_id),
            examiner_id=str(examiner_id),
        )
        return evaluation

    # ── Session Management ──

    async def start(self, evaluation_id: UUID, examiner_uid: str) -> Evaluation:
        """Start an evaluation session — sets started_at and creates blank marks."""
        evaluation = await self.get_evaluation(evaluation_id)
        await self._verify_examiner(evaluation, examiner_uid)

        if evaluation.status == "in_progress":
            return evaluation  # Already started — idempotent

        if evaluation.status != "assigned":
            raise BadRequestError(
                f"Cannot start: status is '{evaluation.status}'."
            )

        evaluation.status = "in_progress"
        evaluation.started_at = datetime.now(timezone.utc)

        # Update script status
        script = await self._get_script(evaluation.script_id)
        script.status = "evaluation_in_progress"

        # Pre-create blank AnswerMark records for each question
        questions = await self._get_questions(evaluation.paper_id)
        regions = await self._get_regions_for_script(evaluation.script_id)

        # Map questions to regions
        region_by_question: dict[UUID, Region] = {}
        for region in regions:
            if region.question_id:
                region_by_question[region.question_id] = region

        for question in questions:
            region = region_by_question.get(question.id)
            answer_mark = AnswerMark(
                evaluation_id=evaluation.id,
                question_id=question.id,
                region_id=region.id if region else None,
                transcription=region.transcription if region else "",
                transcription_confidence=(
                    region.transcription_confidence if region else 0.0
                ),
            )
            self._db.add(answer_mark)

        await self._db.commit()
        await self._db.refresh(evaluation)

        logger.info("evaluation_started", evaluation_id=str(evaluation.id))
        return evaluation

    # ── Marking ──

    async def save_mark(
        self,
        evaluation_id: UUID,
        data: MarkSave,
        examiner_uid: str,
    ) -> AnswerMark:
        """Save a mark for a single question.

        This is the core action. The mark is ALWAYS the human's decision.
        If it diverges significantly from the AI suggestion, is_override is set.
        """
        evaluation = await self.get_evaluation(evaluation_id)
        await self._verify_examiner(evaluation, examiner_uid)

        if evaluation.status == "assigned":
            evaluation = await self.start(evaluation_id, examiner_uid)
        elif evaluation.status != "in_progress":
            raise BadRequestError("Evaluation is not in progress.")

        # Validate mark against question max
        question = await self._get_question(data.question_id)
        if data.mark > question.max_marks:
            raise BadRequestError(
                f"Mark {data.mark} exceeds max {question.max_marks} for this question."
            )

        # Get the paper to validate mark increment
        paper = await self._get_paper(evaluation.paper_id)
        increment = paper.increment
        if increment > 0 and (data.mark % increment) != 0:
            # Allow 0 always
            if data.mark != 0:
                raise BadRequestError(
                    f"Mark must be in increments of {increment}."
                )

        # Find or create the AnswerMark
        result = await self._db.execute(
            select(AnswerMark).where(
                and_(
                    AnswerMark.evaluation_id == evaluation_id,
                    AnswerMark.question_id == data.question_id,
                )
            )
        )
        answer_mark = result.scalars().first()

        if not answer_mark:
            answer_mark = AnswerMark(
                evaluation_id=evaluation_id,
                question_id=data.question_id,
                region_id=data.region_id,
            )
            self._db.add(answer_mark)

        # Check for override (divergence from AI suggestion)
        is_override = False
        if (
            answer_mark.ai_band_min is not None
            and answer_mark.ai_band_max is not None
        ):
            if data.mark < answer_mark.ai_band_min or data.mark > answer_mark.ai_band_max:
                is_override = True

        answer_mark.mark = data.mark
        answer_mark.is_marked = True
        answer_mark.is_override = is_override
        answer_mark.time_spent_seconds += data.time_spent_seconds

        if data.region_id:
            answer_mark.region_id = data.region_id

        await self._db.commit()
        await self._db.refresh(answer_mark)

        # Publish event for real-time updates
        EventBus.publish(DomainEvent(
            event_type="mark.saved",
            payload={
                "evaluation_id": str(evaluation_id),
                "question_id": str(data.question_id),
                "mark": data.mark,
                "is_override": is_override,
            },
        ))

        logger.info(
            "mark_saved",
            evaluation_id=str(evaluation_id),
            question_id=str(data.question_id),
            mark=data.mark,
            is_override=is_override,
        )
        return answer_mark

    async def save_ai_suggestion(
        self,
        evaluation_id: UUID,
        question_id: UUID,
        band_min: float,
        band_max: float,
        confidence: float,
        reasons: dict,
        calibration_source: str,
        prompt_version: str,
    ) -> AnswerMark:
        """Store an AI suggestion on an AnswerMark (called by AI worker)."""
        result = await self._db.execute(
            select(AnswerMark).where(
                and_(
                    AnswerMark.evaluation_id == evaluation_id,
                    AnswerMark.question_id == question_id,
                )
            )
        )
        answer_mark = result.scalars().first()
        if not answer_mark:
            raise NotFoundError("AnswerMark not found for this evaluation+question.")

        answer_mark.ai_band_min = band_min
        answer_mark.ai_band_max = band_max
        answer_mark.ai_confidence = confidence
        answer_mark.ai_reasons = reasons
        answer_mark.ai_calibration_source = calibration_source
        answer_mark.ai_prompt_version = prompt_version

        await self._db.commit()
        await self._db.refresh(answer_mark)
        return answer_mark

    # ── Submission ──

    async def submit(
        self,
        evaluation_id: UUID,
        examiner_uid: str,
        total_time_seconds: int = 0,
    ) -> Evaluation:
        """Submit a completed evaluation."""
        evaluation = await self.get_evaluation(evaluation_id)
        await self._verify_examiner(evaluation, examiner_uid)

        if evaluation.status != "in_progress":
            raise BadRequestError("Evaluation is not in progress.")

        # Verify all questions are marked
        marks = await self._get_marks(evaluation_id)
        unmarked = [m for m in marks if not m.is_marked]
        if unmarked:
            raise BadRequestError(
                f"{len(unmarked)} question(s) still unmarked."
            )

        # Calculate total
        total = sum(m.mark for m in marks if m.mark is not None)

        evaluation.status = "submitted"
        evaluation.completed_at = datetime.now(timezone.utc)
        evaluation.total_marks = total
        evaluation.total_time_seconds = total_time_seconds

        # Update script status
        script = await self._get_script(evaluation.script_id)
        script.status = "evaluated"

        await self._db.commit()
        await self._db.refresh(evaluation)

        EventBus.publish(DomainEvent(
            event_type="evaluation.submitted",
            payload={
                "evaluation_id": str(evaluation_id),
                "script_id": str(evaluation.script_id),
                "total_marks": total,
                "examiner_id": str(evaluation.examiner_id),
            },
        ))

        logger.info(
            "evaluation_submitted",
            evaluation_id=str(evaluation_id),
            total_marks=total,
        )
        return evaluation

    # ── Workspace Data ──

    async def get_workspace(self, evaluation_id: UUID) -> dict:
        """Get everything needed to render the evaluation workspace."""
        evaluation = await self.get_evaluation(evaluation_id)

        script = await self._get_script(evaluation.script_id)
        paper = await self._get_paper(evaluation.paper_id)
        questions = await self._get_questions(evaluation.paper_id)
        marks = await self._get_marks(evaluation_id)

        # Get pages with regions
        pages_result = await self._db.execute(
            select(Page)
            .options(selectinload(Page.regions))
            .where(Page.script_id == script.id)
            .order_by(Page.page_number)
        )
        pages = list(pages_result.scalars().all())

        return {
            "evaluation": evaluation,
            "script": script,
            "paper": paper,
            "questions": questions,
            "pages": pages,
            "marks": marks,
        }

    # ── Queries ──

    async def get_evaluation(self, evaluation_id: UUID) -> Evaluation:
        result = await self._db.execute(
            select(Evaluation)
            .options(selectinload(Evaluation.answer_marks))
            .where(Evaluation.id == evaluation_id)
        )
        evaluation = result.scalar_one_or_none()
        if not evaluation:
            raise NotFoundError(f"Evaluation {evaluation_id} not found.")
        return evaluation

    async def list_for_examiner(
        self,
        examiner_id: UUID,
        status: str | None = None,
        page: int = 1,
        page_size: int = 20,
    ) -> tuple[list[Evaluation], int]:
        from sqlalchemy.orm import selectinload

        query = select(Evaluation).options(selectinload(Evaluation.answer_marks)).where(Evaluation.examiner_id == examiner_id)
        count_query = select(func.count()).select_from(Evaluation).where(
            Evaluation.examiner_id == examiner_id
        )

        if status:
            query = query.where(Evaluation.status == status)
            count_query = count_query.where(Evaluation.status == status)

        total_result = await self._db.execute(count_query)
        total = total_result.scalar() or 0

        offset = (page - 1) * page_size
        result = await self._db.execute(
            query.order_by(Evaluation.created_at.desc())
            .offset(offset)
            .limit(page_size)
        )
        evaluations = list(result.scalars().all())
        return evaluations, total

    # ── Helpers ──

    async def _verify_examiner(
        self, evaluation: Evaluation, examiner_uid: str
    ) -> None:
        """Verify the current user is the assigned examiner."""
        from app.modules.users.service import UserService

        user_svc = UserService(self._db)
        user = await user_svc.get_user_by_clerk_id(examiner_uid)
        if not user or user.id != evaluation.examiner_id:
            raise ForbiddenError("You are not assigned to this evaluation.")

    async def _get_script(self, script_id: UUID) -> Script:
        result = await self._db.execute(
            select(Script).where(Script.id == script_id)
        )
        script = result.scalar_one_or_none()
        if not script:
            raise NotFoundError(f"Script {script_id} not found.")
        return script

    async def _get_paper(self, paper_id: UUID) -> Paper:
        result = await self._db.execute(
            select(Paper).where(Paper.id == paper_id)
        )
        paper = result.scalar_one_or_none()
        if not paper:
            raise NotFoundError(f"Paper {paper_id} not found.")
        return paper

    async def _get_question(self, question_id: UUID) -> Question:
        result = await self._db.execute(
            select(Question).where(Question.id == question_id)
        )
        question = result.scalar_one_or_none()
        if not question:
            raise NotFoundError(f"Question {question_id} not found.")
        return question

    async def _get_questions(self, paper_id: UUID) -> list[Question]:
        result = await self._db.execute(
            select(Question)
            .where(Question.paper_id == paper_id)
            .order_by(Question.order_index)
        )
        return list(result.scalars().all())

    async def _get_marks(self, evaluation_id: UUID) -> list[AnswerMark]:
        result = await self._db.execute(
            select(AnswerMark).where(AnswerMark.evaluation_id == evaluation_id)
        )
        return list(result.scalars().all())

    async def _get_regions_for_script(
        self, script_id: UUID
    ) -> list[Region]:
        result = await self._db.execute(
            select(Region)
            .join(Page)
            .where(Page.script_id == script_id)
            .order_by(Region.order_index)
        )
        return list(result.scalars().all())
