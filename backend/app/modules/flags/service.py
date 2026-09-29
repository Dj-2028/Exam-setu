"""Flag and Moderation service — flag lifecycle and moderation routing."""

from __future__ import annotations

from datetime import datetime, timezone
from uuid import UUID

from sqlalchemy import func, select, and_
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import BadRequestError, NotFoundError
from app.core.events import EventBus, DomainEvent
from app.core.logging import get_logger
from app.modules.flags.models import Flag, ModerationCase
from app.modules.flags.schemas import FlagCreate, FlagResolve

logger = get_logger(__name__)


class FlagService:
    def __init__(self, db: AsyncSession) -> None:
        self._db = db

    async def create_flag(self, data: FlagCreate) -> Flag:
        flag = Flag(**data.model_dump())
        self._db.add(flag)
        await self._db.commit()
        await self._db.refresh(flag)

        EventBus.publish(DomainEvent(
            event_type="flag.raised",
            payload={"flag_id": str(flag.id), "type": flag.flag_type, "severity": flag.severity},
        ))
        logger.info("flag_raised", flag_id=str(flag.id), flag_type=flag.flag_type)
        return flag

    async def resolve_flag(
        self, flag_id: UUID, data: FlagResolve, resolved_by_id: UUID
    ) -> Flag:
        flag = await self.get_flag(flag_id)
        if flag.status not in ("open", "acknowledged"):
            raise BadRequestError(f"Flag status is '{flag.status}', cannot resolve.")

        flag.status = data.status
        flag.resolution_note = data.resolution_note
        flag.resolved_by_id = resolved_by_id
        flag.resolved_at = datetime.now(timezone.utc)

        await self._db.commit()
        await self._db.refresh(flag)
        logger.info("flag_resolved", flag_id=str(flag.id), status=data.status)
        return flag

    async def get_flag(self, flag_id: UUID) -> Flag:
        result = await self._db.execute(select(Flag).where(Flag.id == flag_id))
        flag = result.scalar_one_or_none()
        if not flag:
            raise NotFoundError(f"Flag {flag_id} not found.")
        return flag

    async def list_flags(
        self,
        paper_id: UUID | None = None,
        status: str | None = None,
        severity: str | None = None,
        page: int = 1,
        page_size: int = 20,
    ) -> tuple[list[Flag], int]:
        query = select(Flag)
        count_query = select(func.count()).select_from(Flag)

        if paper_id:
            query = query.where(Flag.paper_id == paper_id)
            count_query = count_query.where(Flag.paper_id == paper_id)
        if status:
            query = query.where(Flag.status == status)
            count_query = count_query.where(Flag.status == status)
        if severity:
            query = query.where(Flag.severity == severity)
            count_query = count_query.where(Flag.severity == severity)

        total_result = await self._db.execute(count_query)
        total = total_result.scalar() or 0

        offset = (page - 1) * page_size
        result = await self._db.execute(
            query.order_by(Flag.created_at.desc()).offset(offset).limit(page_size)
        )
        return list(result.scalars().all()), total


class ModerationService:
    def __init__(self, db: AsyncSession) -> None:
        self._db = db

    async def create_case(
        self,
        script_id: UUID,
        paper_id: UUID,
        primary_evaluation_id: UUID,
        primary_total: float,
        risk_score: float,
        risk_factors: dict | None = None,
    ) -> ModerationCase:
        case = ModerationCase(
            script_id=script_id,
            paper_id=paper_id,
            primary_evaluation_id=primary_evaluation_id,
            primary_total=primary_total,
            risk_score=risk_score,
            risk_factors=risk_factors,
            status="pending_routing",
        )
        self._db.add(case)
        await self._db.commit()
        await self._db.refresh(case)
        logger.info("moderation_case_created", case_id=str(case.id))
        return case

    async def route_to_second(
        self, case_id: UUID, secondary_examiner_id: UUID
    ) -> ModerationCase:
        case = await self.get_case(case_id)
        if case.status != "pending_routing":
            raise BadRequestError(f"Case status is '{case.status}', cannot route.")

        # Create secondary evaluation
        from app.modules.evaluation.service import EvaluationService
        eval_svc = EvaluationService(self._db)
        evaluation = await eval_svc.assign(
            script_id=case.script_id,
            examiner_id=secondary_examiner_id,
            paper_id=case.paper_id,
            evaluation_type="secondary",
        )

        case.secondary_evaluation_id = evaluation.id
        case.secondary_examiner_id = secondary_examiner_id
        case.status = "routed"

        await self._db.commit()
        await self._db.refresh(case)
        logger.info("moderation_routed", case_id=str(case.id))
        return case

    async def reconcile(
        self,
        case_id: UUID,
        method: str,
        final_total: float,
        note: str,
        reconciled_by_id: UUID,
    ) -> ModerationCase:
        case = await self.get_case(case_id)
        if case.status not in ("pending_reconciliation", "second_in_progress"):
            raise BadRequestError(f"Case status is '{case.status}', cannot reconcile.")

        case.status = "reconciled"
        case.reconciliation_method = method
        case.final_total = final_total
        case.reconciliation_note = note
        case.reconciled_by_id = reconciled_by_id

        # Update script as finalized
        from sqlalchemy import select as sel
        from app.modules.scripts.models import Script
        script_result = await self._db.execute(
            sel(Script).where(Script.id == case.script_id)
        )
        script = script_result.scalar_one_or_none()
        if script:
            script.status = "finalized"

        await self._db.commit()
        await self._db.refresh(case)

        EventBus.publish(DomainEvent(
            event_type="moderation.reconciled",
            payload={"case_id": str(case.id), "final_total": final_total},
        ))
        logger.info("moderation_reconciled", case_id=str(case.id))
        return case

    async def get_case(self, case_id: UUID) -> ModerationCase:
        result = await self._db.execute(
            select(ModerationCase).where(ModerationCase.id == case_id)
        )
        case = result.scalar_one_or_none()
        if not case:
            raise NotFoundError(f"Moderation case {case_id} not found.")
        return case

    async def list_cases(
        self,
        paper_id: UUID | None = None,
        status: str | None = None,
        page: int = 1,
        page_size: int = 20,
    ) -> tuple[list[ModerationCase], int]:
        query = select(ModerationCase)
        count_query = select(func.count()).select_from(ModerationCase)

        if paper_id:
            query = query.where(ModerationCase.paper_id == paper_id)
            count_query = count_query.where(ModerationCase.paper_id == paper_id)
        if status:
            query = query.where(ModerationCase.status == status)
            count_query = count_query.where(ModerationCase.status == status)

        total_result = await self._db.execute(count_query)
        total = total_result.scalar() or 0

        offset = (page - 1) * page_size
        result = await self._db.execute(
            query.order_by(ModerationCase.created_at.desc()).offset(offset).limit(page_size)
        )
        return list(result.scalars().all()), total
