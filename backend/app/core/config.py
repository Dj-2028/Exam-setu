"""ExamSetu AI — Typed application settings.

All configuration comes from environment variables, validated at startup.
The app fails fast if required values are missing.
"""

from __future__ import annotations

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application configuration loaded from environment."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # ── App ──
    env: str = Field(default="dev", description="dev | staging | production")
    log_level: str = Field(default="INFO")
    frontend_origins: str = Field(default="http://localhost:3000")
    api_base_url: str = Field(default="http://localhost:8000")

    # ── Database ──
    database_url: str = Field(
        ..., description="Async Postgres URL (postgresql+asyncpg://...)"
    )

    @field_validator("database_url", mode="after")
    @classmethod
    def assemble_db_connection(cls, v: str) -> str:
        if v.startswith("postgresql://"):
            return v.replace("postgresql://", "postgresql+asyncpg://", 1)
        return v

    # ── Redis ──
    redis_url: str = Field(default="redis://localhost:6379")

    # ── Clerk Auth ──
    clerk_secret_key: str = Field(
        default="",
        description="Clerk secret key (sk_test_...)",
    )
    clerk_publishable_key: str = Field(
        default="",
        description="Clerk publishable key (pk_test_...)",
    )
    clerk_jwks_url: str = Field(
        default="https://api.clerk.com/v1/jwks",
        description="Clerk JWKS URL for JWT verification",
    )

    # ── Object Storage (S3 / R2 / Supabase) ──
    r2_endpoint: str = Field(...)
    r2_access_key_id: str = Field(...)
    r2_secret_access_key: str = Field(...)
    r2_bucket: str = Field(default="examsetu-scans")
    r2_region: str = Field(default="us-east-1")

    # ── AI Providers ──
    gemini_api_key: str = Field(...)
    gemini_model_vision: str = Field(default="gemini-2.0-flash")
    gemini_model_text: str = Field(default="gemini-2.0-flash")
    groq_api_key: str = Field(...)
    groq_model: str = Field(default="llama-3.3-70b-versatile")
    ai_suggestion_timeout: int = Field(default=30)
    ai_handwriting_timeout: int = Field(default=30)

    # ── Audit Signing ──
    audit_signing_private_key: str = Field(
        ..., description="Base64-encoded Ed25519 private key"
    )
    audit_signing_key_id: str = Field(default="key-001")

    # ── Observability ──
    sentry_dsn: str = Field(default="")

    @property
    def is_production(self) -> bool:
        return self.env == "production"

    @property
    def cors_origins(self) -> list[str]:
        return [o.strip() for o in self.frontend_origins.split(",") if o.strip()]


_settings: Settings | None = None


def get_settings() -> Settings:
    """Return the singleton settings instance (lazy-loaded)."""
    global _settings
    if _settings is None:
        _settings = Settings()  # type: ignore[call-arg]
    return _settings
