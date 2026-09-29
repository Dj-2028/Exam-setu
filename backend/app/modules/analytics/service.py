"""Analytics service — metric computation and anomaly detection."""

from __future__ import annotations

import math
from uuid import UUID

from sqlalchemy import func, select, and_
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.logging import get_logger
from app.modules.analytics.models import ExaminerMetrics
from app.modules.evaluation.models import AnswerMark, Evaluation
from app.modules.users.models import User

logger = get_logger(__name__)


class AnalyticsService:
    def __init__(self, db: AsyncSession) -> None:
        self._db = db

    async def compute_examiner_metrics(
        self, examiner_id: UUID, paper_id: UUID
    ) -> ExaminerMetrics:
        """Recompute all metrics for an examiner on a specific paper."""

        # Fetch all evaluations for this examiner + paper
        result = await self._db.execute(
            select(Evaluation).where(
                and_(
                    Evaluation.examiner_id == examiner_id,
                    Evaluation.paper_id == paper_id,
                )
            )
        )
        evaluations = list(result.scalars().all())

        submitted = [e for e in evaluations if e.status == "submitted"]
        pending = [e for e in evaluations if e.status in ("assigned", "in_progress")]

        # Volume
        scripts_evaluated = len(submitted)
        scripts_pending = len(pending)

        # Timing
        times = [e.total_time_seconds for e in submitted if e.total_time_seconds > 0]
        avg_time = sum(times) / len(times) if times else 0
        min_time = min(times) if times else 0
        max_time = max(times) if times else 0

        # Per-question timing
        total_questions_marked = 0
        total_question_time = 0
        for e in submitted:
            marks_result = await self._db.execute(
                select(AnswerMark).where(AnswerMark.evaluation_id == e.id)
            )
            marks = list(marks_result.scalars().all())
            for m in marks:
                if m.is_marked:
                    total_questions_marked += 1
                    total_question_time += m.time_spent_seconds

        avg_time_per_q = (
            total_question_time / total_questions_marked
            if total_questions_marked > 0
            else 0
        )

        # Scoring patterns
        totals = [e.total_marks for e in submitted if e.total_marks is not None]
        avg_marks = sum(totals) / len(totals) if totals else 0
        std_dev = 0.0
        if len(totals) > 1:
            variance = sum((t - avg_marks) ** 2 for t in totals) / (len(totals) - 1)
            std_dev = math.sqrt(variance)

        # Mark distribution (histogram buckets)
        distribution: dict[str, int] = {}
        for t in totals:
            bucket = str(int(t // 10) * 10)
            distribution[bucket] = distribution.get(bucket, 0) + 1

        # AI interaction
        ai_requested = 0
        ai_accepted = 0
        ai_overrides = 0
        divergences: list[float] = []

        for e in submitted:
            marks_result = await self._db.execute(
                select(AnswerMark).where(AnswerMark.evaluation_id == e.id)
            )
            marks = list(marks_result.scalars().all())
            for m in marks:
                if m.ai_band_min is not None:
                    ai_requested += 1
                    if m.is_marked and m.mark is not None:
                        mid = (m.ai_band_min + (m.ai_band_max or m.ai_band_min)) / 2
                        divergence = abs(m.mark - mid)
                        divergences.append(divergence)
                        if m.mark >= m.ai_band_min and m.mark <= (m.ai_band_max or m.ai_band_min):
                            ai_accepted += 1
                        if m.is_override:
                            ai_overrides += 1

        avg_divergence = sum(divergences) / len(divergences) if divergences else 0

        # ── Anomaly Detection ──

        # Speed anomaly: too fast = suspicious
        speed_score = 0.0
        if avg_time > 0 and scripts_evaluated >= 3:
            # Flag if average time is < 60s per script (suspiciously fast)
            if avg_time < 60:
                speed_score = 1.0
            elif avg_time < 120:
                speed_score = 0.7
            elif avg_time < 180:
                speed_score = 0.3

        # Uniformity anomaly: low std dev = giving same marks to everyone
        uniformity_score = 0.0
        if scripts_evaluated >= 5 and avg_marks > 0:
            cv = std_dev / avg_marks if avg_marks > 0 else 0  # Coefficient of variation
            if cv < 0.05:
                uniformity_score = 1.0
            elif cv < 0.10:
                uniformity_score = 0.6
            elif cv < 0.15:
                uniformity_score = 0.3

        # Outlier anomaly: marks consistently far from peers
        outlier_score = 0.0
        # (Would compare against all examiners for the same paper — simplified here)
        if avg_divergence > 5:
            outlier_score = min(avg_divergence / 10, 1.0)

        overall_score = (
            speed_score * 0.3 + uniformity_score * 0.4 + outlier_score * 0.3
        )

        # ── Upsert metrics ──
        existing_result = await self._db.execute(
            select(ExaminerMetrics).where(
                and_(
                    ExaminerMetrics.examiner_id == examiner_id,
                    ExaminerMetrics.paper_id == paper_id,
                )
            )
        )
        metrics = existing_result.scalar_one_or_none()

        if not metrics:
            metrics = ExaminerMetrics(
                examiner_id=examiner_id, paper_id=paper_id
            )
            self._db.add(metrics)

        metrics.scripts_evaluated = scripts_evaluated
        metrics.scripts_pending = scripts_pending
        metrics.avg_time_per_script_seconds = avg_time
        metrics.avg_time_per_question_seconds = avg_time_per_q
        metrics.min_time_per_script_seconds = min_time
        metrics.max_time_per_script_seconds = max_time
        metrics.avg_total_marks = avg_marks
        metrics.std_dev_total_marks = std_dev
        metrics.mark_distribution = distribution
        metrics.ai_suggestions_requested = ai_requested
        metrics.ai_suggestions_accepted = ai_accepted
        metrics.ai_overrides = ai_overrides
        metrics.avg_ai_divergence = avg_divergence
        metrics.speed_anomaly_score = speed_score
        metrics.uniformity_anomaly_score = uniformity_score
        metrics.outlier_anomaly_score = outlier_score
        metrics.overall_anomaly_score = overall_score

        await self._db.commit()
        await self._db.refresh(metrics)

        logger.info(
            "metrics_computed",
            examiner_id=str(examiner_id),
            paper_id=str(paper_id),
            anomaly_score=overall_score,
        )
        return metrics

    async def get_paper_analytics(self, paper_id: UUID) -> dict:
        """Get aggregate analytics for a paper across all examiners."""
        result = await self._db.execute(
            select(ExaminerMetrics).where(ExaminerMetrics.paper_id == paper_id)
        )
        all_metrics = list(result.scalars().all())

        if not all_metrics:
            return {
                "paper_id": str(paper_id),
                "examiner_count": 0,
                "total_evaluated": 0,
                "total_pending": 0,
                "avg_marks_overall": 0,
                "anomalous_examiners": [],
            }

        total_evaluated = sum(m.scripts_evaluated for m in all_metrics)
        total_pending = sum(m.scripts_pending for m in all_metrics)
        avg_marks = (
            sum(m.avg_total_marks * m.scripts_evaluated for m in all_metrics)
            / total_evaluated
            if total_evaluated > 0
            else 0
        )

        # Flag examiners with high anomaly scores
        anomalous = [
            {
                "examiner_id": str(m.examiner_id),
                "overall_score": m.overall_anomaly_score,
                "speed_score": m.speed_anomaly_score,
                "uniformity_score": m.uniformity_anomaly_score,
                "outlier_score": m.outlier_anomaly_score,
                "scripts_evaluated": m.scripts_evaluated,
            }
            for m in all_metrics
            if m.overall_anomaly_score > 0.5
        ]

        return {
            "paper_id": str(paper_id),
            "examiner_count": len(all_metrics),
            "total_evaluated": total_evaluated,
            "total_pending": total_pending,
            "avg_marks_overall": round(avg_marks, 2),
            "avg_time_per_script": round(
                sum(m.avg_time_per_script_seconds for m in all_metrics)
                / len(all_metrics),
                1,
            ),
            "anomalous_examiners": anomalous,
            "examiners": [
                {
                    "examiner_id": str(m.examiner_id),
                    "scripts_evaluated": m.scripts_evaluated,
                    "scripts_pending": m.scripts_pending,
                    "avg_marks": round(m.avg_total_marks, 2),
                    "std_dev": round(m.std_dev_total_marks, 2),
                    "avg_time": round(m.avg_time_per_script_seconds, 1),
                    "ai_acceptance_rate": round(
                        m.ai_suggestions_accepted / m.ai_suggestions_requested * 100, 1
                    )
                    if m.ai_suggestions_requested > 0
                    else 0,
                    "anomaly_score": round(m.overall_anomaly_score, 2),
                }
                for m in all_metrics
            ],
        }

    async def list_examiner_metrics(
        self,
        paper_id: UUID | None = None,
        page: int = 1,
        page_size: int = 20,
    ) -> tuple[list[ExaminerMetrics], int]:
        query = select(ExaminerMetrics)
        count_query = select(func.count()).select_from(ExaminerMetrics)

        if paper_id:
            query = query.where(ExaminerMetrics.paper_id == paper_id)
            count_query = count_query.where(ExaminerMetrics.paper_id == paper_id)

        total_result = await self._db.execute(count_query)
        total = total_result.scalar() or 0

        offset = (page - 1) * page_size
        result = await self._db.execute(
            query.order_by(ExaminerMetrics.overall_anomaly_score.desc())
            .offset(offset)
            .limit(page_size)
        )
        return list(result.scalars().all()), total
