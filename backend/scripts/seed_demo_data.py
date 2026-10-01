"""Seed realistic demo data into Neon DB for ExamSetu AI hackathon presentation."""

import asyncio
from uuid import uuid4
from datetime import datetime, timezone
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy import select

from app.core.config import get_settings
from app.modules.users.models import User
from app.modules.exams.models import Exam, Paper, Question
from app.modules.scripts.models import Script, Page, Region
from app.modules.evaluation.models import Evaluation, AnswerMark
from app.modules.flags.models import Flag, ModerationCase
from app.modules.analytics.models import ExaminerMetrics


async def seed():
    settings = get_settings()
    engine = create_async_engine(settings.database_url)
    session_factory = async_sessionmaker(bind=engine, class_=AsyncSession, expire_on_commit=False)

    async with session_factory() as session:
        # Check if users already seeded
        res = await session.execute(select(User).limit(1))
        if res.scalar_one_or_none():
            print("Data already present in database, skipping seed.")
            return

        print("Seeding initial users...")
        now = datetime.now(timezone.utc)

        examiner = User(
            id=uuid4(),
            clerk_user_id="user_mock_examiner",
            email="examiner@examsetu.dev",
            name="Dr. Rajesh Sharma (Examiner)",
            role="examiner",
            is_active=True,
            created_at=now,
            updated_at=now,
        )
        controller = User(
            id=uuid4(),
            clerk_user_id="user_mock_controller",
            email="controller@examsetu.dev",
            name="Prof. Sunita Verma (Controller)",
            role="controller",
            is_active=True,
            created_at=now,
            updated_at=now,
        )
        admin = User(
            id=uuid4(),
            clerk_user_id="user_mock_admin",
            email="admin@examsetu.dev",
            name="Vikram Singh (Admin)",
            role="admin",
            is_active=True,
            created_at=now,
            updated_at=now,
        )
        dev = User(
            id=uuid4(),
            clerk_user_id="user_mock_dev",
            email="dev@examsetu.dev",
            name="Antigravity Dev",
            role="admin",
            is_active=True,
            created_at=now,
            updated_at=now,
        )
        session.add_all([examiner, controller, admin, dev])
        await session.flush()

        print("Seeding exams and papers...")
        exam = Exam(
            id=uuid4(),
            name="B.Sc Computer Science - Semester VI (June 2026)",
            code="BSC-CS-2026-S6",
            session="June 2026",
            status="active",
            created_at=now,
            updated_at=now,
        )
        session.add(exam)
        await session.flush()

        paper = Paper(
            id=uuid4(),
            exam_id=exam.id,
            name="Design and Analysis of Algorithms",
            code="CS-601",
            total_marks=100.0,
            passing_marks=33.0,
            increment=0.5,
            language="en",
            status="evaluation_in_progress",
            moderation_threshold=0.15,
            ai_suggestions_enabled=True,
            created_at=now,
            updated_at=now,
        )
        session.add(paper)
        await session.flush()

        # Questions
        questions = [
            Question(
                id=uuid4(),
                paper_id=paper.id,
                question_number=1,
                sub_part="",
                text="Explain Dijkstra's shortest path algorithm with time complexity and state conditions where it fails.",
                max_marks=10.0,
                answer_type="text_with_diagram",
                rubric="Step 1: Graph initialization (2 marks). Step 2: Priority queue relaxation (4 marks). Step 3: Complexity analysis (2 marks). Step 4: Negative weight failure explanation (2 marks).",
                model_answer="Dijkstra's algorithm finds shortest paths from a single source vertex to all other vertices in a weighted graph with non-negative edge weights...",
                order_index=1,
                expected_pages_min=1,
                expected_pages_max=2,
                created_at=now,
            ),
            Question(
                id=uuid4(),
                paper_id=paper.id,
                question_number=2,
                sub_part="",
                text="Compare Dynamic Programming vs Greedy Approach with 0/1 Knapsack vs Fractional Knapsack.",
                max_marks=10.0,
                answer_type="text",
                rubric="Tabular comparison (4 marks), Recurrence relation for 0/1 knapsack (3 marks), Greedy choice proof for Fractional knapsack (3 marks).",
                model_answer="Greedy algorithms make the locally optimal choice at each step; dynamic programming considers all sub-problems and avoids recalculation...",
                order_index=2,
                expected_pages_min=1,
                expected_pages_max=2,
                created_at=now,
            ),
            Question(
                id=uuid4(),
                paper_id=paper.id,
                question_number=3,
                sub_part="",
                text="Solve the Recurrence relation T(n) = 2T(n/2) + O(n) using Master's Theorem.",
                max_marks=10.0,
                answer_type="numerical",
                rubric="Identification of a, b, f(n) (3 marks). Application of Case 2 (4 marks). Final O(n log n) solution (3 marks).",
                model_answer="Given a = 2, b = 2, f(n) = n. Since n^(log_b a) = n^(log_2 2) = n^1 = n = f(n), by Case 2 of Master Theorem, T(n) = Theta(n log n).",
                order_index=3,
                expected_pages_min=1,
                expected_pages_max=1,
                created_at=now,
            ),
        ]
        session.add_all(questions)
        await session.flush()

        print("Seeding scripts and evaluations...")
        for i in range(1, 7):
            script = Script(
                id=uuid4(),
                paper_id=paper.id,
                barcode=f"MP-2026-CS-00{i}",
                storage_key=f"scans/CS-601/MP-2026-CS-00{i}.pdf",
                page_count=4,
                status="assigned" if i > 2 else "evaluation_in_progress",
                created_at=now,
                updated_at=now,
            )
            session.add(script)
            await session.flush()

            # Seed a sample page and region for the script
            page = Page(
                id=uuid4(),
                script_id=script.id,
                page_number=1,
                storage_key=f"scans/CS-601/MP-2026-CS-00{i}/p1.jpg",
                width=1654,
                height=2338,
                created_at=now,
            )
            session.add(page)
            await session.flush()

            region = Region(
                id=uuid4(),
                page_id=page.id,
                question_id=questions[0].id,
                bbox_x=50.0,
                bbox_y=100.0,
                bbox_w=1500.0,
                bbox_h=600.0,
                transcription="Dijkstra's Algorithm: Let G = (V, E) be a directed or undirected graph with non-negative edge weights. Initialize dist[s]=0 and dist[v]=infinity for all other vertices...",
                transcription_confidence=0.96,
                language_detected="en",
                has_diagram=True,
                diagram_description="Graph with vertices A, B, C, D and edge weights",
                is_blank=False,
                order_index=1,
                created_at=now,
            )
            session.add(region)
            await session.flush()

            # Evaluation for examiner
            ev_status = "assigned" if i > 3 else "in_progress" if i == 3 else "submitted"
            eval_record = Evaluation(
                id=uuid4(),
                script_id=script.id,
                examiner_id=examiner.id,
                paper_id=paper.id,
                evaluation_type="primary",
                status=ev_status,
                total_marks=24.5 if ev_status == "submitted" else None,
                total_time_seconds=420 if ev_status == "submitted" else 150,
                created_at=now,
                started_at=now if ev_status != "assigned" else None,
                completed_at=now if ev_status == "submitted" else None,
            )
            session.add(eval_record)
            await session.flush()

            # Answer marks for the submitted/in-progress evaluations
            for q_idx, q in enumerate(questions):
                ans_mark = AnswerMark(
                    id=uuid4(),
                    evaluation_id=eval_record.id,
                    question_id=q.id,
                    region_id=region.id if q_idx == 0 else None,
                    mark=8.5 if ev_status == "submitted" else (7.0 if q_idx == 0 else None),
                    is_marked=(ev_status == "submitted" or q_idx == 0),
                    ai_band_min=7.0,
                    ai_band_max=9.0,
                    ai_confidence=0.92,
                    ai_reasons=["Accurate pseudocode", "Missing one edge case in complexity"],
                    is_override=False,
                    transcription="Sample student solution transcription for " + q.text[:30],
                    transcription_confidence=0.94,
                    has_flag=False,
                    time_spent_seconds=60,
                    created_at=now,
                    updated_at=now,
                )
                session.add(ans_mark)

            # Flags on script 2 and 4
            if i in (2, 4):
                flag = Flag(
                    id=uuid4(),
                    flag_type="ai_divergence" if i == 2 else "diagram_missing",
                    severity="medium",
                    status="open",
                    script_id=script.id,
                    evaluation_id=eval_record.id,
                    examiner_id=examiner.id,
                    paper_id=paper.id,
                    message=f"Flag on script {script.barcode}: AI score divergence exceeds threshold." if i == 2 else f"Flag on {script.barcode}: Expected graph diagram was omitted.",
                    raised_by="ai_pipeline",
                    created_at=now,
                )
                session.add(flag)

        # Moderation case
        mod_case = ModerationCase(
            id=uuid4(),
            script_id=script.id,
            paper_id=paper.id,
            risk_score=0.78,
            risk_factors=["ai_divergence_high", "time_under_threshold"],
            primary_evaluation_id=eval_record.id,
            primary_total=24.5,
            status="pending_routing",
            created_at=now,
            updated_at=now,
        )
        session.add(mod_case)

        # Examiner metric
        metric = ExaminerMetrics(
            id=uuid4(),
            examiner_id=examiner.id,
            paper_id=paper.id,
            scripts_evaluated=14,
            scripts_pending=6,
            avg_time_per_script_seconds=380.0,
            avg_time_per_question_seconds=42.0,
            avg_total_marks=22.4,
            std_dev_total_marks=3.2,
            speed_anomaly_score=0.12,
            uniformity_anomaly_score=0.08,
            outlier_anomaly_score=0.15,
            overall_anomaly_score=0.11,
            updated_at=now,
        )
        session.add(metric)

        await session.commit()
        print("Demo data seeded successfully into Neon DB!")

    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(seed())
