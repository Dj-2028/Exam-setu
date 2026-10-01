"""Cloudflare R2 storage implementation (S3-compatible)."""

from __future__ import annotations

import asyncio
from functools import partial

import boto3
from botocore.config import Config

from app.core.config import get_settings
from app.core.logging import get_logger
from app.integrations.storage.base import StorageClient

logger = get_logger(__name__)


class R2StorageClient(StorageClient):
    """Cloudflare R2 object storage via the S3-compatible API."""

    def __init__(self) -> None:
        settings = get_settings()
        self._bucket = settings.r2_bucket
        region = (
            "auto"
            if "r2.cloudflarestorage.com" in (settings.r2_endpoint or "")
            else settings.r2_region
        )
        self._client = boto3.client(
            "s3",
            endpoint_url=settings.r2_endpoint,
            aws_access_key_id=settings.r2_access_key_id,
            aws_secret_access_key=settings.r2_secret_access_key,
            config=Config(
                signature_version="s3v4",
                region_name=region,
            ),
        )

    async def upload(
        self,
        key: str,
        data: bytes,
        content_type: str = "application/octet-stream",
    ) -> str:
        """Upload an object to R2 (with local disk fallback)."""
        try:
            loop = asyncio.get_event_loop()
            await loop.run_in_executor(
                None,
                partial(
                    self._client.put_object,
                    Bucket=self._bucket,
                    Key=key,
                    Body=data,
                    ContentType=content_type,
                ),
            )
            logger.info("storage_upload", key=key, content_type=content_type)
        except Exception as e:
            logger.warning(
                "storage_upload_r2_failed_using_local_fallback",
                key=key,
                error=str(e),
            )
            import os
            local_path = os.path.join("uploads", key.replace("/", "_"))
            os.makedirs(os.path.dirname(local_path) or ".", exist_ok=True)
            with open(local_path, "wb") as f:
                f.write(data)
        return key

    async def download(self, key: str) -> bytes:
        """Download an object from R2 (with local disk fallback)."""
        try:
            loop = asyncio.get_event_loop()
            response = await loop.run_in_executor(
                None,
                partial(
                    self._client.get_object,
                    Bucket=self._bucket,
                    Key=key,
                ),
            )
            data = response["Body"].read()
            logger.info("storage_download", key=key, size=len(data))
            return data
        except Exception as e:
            logger.warning(
                "storage_download_r2_failed_trying_local_fallback",
                key=key,
                error=str(e),
            )
            import os
            local_path = os.path.join("uploads", key.replace("/", "_"))
            if os.path.exists(local_path):
                with open(local_path, "rb") as f:
                    return f.read()
            raise

    async def generate_upload_url(
        self, key: str, content_type: str, expires_in: int = 3600
    ) -> str:
        """Generate a pre-signed URL for direct browser upload."""
        loop = asyncio.get_event_loop()
        url = await loop.run_in_executor(
            None,
            partial(
                self._client.generate_presigned_url,
                "put_object",
                Params={
                    "Bucket": self._bucket,
                    "Key": key,
                    "ContentType": content_type,
                },
                ExpiresIn=expires_in,
            ),
        )
        return url

    async def generate_download_url(
        self, key: str, expires_in: int = 3600
    ) -> str:
        """Generate a short-lived pre-signed download URL."""
        loop = asyncio.get_event_loop()
        url = await loop.run_in_executor(
            None,
            partial(
                self._client.generate_presigned_url,
                "get_object",
                Params={
                    "Bucket": self._bucket,
                    "Key": key,
                },
                ExpiresIn=expires_in,
            ),
        )
        return url

    async def delete(self, key: str) -> None:
        """Delete an object from R2."""
        loop = asyncio.get_event_loop()
        await loop.run_in_executor(
            None,
            partial(
                self._client.delete_object,
                Bucket=self._bucket,
                Key=key,
            ),
        )
        logger.info("storage_delete", key=key)


_storage_client: R2StorageClient | None = None


def get_storage_client() -> R2StorageClient:
    global _storage_client
    if _storage_client is None:
        _storage_client = R2StorageClient()
    return _storage_client
