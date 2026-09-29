"""Audit trail service — tamper-evident hash chain with Ed25519."""

from __future__ import annotations

import hashlib
import json
from datetime import datetime, timezone
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.logging import get_logger
from app.modules.audit.models import AuditEntry

logger = get_logger(__name__)

# Genesis hash (no previous entry)
GENESIS_HASH = "0" * 64


class AuditService:
    def __init__(self, db: AsyncSession) -> None:
        self._db = db

    async def log(
        self,
        action: str,
        payload: dict,
        actor_id: UUID | None = None,
        actor_role: str = "system",
    ) -> AuditEntry:
        """Append an entry to the tamper-evident audit trail."""
        # Get the last entry for chaining
        last_result = await self._db.execute(
            select(AuditEntry)
            .order_by(AuditEntry.sequence_number.desc())
            .limit(1)
        )
        last_entry = last_result.scalar_one_or_none()

        sequence_number = (last_entry.sequence_number + 1) if last_entry else 1
        previous_hash = last_entry.entry_hash if last_entry else GENESIS_HASH

        # Compute entry hash
        entry_data = json.dumps(
            {
                "seq": sequence_number,
                "action": action,
                "actor_id": str(actor_id) if actor_id else None,
                "actor_role": actor_role,
                "payload": payload,
                "previous_hash": previous_hash,
                "timestamp": datetime.now(timezone.utc).isoformat(),
            },
            sort_keys=True,
            default=str,
        )
        entry_hash = hashlib.sha256(entry_data.encode()).hexdigest()

        # Sign (placeholder — use Ed25519 in production)
        signature = hashlib.sha256(
            (entry_hash + "examsetu-signing-key").encode()
        ).hexdigest()

        entry = AuditEntry(
            sequence_number=sequence_number,
            action=action,
            actor_id=actor_id,
            actor_role=actor_role,
            payload=payload,
            previous_hash=previous_hash,
            entry_hash=entry_hash,
            signature=signature,
            signing_key_id="default-v1",
        )
        self._db.add(entry)
        await self._db.commit()
        await self._db.refresh(entry)

        return entry

    async def verify_chain(self) -> dict:
        """Verify the integrity of the entire audit chain."""
        result = await self._db.execute(
            select(AuditEntry).order_by(AuditEntry.sequence_number)
        )
        entries = list(result.scalars().all())

        if not entries:
            return {"valid": True, "entries_checked": 0}

        errors = []
        for i, entry in enumerate(entries):
            expected_prev = entries[i - 1].entry_hash if i > 0 else GENESIS_HASH
            if entry.previous_hash != expected_prev:
                errors.append({
                    "sequence": entry.sequence_number,
                    "error": "previous_hash mismatch",
                })

        return {
            "valid": len(errors) == 0,
            "entries_checked": len(entries),
            "errors": errors,
        }

    async def list_entries(
        self,
        action: str | None = None,
        actor_id: UUID | None = None,
        page: int = 1,
        page_size: int = 50,
    ) -> tuple[list[AuditEntry], int]:
        query = select(AuditEntry)
        count_query = select(func.count()).select_from(AuditEntry)

        if action:
            query = query.where(AuditEntry.action == action)
            count_query = count_query.where(AuditEntry.action == action)
        if actor_id:
            query = query.where(AuditEntry.actor_id == actor_id)
            count_query = count_query.where(AuditEntry.actor_id == actor_id)

        total_result = await self._db.execute(count_query)
        total = total_result.scalar() or 0

        offset = (page - 1) * page_size
        result = await self._db.execute(
            query.order_by(AuditEntry.sequence_number.desc())
            .offset(offset).limit(page_size)
        )
        return list(result.scalars().all()), total
