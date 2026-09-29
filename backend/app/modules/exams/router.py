"""Exam, Paper, and Question API routes."""

from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, Depends, Query

from app.core.deps import AuthenticatedUser, DBSession
from app.core.security import require_roles
from app.modules.exams.schemas import (
    ExamCreate,
    ExamListResponse,
    ExamResponse,
    ExamUpdate,
    PaperCreate,
    PaperListResponse,
    PaperResponse,
    PaperUpdate,
    QuestionBulkCreate,
    QuestionCreate,
    QuestionListResponse,
    QuestionResponse,
    QuestionUpdate,
)
from app.modules.exams.service import ExamService

router = APIRouter(prefix="/exams", tags=["exams"])

# ── Exams ──


@router.post(
    "",
    response_model=ExamResponse,
    status_code=201,
    dependencies=[Depends(require_roles("admin"))],
)
async def create_exam(data: ExamCreate, db: DBSession):
    svc = ExamService(db)
    exam = await svc.create_exam(data)
    return ExamResponse(
        **{k: v for k, v in exam.__dict__.items() if not k.startswith("_")},
        paper_count=0,
    )


@router.get("", response_model=ExamListResponse)
async def list_exams(
    db: DBSession,
    current_user: AuthenticatedUser,
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
):
    svc = ExamService(db)
    exams, total = await svc.list_exams(page=page, page_size=page_size)
    total_pages = (total + page_size - 1) // page_size if page_size > 0 else 0
    items = [
        ExamResponse(
            id=e.id,
            name=e.name,
            code=e.code,
            session=e.session,
            status=e.status,
            created_at=e.created_at,
            updated_at=e.updated_at,
            paper_count=len(e.papers) if e.papers else 0,
        )
        for e in exams
    ]
    return ExamListResponse(
        items=items,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
    )


@router.get("/{exam_id}", response_model=ExamResponse)
async def get_exam(exam_id: UUID, db: DBSession, current_user: AuthenticatedUser):
    svc = ExamService(db)
    exam = await svc.get_exam(exam_id)
    return ExamResponse(
        id=exam.id,
        name=exam.name,
        code=exam.code,
        session=exam.session,
        status=exam.status,
        created_at=exam.created_at,
        updated_at=exam.updated_at,
        paper_count=len(exam.papers) if exam.papers else 0,
    )


@router.patch(
    "/{exam_id}",
    response_model=ExamResponse,
    dependencies=[Depends(require_roles("admin"))],
)
async def update_exam(exam_id: UUID, data: ExamUpdate, db: DBSession):
    svc = ExamService(db)
    exam = await svc.update_exam(exam_id, data)
    return ExamResponse(
        id=exam.id,
        name=exam.name,
        code=exam.code,
        session=exam.session,
        status=exam.status,
        created_at=exam.created_at,
        updated_at=exam.updated_at,
        paper_count=len(exam.papers) if hasattr(exam, "papers") and exam.papers else 0,
    )


@router.delete(
    "/{exam_id}",
    status_code=204,
    dependencies=[Depends(require_roles("admin"))],
)
async def delete_exam(exam_id: UUID, db: DBSession):
    svc = ExamService(db)
    await svc.delete_exam(exam_id)


# ── Papers ──


@router.post(
    "/{exam_id}/papers",
    response_model=PaperResponse,
    status_code=201,
    dependencies=[Depends(require_roles("admin"))],
)
async def create_paper(exam_id: UUID, data: PaperCreate, db: DBSession):
    svc = ExamService(db)
    paper = await svc.create_paper(exam_id, data)
    return PaperResponse(
        **{k: v for k, v in paper.__dict__.items() if not k.startswith("_")},
        question_count=0,
    )


@router.get("/{exam_id}/papers", response_model=PaperListResponse)
async def list_papers(
    exam_id: UUID,
    db: DBSession,
    current_user: AuthenticatedUser,
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
):
    svc = ExamService(db)
    papers, total = await svc.list_papers(exam_id, page=page, page_size=page_size)
    total_pages = (total + page_size - 1) // page_size if page_size > 0 else 0
    items = [
        PaperResponse(
            id=p.id,
            exam_id=p.exam_id,
            name=p.name,
            code=p.code,
            total_marks=p.total_marks,
            passing_marks=p.passing_marks,
            increment=p.increment,
            language=p.language,
            status=p.status,
            moderation_threshold=p.moderation_threshold,
            ai_suggestions_enabled=p.ai_suggestions_enabled,
            created_at=p.created_at,
            updated_at=p.updated_at,
            question_count=len(p.questions) if p.questions else 0,
        )
        for p in papers
    ]
    return PaperListResponse(
        items=items,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
    )


@router.get("/papers/{paper_id}", response_model=PaperResponse)
async def get_paper(paper_id: UUID, db: DBSession, current_user: AuthenticatedUser):
    svc = ExamService(db)
    paper = await svc.get_paper(paper_id)
    return PaperResponse(
        id=paper.id,
        exam_id=paper.exam_id,
        name=paper.name,
        code=paper.code,
        total_marks=paper.total_marks,
        passing_marks=paper.passing_marks,
        increment=paper.increment,
        language=paper.language,
        status=paper.status,
        moderation_threshold=paper.moderation_threshold,
        ai_suggestions_enabled=paper.ai_suggestions_enabled,
        created_at=paper.created_at,
        updated_at=paper.updated_at,
        question_count=len(paper.questions) if paper.questions else 0,
    )


@router.patch(
    "/papers/{paper_id}",
    response_model=PaperResponse,
    dependencies=[Depends(require_roles("admin"))],
)
async def update_paper(paper_id: UUID, data: PaperUpdate, db: DBSession):
    svc = ExamService(db)
    paper = await svc.update_paper(paper_id, data)
    return PaperResponse(
        id=paper.id,
        exam_id=paper.exam_id,
        name=paper.name,
        code=paper.code,
        total_marks=paper.total_marks,
        passing_marks=paper.passing_marks,
        increment=paper.increment,
        language=paper.language,
        status=paper.status,
        moderation_threshold=paper.moderation_threshold,
        ai_suggestions_enabled=paper.ai_suggestions_enabled,
        created_at=paper.created_at,
        updated_at=paper.updated_at,
        question_count=len(paper.questions) if hasattr(paper, "questions") and paper.questions else 0,
    )


# ── Questions ──


@router.post(
    "/papers/{paper_id}/questions",
    response_model=QuestionResponse,
    status_code=201,
    dependencies=[Depends(require_roles("admin"))],
)
async def add_question(paper_id: UUID, data: QuestionCreate, db: DBSession):
    svc = ExamService(db)
    return await svc.add_question(paper_id, data)


@router.post(
    "/papers/{paper_id}/questions/bulk",
    response_model=QuestionListResponse,
    status_code=201,
    dependencies=[Depends(require_roles("admin"))],
)
async def bulk_add_questions(paper_id: UUID, data: QuestionBulkCreate, db: DBSession):
    svc = ExamService(db)
    questions = await svc.bulk_add_questions(paper_id, data)
    return QuestionListResponse(
        items=[QuestionResponse.model_validate(q) for q in questions],
        total=len(questions),
    )


@router.get("/papers/{paper_id}/questions", response_model=QuestionListResponse)
async def list_questions(
    paper_id: UUID, db: DBSession, current_user: AuthenticatedUser
):
    svc = ExamService(db)
    questions = await svc.list_questions(paper_id)
    return QuestionListResponse(
        items=[QuestionResponse.model_validate(q) for q in questions],
        total=len(questions),
    )


@router.patch(
    "/questions/{question_id}",
    response_model=QuestionResponse,
    dependencies=[Depends(require_roles("admin"))],
)
async def update_question(question_id: UUID, data: QuestionUpdate, db: DBSession):
    svc = ExamService(db)
    return await svc.update_question(question_id, data)


@router.delete(
    "/questions/{question_id}",
    status_code=204,
    dependencies=[Depends(require_roles("admin"))],
)
async def delete_question(question_id: UUID, db: DBSession):
    svc = ExamService(db)
    await svc.delete_question(question_id)
