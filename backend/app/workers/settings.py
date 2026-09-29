"""ARQ worker configuration and job registration."""

from __future__ import annotations

from arq.connections import RedisSettings

from app.core.config import get_settings


async def startup(ctx: dict) -> None:
    """Worker startup: initialize settings and connections."""
    settings = get_settings()
    ctx["settings"] = settings


async def shutdown(ctx: dict) -> None:
    """Worker shutdown: clean up connections."""
    pass


# ── Job handlers (imported from modules as they're built) ──

from app.modules.scripts.tasks import process_script
# from app.modules.ai_assist.tasks import read_handwriting
# from app.modules.ai_assist.tasks import check_diagrams
# from app.modules.ai_assist.tasks import generate_suggestion
# from app.modules.moderation.tasks import compute_risk_and_route
# from app.modules.analytics.tasks import update_metrics
# from app.modules.analytics.tasks import run_detection
# from app.modules.summaries.tasks import generate_summary
# from app.modules.results.tasks import build_export
# from app.modules.audit.tasks import verify_audit_chain


class WorkerSettings:
    """ARQ worker settings — used as the entry point for the worker process.

    Start with: arq app.workers.settings.WorkerSettings
    """

    functions: list = [
        process_script,
        # detect_completeness,
        # read_handwriting,
        # check_diagrams,
        # generate_suggestion,
        # compute_risk_and_route,
        # update_metrics,
        # run_detection,
        # generate_summary,
        # build_export,
        # verify_audit_chain,
    ]

    cron_jobs: list = [
        # Scheduled jobs:
        # cron(run_detection, minute={0, 15, 30, 45}),  # Every 15 minutes
        # cron(verify_audit_chain, hour=2, minute=0),    # Nightly at 2 AM
    ]

    on_startup = startup
    on_shutdown = shutdown

    @staticmethod
    def redis_settings() -> RedisSettings:
        settings = get_settings()
        return RedisSettings.from_dsn(settings.redis_url)

    max_jobs = 10
    job_timeout = 300  # 5 minutes
    retry_jobs = True
    max_tries = 3
