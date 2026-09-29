"""Utility helpers: ID generation, timestamps, hashing."""

from __future__ import annotations

import hashlib
import json
from datetime import datetime, timezone
from typing import Any
from uuid import UUID, uuid4


def new_id() -> UUID:
    """Generate a new UUID4 identifier."""
    return uuid4()


def utcnow() -> datetime:
    """Return the current UTC datetime (timezone-aware)."""
    return datetime.now(timezone.utc)


def canonical_json(data: dict[str, Any]) -> str:
    """Produce a canonical JSON string for hashing.

    Keys are sorted, no whitespace, ASCII-safe.
    """
    return json.dumps(data, sort_keys=True, separators=(",", ":"), default=str)


def sha256_hex(data: str) -> str:
    """Compute the SHA-256 hex digest of a string."""
    return hashlib.sha256(data.encode("utf-8")).hexdigest()


def chain_hash(previous_hash: str, record_json: str) -> str:
    """Compute audit chain hash: SHA-256(previous_hash || record_json)."""
    combined = previous_hash + record_json
    return sha256_hex(combined)
