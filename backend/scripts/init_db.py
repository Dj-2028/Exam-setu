"""Initialize database tables and initial demo seed data."""

import asyncio
from sqlalchemy.ext.asyncio import create_async_engine
from app.core.config import get_settings
from app.db.base import Base

# Import all models so metadata is populated
import app.modules.users.models
import app.modules.exams.models
import app.modules.scripts.models
import app.modules.evaluation.models
import app.modules.flags.models
import app.modules.audit.models
import app.modules.results.models
import app.modules.analytics.models


async def init_tables():
    settings = get_settings()
    engine = create_async_engine(settings.database_url, echo=True)
    print("Creating all tables in database...")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    print("Tables created successfully!")
    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(init_tables())
