"""Audit API routes — tamper-evident log inspection and verification."""

from __future__ import annotations

from typing import Any
from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel

from app.core.deps import AuthenticatedUser, DBSession
from app.core.security import require_roles
from app.modules.audit.service import AuditService

router = APIRouter(prefix="/audit", tags=["audit"])


class AuditEntryResponse(BaseModel):
    id: str
    sequence_number: int
    action: str
    actor_id: str | None
    actor_role: str
    payload: dict[str, Any]
    previous_hash: str
    entry_hash: str
    signature: str
    created_at: str

    class Config:
        from_attributes = True


class AuditListResponse(BaseModel):
    items: list[AuditEntryResponse]
    total: int
    page: int
    page_size: int
    total_pages: int


@router.get(
    "",
    dependencies=[Depends(require_roles("admin", "controller"))],
)
async def list_audit_entries(
    db: DBSession,
    action: str | None = Query(default=None),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=50, ge=1, le=100),
):
    """List audit trail entries with pagination."""
    svc = AuditService(db)
    entries, total = await svc.list_entries(action=action, page=page, page_size=page_size)
    total_pages = (total + page_size - 1) // page_size if page_size > 0 else 0

    items = [
        AuditEntryResponse(
            id=str(e.id),
            sequence_number=e.sequence_number,
            action=e.action,
            actor_id=str(e.actor_id) if e.actor_id else None,
            actor_role=e.actor_role,
            payload=e.payload or {},
            previous_hash=e.previous_hash,
            entry_hash=e.entry_hash,
            signature=e.signature,
            created_at=e.created_at.isoformat(),
        )
        for e in entries
    ]

    return {
        "items": items,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": total_pages,
    }


@router.get(
    "/verify",
    dependencies=[Depends(require_roles("admin", "controller"))],
)
async def verify_audit_chain(db: DBSession):
    """Verify cryptographic hash chain integrity across all audit entries."""
    svc = AuditService(db)
    return await svc.verify_chain()
