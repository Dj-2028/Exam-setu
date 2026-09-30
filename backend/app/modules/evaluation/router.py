"""Evaluation API routes — the core marking workflow."""

from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, Depends, Query

from app.core.deps import AuthenticatedUser, DBSession
from app.core.security import require_roles
from app.modules.evaluation.schemas import (
    AISuggestionRequest,
    AISuggestionResponse,
    AnswerMarkResponse,
    EvaluationAssign,
    EvaluationListResponse,
    EvaluationResponse,
    EvaluationSubmit,
    MarkOverride,
    MarkSave,
    WorkspaceResponse,
    ScriptSummary,
    PaperSummary,
    QuestionSummary,
    PageSummary,
    RegionSummary,
)
from app.modules.evaluation.service import EvaluationService

router = APIRouter(prefix="/evaluations", tags=["evaluations"])


# ── Assignment (admin/controller) ──


@router.post(
    "",
    response_model=EvaluationResponse,
    status_code=201,
    dependencies=[Depends(require_roles("admin", "controller"))],
)
async def assign_evaluation(data: EvaluationAssign, db: DBSession):
    """Assign a script to an examiner for evaluation."""
    svc = EvaluationService(db)
    # Get paper_id from script
    from app.modules.scripts.service import ScriptService

    script_svc = ScriptService(db)
    script = await script_svc.get_script(data.script_id)

    evaluation = await svc.assign(
        script_id=data.script_id,
        examiner_id=data.examiner_id,
        paper_id=script.paper_id,
        evaluation_type=data.evaluation_type,
    )
    return EvaluationResponse.model_validate(evaluation)


# ── Examiner Queue ──


@router.get("/my-queue", response_model=EvaluationListResponse)
async def get_my_queue(
    db: DBSession,
    current_user: AuthenticatedUser,
    status: str | None = Query(default=None),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
):
    """Get the current examiner's assigned evaluations."""
    from app.modules.users.service import UserService

    user_svc = UserService(db)
    user = await user_svc.get_user_by_clerk_id(current_user.uid)
    if not user:
        return EvaluationListResponse(
            items=[], total=0, page=1, page_size=20, total_pages=0
        )

    svc = EvaluationService(db)
    evaluations, total = await svc.list_for_examiner(
        examiner_id=user.id, status=status, page=page, page_size=page_size
    )
    total_pages = (total + page_size - 1) // page_size if page_size > 0 else 0
    return EvaluationListResponse(
        items=[EvaluationResponse.model_validate(e) for e in evaluations],
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
    )


# ── Workspace ──


@router.get("/{evaluation_id}/workspace", response_model=WorkspaceResponse)
async def get_workspace(
    evaluation_id: UUID, db: DBSession, current_user: AuthenticatedUser
):
    """Get the full evaluation workspace data."""
    svc = EvaluationService(db)
    data = await svc.get_workspace(evaluation_id)

    return WorkspaceResponse(
        evaluation=EvaluationResponse.model_validate(data["evaluation"]),
        script=ScriptSummary(
            id=data["script"].id,
            barcode=data["script"].barcode,
            page_count=data["script"].page_count,
            status=data["script"].status,
        ),
        paper=PaperSummary(
            id=data["paper"].id,
            name=data["paper"].name,
            code=data["paper"].code,
            total_marks=data["paper"].total_marks,
            passing_marks=data["paper"].passing_marks,
            increment=data["paper"].increment,
            language=data["paper"].language,
            ai_suggestions_enabled=data["paper"].ai_suggestions_enabled,
        ),
        questions=[
            QuestionSummary(
                id=q.id,
                question_number=q.question_number,
                sub_part=q.sub_part,
                text=q.text,
                max_marks=q.max_marks,
                answer_type=q.answer_type,
                rubric=q.rubric,
                order_index=q.order_index,
            )
            for q in data["questions"]
        ],
        pages=[
            PageSummary(
                id=p.id,
                page_number=p.page_number,
                width=p.width,
                height=p.height,
                regions=[
                    RegionSummary(
                        id=r.id,
                        page_id=r.page_id,
                        question_id=r.question_id,
                        bbox_x=r.bbox_x,
                        bbox_y=r.bbox_y,
                        bbox_w=r.bbox_w,
                        bbox_h=r.bbox_h,
                        transcription=r.transcription,
                        transcription_confidence=r.transcription_confidence,
                        has_diagram=r.has_diagram,
                        is_blank=r.is_blank,
                        storage_key=r.storage_key,
                    )
                    for r in sorted(p.regions, key=lambda x: x.order_index)
                ],
            )
            for p in data["pages"]
        ],
        marks=[
            AnswerMarkResponse.model_validate(m) for m in data["marks"]
        ],
    )


# ── Session Control ──


@router.post("/{evaluation_id}/start", response_model=EvaluationResponse)
async def start_evaluation(
    evaluation_id: UUID, db: DBSession, current_user: AuthenticatedUser
):
    """Start an evaluation session."""
    svc = EvaluationService(db)
    evaluation = await svc.start(evaluation_id, current_user.uid)
    return EvaluationResponse.model_validate(evaluation)


@router.post("/{evaluation_id}/submit", response_model=EvaluationResponse)
async def submit_evaluation(
    evaluation_id: UUID,
    data: EvaluationSubmit,
    db: DBSession,
    current_user: AuthenticatedUser,
):
    """Submit a completed evaluation."""
    svc = EvaluationService(db)
    evaluation = await svc.submit(
        evaluation_id, current_user.uid, data.total_time_seconds
    )
    return EvaluationResponse.model_validate(evaluation)


# ── Marking ──


@router.post("/{evaluation_id}/marks", response_model=AnswerMarkResponse)
async def save_mark(
    evaluation_id: UUID,
    data: MarkSave,
    db: DBSession,
    current_user: AuthenticatedUser,
):
    """Save a mark for a single question."""
    svc = EvaluationService(db)
    answer_mark = await svc.save_mark(evaluation_id, data, current_user.uid)
    return AnswerMarkResponse.model_validate(answer_mark)


@router.post(
    "/{evaluation_id}/marks/{question_id}/override",
    response_model=AnswerMarkResponse,
)
async def override_mark(
    evaluation_id: UUID,
    question_id: UUID,
    data: MarkOverride,
    db: DBSession,
    current_user: AuthenticatedUser,
):
    """Override a mark with a reason (when diverging from AI suggestion)."""
    svc = EvaluationService(db)
    # First save the mark
    mark_data = MarkSave(question_id=question_id, mark=data.mark)
    answer_mark = await svc.save_mark(evaluation_id, mark_data, current_user.uid)

    # Then set override reason
    answer_mark.is_override = True
    answer_mark.override_reason = data.reason
    await db.commit()
    await db.refresh(answer_mark)

    return AnswerMarkResponse.model_validate(answer_mark)


# ── AI Suggestions ──


@router.post(
    "/{evaluation_id}/suggest",
    response_model=AISuggestionResponse,
)
async def request_ai_suggestion(
    evaluation_id: UUID,
    data: AISuggestionRequest,
    db: DBSession,
    current_user: AuthenticatedUser,
):
    """Request an AI score suggestion for an answer.

    The suggestion is stored on the AnswerMark but NEVER used as a final mark.
    The examiner must always make their own decision.
    """
    svc = EvaluationService(db)
    evaluation = await svc.get_evaluation(evaluation_id)

    # Get the paper to check if AI is enabled
    from app.modules.exams.models import Paper
    from sqlalchemy import select

    paper_result = await db.execute(
        select(Paper).where(Paper.id == evaluation.paper_id)
    )
    paper = paper_result.scalar_one_or_none()

    if not paper or not paper.ai_suggestions_enabled:
        from app.core.errors import BadRequestError
        raise BadRequestError("AI suggestions are disabled for this paper.")

    # Get question and transcription
    from app.modules.evaluation.models import AnswerMark
    from sqlalchemy import and_

    mark_result = await db.execute(
        select(AnswerMark).where(
            and_(
                AnswerMark.evaluation_id == evaluation_id,
                AnswerMark.question_id == data.question_id,
            )
        )
    )
    answer_mark = mark_result.scalar_one_or_none()

    question_result = await db.execute(
        select(Question).where(Question.id == data.question_id)
    )
    question = question_result.scalar_one_or_none()

    if not question or not answer_mark:
        from app.core.errors import NotFoundError
        raise NotFoundError("Question or answer mark not found.")

    # Call AI scoring
    from app.integrations.ai.router import get_ai_router

    ai = get_ai_router()
    scorer = ai.get_score_suggester()
    suggestion = await scorer.suggest(
        transcription=answer_mark.transcription,
        question_text=question.text,
        rubric=question.rubric,
        model_answer=question.model_answer,
        max_marks=question.max_marks,
    )

    # Store on the AnswerMark
    await svc.save_ai_suggestion(
        evaluation_id=evaluation_id,
        question_id=data.question_id,
        band_min=suggestion.band_min,
        band_max=suggestion.band_max,
        confidence=suggestion.confidence,
        reasons={"reasons": suggestion.reasons},
        calibration_source=suggestion.calibration_source,
        prompt_version=suggestion.prompt_version,
    )

    return AISuggestionResponse(
        question_id=data.question_id,
        band_min=suggestion.band_min,
        band_max=suggestion.band_max,
        confidence=suggestion.confidence,
        reasons=suggestion.reasons,
        calibration_source=suggestion.calibration_source,
        prompt_version=suggestion.prompt_version,
    )


# Import Question for AI suggestion endpoint
from app.modules.exams.models import Question
