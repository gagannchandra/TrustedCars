import boto3
from botocore.exceptions import ClientError
from botocore.client import Config
import uuid
import logging
from typing import Optional
from app.core.config import settings
from app.shared.exceptions.handlers import CustomException

logger = logging.getLogger(__name__)

class StorageProvider:
    def get_public_url(self, storage_key: str) -> str:
        raise NotImplementedError

    def delete_object(self, storage_key: str) -> None:
        raise NotImplementedError

    def delete_objects(self, storage_keys: list[str]) -> None:
        raise NotImplementedError


class S3StorageProvider(StorageProvider):
    def __init__(self):
        self.bucket = settings.S3_BUCKET_NAME
        # Use signature_version s3v4 for presigned URLs
        self.s3_client = boto3.client(
            "s3",
            region_name=settings.AWS_REGION,
            aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
            aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
            endpoint_url=settings.S3_ENDPOINT_URL,
            config=Config(signature_version="s3v4"),
        )

    def delete_object(self, storage_key: str) -> None:
        try:
            self.s3_client.delete_object(Bucket=self.bucket, Key=storage_key)
        except ClientError as e:
            logger.error(f"Failed to delete object {storage_key}: {e}")

    def delete_objects(self, storage_keys: list[str]) -> None:
        if not storage_keys:
            return
        
        chunk_size = 1000
        for i in range(0, len(storage_keys), chunk_size):
            chunk = storage_keys[i:i + chunk_size]
            delete_params = {
                "Objects": [{"Key": key} for key in chunk],
                "Quiet": True
            }
            try:
                self.s3_client.delete_objects(Bucket=self.bucket, Delete=delete_params)
            except ClientError as e:
                logger.error(f"Failed to delete objects chunk: {e}")

    def get_public_url(self, storage_key: str) -> str:
        """
        Returns the public URL for the given storage key.
        If using MinIO locally, this uses the S3_ENDPOINT_URL.
        If using actual AWS S3, it generates the standard virtual-hosted style URL.
        """
        if settings.S3_ENDPOINT_URL:
            # e.g. http://localhost:9000/trustedcars-images/123.jpg
            # Note: For frontend access, we might need a public endpoint if S3_ENDPOINT_URL is internal.
            # We assume S3_ENDPOINT_URL is accessible by the client (e.g. localhost:9000)
            base = settings.S3_ENDPOINT_URL.rstrip('/')
            return f"{base}/{self.bucket}/{storage_key}"
        else:
            return f"https://{self.bucket}.s3.{settings.AWS_REGION}.amazonaws.com/{storage_key}"
