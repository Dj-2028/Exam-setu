"""Results models — tabulation and export."""

from __future__ import annotations

from datetime import datetime
from uuid import UUID

from sqlalchemy import DateTime, Float, ForeignKey, Integer, String, Text, func
from sqlalchemy.dialects.postgresql import UUID as PGUUID, JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.core.utils import new_id
from app.db.base import Base


class ResultEntry(Base):
    """Final computed result for a single script after all evaluations and moderation."""

    __tablename__ = "result_entries"

    id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True), primary_key=True, default=new_id
    )
    script_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("scripts.id"), nullable=False, index=True
    )
    paper_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("papers.id"), nullable=False, index=True
    )
    barcode: Mapped[str] = mapped_column(String(100), nullable=False, index=True)

    # Marks
    primary_total: Mapped[float] = mapped_column(Float, default=0.0)
    secondary_total: Mapped[float | None] = mapped_column(Float, nullable=True)
    final_total: Mapped[float] = mapped_column(Float, default=0.0)
    max_marks: Mapped[float] = mapped_column(Float, default=0.0)
    percentage: Mapped[float] = mapped_column(Float, default=0.0)

    # Status
    passed: Mapped[bool] = mapped_column(default=False)
    is_moderated: Mapped[bool] = mapped_column(default=False)
    has_flags: Mapped[bool] = mapped_column(default=False)

    # Question-level breakdown
    question_marks: Mapped[dict | None] = mapped_column(JSONB, nullable=True)

    # Metadata
    finalized_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    def __repr__(self) -> str:
        return f"<ResultEntry barcode={self.barcode} final={self.final_total}>"


class ExportJob(Base):
    """Track export job status and output file."""

    __tablename__ = "export_jobs"

    id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True), primary_key=True, default=new_id
    )
    paper_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("papers.id"), nullable=False
    )
    format: Mapped[str] = mapped_column(
        String(20), default="csv"  # csv, xlsx, pdf
    )
    status: Mapped[str] = mapped_column(
        String(30), default="pending"  # pending, generating, ready, failed
    )
    storage_key: Mapped[str] = mapped_column(String(500), default="")
    row_count: Mapped[int] = mapped_column(Integer, default=0)
    error: Mapped[str | None] = mapped_column(Text, nullable=True)

    requested_by_id: Mapped[UUID | None] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("users.id"), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    completed_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    def __repr__(self) -> str:
        return f"<ExportJob {self.id} format={self.format} status={self.status}>"
