"""Flag and Moderation API routes."""

from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, Depends, Query

from app.core.deps import AuthenticatedUser, DBSession
from app.core.security import require_roles
from app.modules.flags.schemas import (
    FlagCreate,
    FlagListResponse,
    FlagResolve,
    FlagResponse,
    ModerationCaseResponse,
    ModerationListResponse,
    ModerationReconcile,
    ModerationRouteRequest,
)
from app.modules.flags.service import FlagService, ModerationService

router = APIRouter(tags=["flags"])


# ── Flags ──

@router.post(
    "/flags",
    response_model=FlagResponse,
    status_code=201,
)
async def create_flag(data: FlagCreate, db: DBSession, current_user: AuthenticatedUser):
    svc = FlagService(db)
    return FlagResponse.model_validate(await svc.create_flag(data))


@router.get(
    "/flags",
    response_model=FlagListResponse,
    dependencies=[Depends(require_roles("controller", "admin"))],
)
async def list_flags(
    db: DBSession,
    paper_id: UUID | None = Query(default=None),
    status: str | None = Query(default=None),
    severity: str | None = Query(default=None),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
):
    svc = FlagService(db)
    flags, total = await svc.list_flags(
        paper_id=paper_id, status=status, severity=severity,
        page=page, page_size=page_size,
    )
    total_pages = (total + page_size - 1) // page_size if page_size > 0 else 0
    return FlagListResponse(
        items=[FlagResponse.model_validate(f) for f in flags],
        total=total, page=page, page_size=page_size, total_pages=total_pages,
    )


@router.post(
    "/flags/{flag_id}/resolve",
    response_model=FlagResponse,
    dependencies=[Depends(require_roles("controller", "admin"))],
)
async def resolve_flag(
    flag_id: UUID, data: FlagResolve, db: DBSession, current_user: AuthenticatedUser
):
    from app.modules.users.service import UserService
    user_svc = UserService(db)
    user = await user_svc.get_user_by_clerk_id(current_user.uid)
    svc = FlagService(db)
    flag = await svc.resolve_flag(flag_id, data, user.id if user else None)
    return FlagResponse.model_validate(flag)


# ── Moderation ──

@router.get(
    "/moderation",
    response_model=ModerationListResponse,
    dependencies=[Depends(require_roles("controller", "admin"))],
)
async def list_moderation_cases(
    db: DBSession,
    paper_id: UUID | None = Query(default=None),
    status: str | None = Query(default=None),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
):
    svc = ModerationService(db)
    cases, total = await svc.list_cases(
        paper_id=paper_id, status=status, page=page, page_size=page_size,
    )
    total_pages = (total + page_size - 1) // page_size if page_size > 0 else 0
    return ModerationListResponse(
        items=[ModerationCaseResponse.model_validate(c) for c in cases],
        total=total, page=page, page_size=page_size, total_pages=total_pages,
    )


@router.post(
    "/moderation/{case_id}/route",
    response_model=ModerationCaseResponse,
    dependencies=[Depends(require_roles("controller", "admin"))],
)
async def route_moderation(
    case_id: UUID, data: ModerationRouteRequest, db: DBSession
):
    svc = ModerationService(db)
    case = await svc.route_to_second(case_id, data.secondary_examiner_id)
    return ModerationCaseResponse.model_validate(case)


@router.post(
    "/moderation/{case_id}/reconcile",
    response_model=ModerationCaseResponse,
    dependencies=[Depends(require_roles("controller", "admin"))],
)
async def reconcile_moderation(
    case_id: UUID,
    data: ModerationReconcile,
    db: DBSession,
    current_user: AuthenticatedUser,
):
    from app.modules.users.service import UserService
    user_svc = UserService(db)
    user = await user_svc.get_user_by_clerk_id(current_user.uid)
    svc = ModerationService(db)
    case = await svc.reconcile(
        case_id, data.method, data.final_total, data.note,
        user.id if user else None,
    )
    return ModerationCaseResponse.model_validate(case)
