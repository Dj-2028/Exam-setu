"""ExamSetu AI — FastAPI application factory.

Creates the app, registers routes, middleware, error handlers and lifespan events.
"""

from __future__ import annotations

from contextlib import asynccontextmanager
from uuid import uuid4

from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import get_settings
from app.core.errors import register_error_handlers
from app.core.logging import get_logger, setup_logging

logger = get_logger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan: setup and teardown."""
    settings = get_settings()
    setup_logging(settings.log_level)

    logger.info(
        "app_starting",
        env=settings.env,
        api_base_url=settings.api_base_url,
    )
    yield
    logger.info("app_shutting_down")


def create_app() -> FastAPI:
    """Create and configure the FastAPI application."""
    settings = get_settings()

    app = FastAPI(
        title="ExamSetu AI",
        description="AI-augmented On-Screen Marking & Evaluation Platform",
        version="0.1.0",
        docs_url="/docs" if not settings.is_production else None,
        redoc_url="/redoc" if not settings.is_production else None,
        lifespan=lifespan,
        default_response_class=None,
    )

    # ── CORS ──
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # ── Request ID middleware ──
    @app.middleware("http")
    async def add_request_id(request: Request, call_next) -> Response:
        request_id = str(uuid4())
        request.state.request_id = request_id
        response = await call_next(request)
        response.headers["X-Request-ID"] = request_id
        return response

    # ── Error handlers ──
    register_error_handlers(app)

    # ── Health checks ──
    @app.get("/health/live", tags=["system"])
    async def health_live():
        """Liveness check — process is up."""
        return {"status": "ok"}

    @app.get("/health/ready", tags=["system"])
    async def health_ready():
        """Readiness check — database and Redis are reachable."""
        # TODO: Add actual db/redis ping checks
        return {"status": "ok"}

    # ── Register module routers ──
    _register_routers(app)

    return app


def _register_routers(app: FastAPI) -> None:
    """Import and register all module routers under /api/v1."""
    from app.modules.auth.router import router as auth_router
    from app.modules.users.router import router as users_router
    from app.modules.exams.router import router as exams_router
    from app.modules.scripts.router import router as scripts_router
    from app.modules.evaluation.router import router as evaluation_router
    from app.modules.flags.router import router as flags_router
    from app.modules.analytics.router import router as analytics_router
    from app.modules.results.router import router as results_router
    from app.modules.realtime.router import router as realtime_router

    api_prefix = "/api/v1"
    app.include_router(auth_router, prefix=api_prefix)
    app.include_router(users_router, prefix=api_prefix)
    app.include_router(exams_router, prefix=api_prefix)
    app.include_router(scripts_router, prefix=api_prefix)
    app.include_router(evaluation_router, prefix=api_prefix)
    app.include_router(flags_router, prefix=api_prefix)
    app.include_router(analytics_router, prefix=api_prefix)
    app.include_router(results_router, prefix=api_prefix)
    app.include_router(realtime_router, prefix=api_prefix)


# Application instance (used by uvicorn)
app = create_app()
