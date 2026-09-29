"""Results service — tabulation, finalization, and export generation."""

from __future__ import annotations

import csv
import io
from datetime import datetime, timezone
from uuid import UUID

from sqlalchemy import func, select, and_
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import BadRequestError, NotFoundError
from app.core.logging import get_logger
from app.modules.evaluation.models import AnswerMark, Evaluation
from app.modules.exams.models import Paper, Question
from app.modules.flags.models import Flag, ModerationCase
from app.modules.results.models import ExportJob, ResultEntry
from app.modules.scripts.models import Script

logger = get_logger(__name__)


class ResultsService:
    def __init__(self, db: AsyncSession) -> None:
        self._db = db

    async def tabulate_paper(self, paper_id: UUID) -> list[ResultEntry]:
        """Compute final results for all scripts in a paper.

        Rules:
          - If moderated → use moderation final_total
          - If secondary eval exists → use average unless moderated
          - Otherwise → use primary evaluation total
        """
        paper = await self._get_paper(paper_id)

        # Get all scripts for this paper
        scripts_result = await self._db.execute(
            select(Script).where(Script.paper_id == paper_id)
        )
        scripts = list(scripts_result.scalars().all())

        results: list[ResultEntry] = []

        for script in scripts:
            # Get evaluations
            evals_result = await self._db.execute(
                select(Evaluation).where(Evaluation.script_id == script.id)
            )
            evaluations = list(evals_result.scalars().all())

            primary = next(
                (e for e in evaluations if e.evaluation_type == "primary" and e.status == "submitted"),
                None,
            )
            secondary = next(
                (e for e in evaluations if e.evaluation_type == "secondary" and e.status == "submitted"),
                None,
            )

            if not primary:
                continue  # Script not evaluated yet

            primary_total = primary.total_marks or 0.0
            secondary_total = secondary.total_marks if secondary else None

            # Check for moderation
            mod_result = await self._db.execute(
                select(ModerationCase).where(
                    and_(
                        ModerationCase.script_id == script.id,
                        ModerationCase.status == "reconciled",
                    )
                )
            )
            moderation = mod_result.scalar_one_or_none()

            if moderation and moderation.final_total is not None:
                final_total = moderation.final_total
                is_moderated = True
            elif secondary_total is not None:
                final_total = (primary_total + secondary_total) / 2
                is_moderated = False
            else:
                final_total = primary_total
                is_moderated = False

            # Check for flags
            flag_result = await self._db.execute(
                select(func.count())
                .select_from(Flag)
                .where(Flag.script_id == script.id)
            )
            has_flags = (flag_result.scalar() or 0) > 0

            # Question-level breakdown
            question_marks = await self._get_question_breakdown(primary.id, paper_id)

            percentage = (final_total / paper.total_marks * 100) if paper.total_marks > 0 else 0
            passed = final_total >= paper.passing_marks

            # Upsert ResultEntry
            existing_result = await self._db.execute(
                select(ResultEntry).where(ResultEntry.script_id == script.id)
            )
            entry = existing_result.scalar_one_or_none()

            if not entry:
                entry = ResultEntry(script_id=script.id, paper_id=paper_id)
                self._db.add(entry)

            entry.barcode = script.barcode
            entry.primary_total = primary_total
            entry.secondary_total = secondary_total
            entry.final_total = final_total
            entry.max_marks = paper.total_marks
            entry.percentage = round(percentage, 2)
            entry.passed = passed
            entry.is_moderated = is_moderated
            entry.has_flags = has_flags
            entry.question_marks = question_marks
            entry.finalized_at = datetime.now(timezone.utc)

            results.append(entry)

        await self._db.commit()
        for r in results:
            await self._db.refresh(r)

        logger.info(
            "paper_tabulated",
            paper_id=str(paper_id),
            result_count=len(results),
        )
        return results

    async def get_results(
        self,
        paper_id: UUID,
        page: int = 1,
        page_size: int = 50,
    ) -> tuple[list[ResultEntry], int]:
        query = select(ResultEntry).where(ResultEntry.paper_id == paper_id)
        count_query = select(func.count()).select_from(ResultEntry).where(
            ResultEntry.paper_id == paper_id
        )

        total_result = await self._db.execute(count_query)
        total = total_result.scalar() or 0

        offset = (page - 1) * page_size
        result = await self._db.execute(
            query.order_by(ResultEntry.barcode).offset(offset).limit(page_size)
        )
        return list(result.scalars().all()), total

    async def get_summary(self, paper_id: UUID) -> dict:
        """Get result summary statistics."""
        result = await self._db.execute(
            select(ResultEntry).where(ResultEntry.paper_id == paper_id)
        )
        entries = list(result.scalars().all())

        if not entries:
            return {
                "paper_id": str(paper_id),
                "total_results": 0,
                "passed": 0,
                "failed": 0,
                "pass_rate": 0,
                "avg_marks": 0,
                "highest": 0,
                "lowest": 0,
                "moderated_count": 0,
                "flagged_count": 0,
            }

        totals = [e.final_total for e in entries]
        passed = sum(1 for e in entries if e.passed)
        return {
            "paper_id": str(paper_id),
            "total_results": len(entries),
            "passed": passed,
            "failed": len(entries) - passed,
            "pass_rate": round(passed / len(entries) * 100, 1) if entries else 0,
            "avg_marks": round(sum(totals) / len(totals), 2) if totals else 0,
            "highest": max(totals) if totals else 0,
            "lowest": min(totals) if totals else 0,
            "moderated_count": sum(1 for e in entries if e.is_moderated),
            "flagged_count": sum(1 for e in entries if e.has_flags),
        }

    async def generate_export(
        self,
        paper_id: UUID,
        format: str,
        requested_by_id: UUID | None = None,
    ) -> ExportJob:
        """Create an export job (CSV/XLSX/PDF)."""
        job = ExportJob(
            paper_id=paper_id,
            format=format,
            status="generating",
            requested_by_id=requested_by_id,
        )
        self._db.add(job)
        await self._db.commit()
        await self._db.refresh(job)

        try:
            results, total = await self.get_results(paper_id, page=1, page_size=10000)
            paper = await self._get_paper(paper_id)

            if format == "csv":
                content = self._generate_csv(results, paper)
                content_type = "text/csv"
                extension = "csv"
            else:
                # Default to CSV for now; XLSX/PDF would use openpyxl/reportlab
                content = self._generate_csv(results, paper)
                content_type = "text/csv"
                extension = "csv"

            # Upload to storage
            storage_key = f"exports/{paper_id}/{job.id}.{extension}"

            from app.integrations.storage.r2 import get_storage_client
            storage = get_storage_client()
            await storage.upload(storage_key, content.encode("utf-8"), content_type)

            job.storage_key = storage_key
            job.status = "ready"
            job.row_count = len(results)
            job.completed_at = datetime.now(timezone.utc)

        except Exception as e:
            job.status = "failed"
            job.error = str(e)
            logger.error("export_failed", job_id=str(job.id), error=str(e))

        await self._db.commit()
        await self._db.refresh(job)
        return job

    async def get_export_job(self, job_id: UUID) -> ExportJob:
        result = await self._db.execute(
            select(ExportJob).where(ExportJob.id == job_id)
        )
        job = result.scalar_one_or_none()
        if not job:
            raise NotFoundError(f"Export job {job_id} not found.")
        return job

    async def list_exports(
        self, paper_id: UUID
    ) -> list[ExportJob]:
        result = await self._db.execute(
            select(ExportJob)
            .where(ExportJob.paper_id == paper_id)
            .order_by(ExportJob.created_at.desc())
            .limit(20)
        )
        return list(result.scalars().all())

    # ── Helpers ──

    def _generate_csv(self, results: list[ResultEntry], paper: Paper) -> str:
        """Generate CSV content from result entries."""
        output = io.StringIO()
        writer = csv.writer(output)

        # Header
        header = [
            "Barcode",
            "Primary Total",
            "Secondary Total",
            "Final Total",
            "Max Marks",
            "Percentage",
            "Pass/Fail",
            "Moderated",
            "Flagged",
        ]

        # Add question columns from first entry
        if results and results[0].question_marks:
            q_keys = sorted(results[0].question_marks.keys())
            header.extend([f"Q{k}" for k in q_keys])

        writer.writerow(header)

        for entry in results:
            row = [
                entry.barcode,
                entry.primary_total,
                entry.secondary_total or "",
                entry.final_total,
                entry.max_marks,
                f"{entry.percentage:.1f}%",
                "PASS" if entry.passed else "FAIL",
                "Yes" if entry.is_moderated else "No",
                "Yes" if entry.has_flags else "No",
            ]
            if entry.question_marks:
                q_keys = sorted(entry.question_marks.keys())
                row.extend([entry.question_marks.get(k, "") for k in q_keys])
            writer.writerow(row)

        return output.getvalue()

    async def _get_paper(self, paper_id: UUID) -> Paper:
        result = await self._db.execute(
            select(Paper).where(Paper.id == paper_id)
        )
        paper = result.scalar_one_or_none()
        if not paper:
            raise NotFoundError(f"Paper {paper_id} not found.")
        return paper

    async def _get_question_breakdown(
        self, evaluation_id: UUID, paper_id: UUID
    ) -> dict:
        """Get question-level marks for an evaluation."""
        result = await self._db.execute(
            select(AnswerMark).where(AnswerMark.evaluation_id == evaluation_id)
        )
        marks = list(result.scalars().all())

        questions_result = await self._db.execute(
            select(Question)
            .where(Question.paper_id == paper_id)
            .order_by(Question.order_index)
        )
        questions = list(questions_result.scalars().all())

        q_map = {q.id: q for q in questions}
        breakdown = {}
        for m in marks:
            if m.question_id in q_map:
                q = q_map[m.question_id]
                key = f"{q.question_number}{q.sub_part}"
                breakdown[key] = m.mark if m.mark is not None else 0

        return breakdown
