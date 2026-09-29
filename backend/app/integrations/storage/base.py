"""Object storage abstraction and Cloudflare R2 implementation."""

from __future__ import annotations

from abc import ABC, abstractmethod


class StorageClient(ABC):
    """Interface for object storage operations."""

    @abstractmethod
    async def upload(
        self,
        key: str,
        data: bytes,
        content_type: str = "application/octet-stream",
    ) -> str:
        """Upload an object and return the storage key."""
        ...

    @abstractmethod
    async def download(self, key: str) -> bytes:
        """Download an object by key."""
        ...

    @abstractmethod
    async def generate_upload_url(
        self, key: str, content_type: str, expires_in: int = 3600
    ) -> str:
        """Generate a pre-signed upload URL."""
        ...

    @abstractmethod
    async def generate_download_url(
        self, key: str, expires_in: int = 3600
    ) -> str:
        """Generate a pre-signed download URL."""
        ...

    @abstractmethod
    async def delete(self, key: str) -> None:
        """Delete an object by key."""
        ...
