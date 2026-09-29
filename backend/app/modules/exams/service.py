"""Exam, Paper, Question service — CRUD and business rules."""

from __future__ import annotations

from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.errors import BadRequestError, NotFoundError
from app.core.logging import get_logger
from app.modules.exams.models import Exam, Paper, Question
from app.modules.exams.schemas import (
    ExamCreate,
    ExamUpdate,
    PaperCreate,
    PaperUpdate,
    QuestionCreate,
    QuestionUpdate,
    QuestionBulkCreate,
)

logger = get_logger(__name__)


class ExamService:
    """Business logic for exam management."""

    def __init__(self, db: AsyncSession) -> None:
        self._db = db

    # ── Exams ──

    async def create_exam(self, data: ExamCreate) -> Exam:
        exam = Exam(name=data.name, code=data.code, session=data.session)
        self._db.add(exam)
        await self._db.commit()
        await self._db.refresh(exam)
        logger.info("exam_created", exam_id=str(exam.id), code=exam.code)
        return exam

    async def get_exam(self, exam_id: UUID) -> Exam:
        result = await self._db.execute(
            select(Exam)
            .options(selectinload(Exam.papers))
            .where(Exam.id == exam_id)
        )
        exam = result.scalar_one_or_none()
        if not exam:
            raise NotFoundError(f"Exam {exam_id} not found.")
        return exam

    async def list_exams(
        self, page: int = 1, page_size: int = 20
    ) -> tuple[list[Exam], int]:
        count_result = await self._db.execute(
            select(func.count()).select_from(Exam)
        )
        total = count_result.scalar() or 0

        offset = (page - 1) * page_size
        result = await self._db.execute(
            select(Exam)
            .options(selectinload(Exam.papers))
            .order_by(Exam.created_at.desc())
            .offset(offset)
            .limit(page_size)
        )
        exams = list(result.scalars().all())
        return exams, total

    async def update_exam(self, exam_id: UUID, data: ExamUpdate) -> Exam:
        exam = await self.get_exam(exam_id)
        if data.name is not None:
            exam.name = data.name
        if data.session is not None:
            exam.session = data.session
        if data.status is not None:
            exam.status = data.status
        await self._db.commit()
        await self._db.refresh(exam)
        logger.info("exam_updated", exam_id=str(exam.id))
        return exam

    async def delete_exam(self, exam_id: UUID) -> None:
        exam = await self.get_exam(exam_id)
        if exam.status != "draft":
            raise BadRequestError("Only draft exams can be deleted.")
        await self._db.delete(exam)
        await self._db.commit()
        logger.info("exam_deleted", exam_id=str(exam_id))

    # ── Papers ──

    async def create_paper(self, exam_id: UUID, data: PaperCreate) -> Paper:
        # Verify exam exists
        await self.get_exam(exam_id)

        paper = Paper(
            exam_id=exam_id,
            name=data.name,
            code=data.code,
            total_marks=data.total_marks,
            passing_marks=data.passing_marks,
            increment=data.increment,
            language=data.language,
            moderation_threshold=data.moderation_threshold,
            ai_suggestions_enabled=data.ai_suggestions_enabled,
        )
        self._db.add(paper)
        await self._db.commit()
        await self._db.refresh(paper)
        logger.info("paper_created", paper_id=str(paper.id), code=paper.code)
        return paper

    async def get_paper(self, paper_id: UUID) -> Paper:
        result = await self._db.execute(
            select(Paper)
            .options(selectinload(Paper.questions))
            .where(Paper.id == paper_id)
        )
        paper = result.scalar_one_or_none()
        if not paper:
            raise NotFoundError(f"Paper {paper_id} not found.")
        return paper

    async def list_papers(
        self, exam_id: UUID, page: int = 1, page_size: int = 20
    ) -> tuple[list[Paper], int]:
        count_result = await self._db.execute(
            select(func.count()).select_from(Paper).where(Paper.exam_id == exam_id)
        )
        total = count_result.scalar() or 0

        offset = (page - 1) * page_size
        result = await self._db.execute(
            select(Paper)
            .options(selectinload(Paper.questions))
            .where(Paper.exam_id == exam_id)
            .order_by(Paper.created_at.desc())
            .offset(offset)
            .limit(page_size)
        )
        papers = list(result.scalars().all())
        return papers, total

    async def update_paper(self, paper_id: UUID, data: PaperUpdate) -> Paper:
        paper = await self.get_paper(paper_id)
        for field, value in data.model_dump(exclude_unset=True).items():
            setattr(paper, field, value)
        await self._db.commit()
        await self._db.refresh(paper)
        logger.info("paper_updated", paper_id=str(paper.id))
        return paper

    # ── Questions ──

    async def add_question(self, paper_id: UUID, data: QuestionCreate) -> Question:
        await self.get_paper(paper_id)
        question = Question(paper_id=paper_id, **data.model_dump())
        self._db.add(question)
        await self._db.commit()
        await self._db.refresh(question)
        logger.info(
            "question_added",
            paper_id=str(paper_id),
            question_number=question.question_number,
        )
        return question

    async def bulk_add_questions(
        self, paper_id: UUID, data: QuestionBulkCreate
    ) -> list[Question]:
        """Add multiple questions at once (for paper setup)."""
        await self.get_paper(paper_id)
        questions = []
        for i, q_data in enumerate(data.questions):
            question = Question(
                paper_id=paper_id,
                order_index=i,
                **q_data.model_dump(exclude={"order_index"}),
            )
            self._db.add(question)
            questions.append(question)

        await self._db.commit()
        for q in questions:
            await self._db.refresh(q)

        logger.info(
            "questions_bulk_added",
            paper_id=str(paper_id),
            count=len(questions),
        )
        return questions

    async def list_questions(self, paper_id: UUID) -> list[Question]:
        result = await self._db.execute(
            select(Question)
            .where(Question.paper_id == paper_id)
            .order_by(Question.order_index)
        )
        return list(result.scalars().all())

    async def update_question(
        self, question_id: UUID, data: QuestionUpdate
    ) -> Question:
        result = await self._db.execute(
            select(Question).where(Question.id == question_id)
        )
        question = result.scalar_one_or_none()
        if not question:
            raise NotFoundError(f"Question {question_id} not found.")

        for field, value in data.model_dump(exclude_unset=True).items():
            setattr(question, field, value)

        await self._db.commit()
        await self._db.refresh(question)
        logger.info("question_updated", question_id=str(question.id))
        return question

    async def delete_question(self, question_id: UUID) -> None:
        result = await self._db.execute(
            select(Question).where(Question.id == question_id)
        )
        question = result.scalar_one_or_none()
        if not question:
            raise NotFoundError(f"Question {question_id} not found.")
        await self._db.delete(question)
        await self._db.commit()
        logger.info("question_deleted", question_id=str(question_id))
