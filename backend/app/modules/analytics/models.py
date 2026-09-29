"""Analytics models — examiner metrics and anomaly detection."""

from __future__ import annotations

from datetime import datetime
from uuid import UUID

from sqlalchemy import DateTime, Float, ForeignKey, Integer, String, func
from sqlalchemy.dialects.postgresql import UUID as PGUUID, JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.core.utils import new_id
from app.db.base import Base


class ExaminerMetrics(Base):
    """Aggregated per-examiner-per-paper metrics for analytics and anomaly detection."""

    __tablename__ = "examiner_metrics"

    id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True), primary_key=True, default=new_id
    )
    examiner_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True
    )
    paper_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("papers.id"), nullable=False, index=True
    )

    # Volume
    scripts_evaluated: Mapped[int] = mapped_column(Integer, default=0)
    scripts_pending: Mapped[int] = mapped_column(Integer, default=0)

    # Timing
    avg_time_per_script_seconds: Mapped[float] = mapped_column(Float, default=0.0)
    avg_time_per_question_seconds: Mapped[float] = mapped_column(Float, default=0.0)
    min_time_per_script_seconds: Mapped[float] = mapped_column(Float, default=0.0)
    max_time_per_script_seconds: Mapped[float] = mapped_column(Float, default=0.0)

    # Scoring patterns
    avg_total_marks: Mapped[float] = mapped_column(Float, default=0.0)
    std_dev_total_marks: Mapped[float] = mapped_column(Float, default=0.0)
    mark_distribution: Mapped[dict | None] = mapped_column(JSONB, nullable=True)

    # AI interaction
    ai_suggestions_requested: Mapped[int] = mapped_column(Integer, default=0)
    ai_suggestions_accepted: Mapped[int] = mapped_column(Integer, default=0)
    ai_overrides: Mapped[int] = mapped_column(Integer, default=0)
    avg_ai_divergence: Mapped[float] = mapped_column(Float, default=0.0)

    # Anomaly scores (0–1, higher = more anomalous)
    speed_anomaly_score: Mapped[float] = mapped_column(Float, default=0.0)
    uniformity_anomaly_score: Mapped[float] = mapped_column(Float, default=0.0)
    outlier_anomaly_score: Mapped[float] = mapped_column(Float, default=0.0)
    overall_anomaly_score: Mapped[float] = mapped_column(Float, default=0.0)

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    def __repr__(self) -> str:
        return f"<ExaminerMetrics examiner={self.examiner_id} paper={self.paper_id}>"
