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
    def generate_presigned_upload_url(self, file_extension: str, content_type: str) -> dict:
        raise NotImplementedError

    def get_public_url(self, storage_key: str) -> str:
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

    def generate_presigned_upload_url(self, file_extension: str, content_type: str) -> dict:
        """
        Generates a presigned URL that the frontend can use to upload a file directly to S3.
        Returns the upload URL, the generated storage_key, and the public URL.
        """
        storage_key = f"{uuid.uuid4()}{file_extension}"
        
        try:
            presigned_url = self.s3_client.generate_presigned_url(
                "put_object",
                Params={
                    "Bucket": self.bucket,
                    "Key": storage_key,
                    "ContentType": content_type,
                },
                ExpiresIn=3600,  # URL valid for 1 hour
            )
        except ClientError as e:
            logger.error(f"Failed to generate presigned URL: {e}")
            raise CustomException(500, "Failed to generate upload URL")

        return {
            "upload_url": presigned_url,
            "storage_key": storage_key,
            "public_url": self.get_public_url(storage_key)
        }

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
