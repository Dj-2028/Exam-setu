"""Alembic env.py — async migration runner.

Reads the database URL from app settings (not alembic.ini)
and runs migrations against the async engine.
"""

import asyncio
from logging.config import fileConfig

from alembic import context
from sqlalchemy.ext.asyncio import create_async_engine

from app.core.config import get_settings
from app.db.base import Base

# Import all models here so they are registered with Base.metadata
# from app.modules.users.models import User
# from app.modules.exams.models import Exam, Paper, Question
# from app.modules.scripts.models import Script, Page, Region
# from app.modules.evaluation.models import Evaluation, AnswerMark
# from app.modules.flags.models import Flag
# from app.modules.moderation.models import ModerationCase
# from app.modules.audit.models import AuditEntry
# from app.modules.results.models import Result

config = context.config
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = Base.metadata


def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode — generate SQL without a live DB."""
    settings = get_settings()
    context.configure(
        url=settings.database_url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )
    with context.begin_transaction():
        context.run_migrations()


def do_run_migrations(connection) -> None:
    context.configure(connection=connection, target_metadata=target_metadata)
    with context.begin_transaction():
        context.run_migrations()


async def run_migrations_online() -> None:
    """Run migrations in 'online' mode — connect to DB and apply."""
    settings = get_settings()
    engine = create_async_engine(settings.database_url)

    async with engine.connect() as connection:
        await connection.run_sync(do_run_migrations)

    await engine.dispose()


if context.is_offline_mode():
    run_migrations_offline()
else:
    asyncio.run(run_migrations_online())
