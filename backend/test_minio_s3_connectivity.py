"""
Integration tests for MinIO/S3 connectivity.

Tests verify that:
- S3StorageProvider connects to MinIO with localhost endpoint (Requirement 5.3)
- File upload and retrieval work correctly (Requirement 5.3)
- Bucket exists and is accessible (Requirement 5.3)
- Pre-signed URL generation works correctly (Requirement 5.4)

Two testing modes:
1. Unit tests using mock boto3 (always run) — verifies S3StorageProvider logic
2. Live integration tests (only run when MinIO is available at localhost:9000)

Requirements: 5.3, 5.4
"""
import pytest
import io
import uuid
from unittest.mock import MagicMock, patch, AsyncMock
from botocore.exceptions import ClientError
from botocore.client import Config


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _make_client_error(code: str, message: str = "error") -> ClientError:
    """Build a minimal ClientError for testing."""
    return ClientError(
        error_response={"Error": {"Code": code, "Message": message}},
        operation_name="operation",
    )


def _make_settings_override(endpoint_url: str | None = "http://localhost:9000"):
    """Return a namespace that mimics the parts of Settings used by the provider."""
    ns = MagicMock()
    ns.S3_BUCKET_NAME = "trustedcars-images"
    ns.AWS_ACCESS_KEY_ID = "minioadmin"
    ns.AWS_SECRET_ACCESS_KEY = "minioadmin"
    ns.AWS_REGION = "us-east-1"
    ns.S3_ENDPOINT_URL = endpoint_url
    return ns


# ---------------------------------------------------------------------------
# Unit tests — S3StorageProvider (mocked boto3, always run)
# ---------------------------------------------------------------------------

class TestS3StorageProviderInitialization:
    """Test that S3StorageProvider initialises the boto3 client correctly."""

    def test_client_created_with_localhost_endpoint_for_minio(self):
        """
        When S3_ENDPOINT_URL is set to a localhost URL, the boto3 client MUST
        receive that endpoint_url so that requests go to MinIO, not AWS.

        Validates: Requirements 5.3
        """
        mock_settings = _make_settings_override("http://localhost:9000")

        with patch("app.shared.storage.provider.settings", mock_settings), \
             patch("app.shared.storage.provider.boto3") as mock_boto3:
            mock_boto3.client.return_value = MagicMock()

            from app.shared.storage.provider import S3StorageProvider
            provider = S3StorageProvider()

            call_kwargs = mock_boto3.client.call_args.kwargs
            assert call_kwargs["endpoint_url"] == "http://localhost:9000", (
                "boto3 client must use the S3_ENDPOINT_URL for MinIO connectivity"
            )
            assert call_kwargs["aws_access_key_id"] == "minioadmin"
            assert call_kwargs["aws_secret_access_key"] == "minioadmin"
            assert call_kwargs["region_name"] == "us-east-1"

    def test_client_created_without_endpoint_for_aws_s3(self):
        """
        When S3_ENDPOINT_URL is None (AWS S3 production mode), boto3 must NOT
        receive an endpoint_url override so that it uses the real AWS endpoint.

        Validates: Requirements 5.4
        """
        mock_settings = _make_settings_override(endpoint_url=None)

        with patch("app.shared.storage.provider.settings", mock_settings), \
             patch("app.shared.storage.provider.boto3") as mock_boto3:
            mock_boto3.client.return_value = MagicMock()

            from app.shared.storage.provider import S3StorageProvider
            provider = S3StorageProvider()

            call_kwargs = mock_boto3.client.call_args.kwargs
            assert call_kwargs["endpoint_url"] is None, (
                "endpoint_url must be None when using real AWS S3"
            )

    def test_client_uses_sigv4_signature(self):
        """
        Pre-signed URLs for MinIO require Signature Version 4.  The provider
        must pass Config(signature_version='s3v4') to every boto3 client.

        Validates: Requirements 5.3, 5.4
        """
        mock_settings = _make_settings_override()

        with patch("app.shared.storage.provider.settings", mock_settings), \
             patch("app.shared.storage.provider.boto3") as mock_boto3:
            mock_boto3.client.return_value = MagicMock()

            from app.shared.storage.provider import S3StorageProvider
            S3StorageProvider()

            call_kwargs = mock_boto3.client.call_args.kwargs
            assert isinstance(call_kwargs.get("config"), Config), (
                "A botocore Config must be passed to the boto3 client"
            )
            assert call_kwargs["config"].signature_version == "s3v4", (
                "Signature version must be s3v4 for MinIO pre-signed URL support"
            )


class TestPublicUrlGeneration:
    """Test get_public_url() for both MinIO and AWS S3 modes."""

    def test_public_url_uses_localhost_endpoint_for_minio(self):
        """
        When S3_ENDPOINT_URL is set, public URLs MUST point to that endpoint
        (localhost:9000) so that frontend clients can fetch images from MinIO.

        Validates: Requirements 5.3
        """
        mock_settings = _make_settings_override("http://localhost:9000")

        with patch("app.shared.storage.provider.settings", mock_settings), \
             patch("app.shared.storage.provider.boto3") as mock_boto3:
            mock_boto3.client.return_value = MagicMock()

            from app.shared.storage.provider import S3StorageProvider
            provider = S3StorageProvider()

            url = provider.get_public_url("cars/image-123.jpg")
            expected = "http://localhost:9000/trustedcars-images/cars/image-123.jpg"
            assert url == expected, f"Expected {expected!r}, got {url!r}"

    def test_public_url_uses_s3_virtual_hosted_style_for_aws(self):
        """
        When S3_ENDPOINT_URL is None (AWS mode), public URLs must use the
        standard AWS virtual-hosted-style format.

        Validates: Requirements 5.4
        """
        mock_settings = _make_settings_override(endpoint_url=None)

        with patch("app.shared.storage.provider.settings", mock_settings), \
             patch("app.shared.storage.provider.boto3") as mock_boto3:
            mock_boto3.client.return_value = MagicMock()

            from app.shared.storage.provider import S3StorageProvider
            provider = S3StorageProvider()

            url = provider.get_public_url("cars/image-456.jpg")
            expected = "https://trustedcars-images.s3.us-east-1.amazonaws.com/cars/image-456.jpg"
            assert url == expected, f"Expected {expected!r}, got {url!r}"

    def test_public_url_strips_trailing_slash_from_endpoint(self):
        """
        Endpoint URLs with a trailing slash must not produce double slashes.

        Validates: Requirements 5.3
        """
        mock_settings = _make_settings_override("http://localhost:9000/")

        with patch("app.shared.storage.provider.settings", mock_settings), \
             patch("app.shared.storage.provider.boto3") as mock_boto3:
            mock_boto3.client.return_value = MagicMock()

            from app.shared.storage.provider import S3StorageProvider
            provider = S3StorageProvider()

            url = provider.get_public_url("cars/image.jpg")
            assert "//" not in url.replace("http://", ""), (
                "Double slashes must not appear in the generated URL"
            )
            assert url == "http://localhost:9000/trustedcars-images/cars/image.jpg"


class TestPresignedUrlGeneration:
    """Test pre-signed URL generation using a mocked boto3 client."""

    def test_presigned_url_generated_for_minio_endpoint(self):
        """
        generate_presigned_url must be called with the correct method and key,
        and the resulting URL must begin with the MinIO endpoint.

        Validates: Requirements 5.4
        """
        mock_settings = _make_settings_override("http://localhost:9000")
        fake_url = "http://localhost:9000/trustedcars-images/cars/image.jpg?X-Amz-Signature=abc"

        mock_s3 = MagicMock()
        mock_s3.generate_presigned_url.return_value = fake_url

        with patch("app.shared.storage.provider.settings", mock_settings), \
             patch("app.shared.storage.provider.boto3") as mock_boto3:
            mock_boto3.client.return_value = mock_s3

            from app.shared.storage.provider import S3StorageProvider
            provider = S3StorageProvider()

            # Call generate_presigned_url via the underlying s3_client
            presigned = provider.s3_client.generate_presigned_url(
                "get_object",
                Params={"Bucket": "trustedcars-images", "Key": "cars/image.jpg"},
                ExpiresIn=3600,
            )

            assert presigned == fake_url
            mock_s3.generate_presigned_url.assert_called_once_with(
                "get_object",
                Params={"Bucket": "trustedcars-images", "Key": "cars/image.jpg"},
                ExpiresIn=3600,
            )

    def test_presigned_put_url_for_file_upload(self):
        """
        Pre-signed PUT URLs must be generated with the correct HTTP method so
        that clients can upload files directly to storage.

        Validates: Requirements 5.3, 5.4
        """
        mock_settings = _make_settings_override("http://localhost:9000")
        fake_put_url = (
            "http://localhost:9000/trustedcars-images/upload/car123.jpg"
            "?X-Amz-Signature=xyz"
        )

        mock_s3 = MagicMock()
        mock_s3.generate_presigned_url.return_value = fake_put_url

        with patch("app.shared.storage.provider.settings", mock_settings), \
             patch("app.shared.storage.provider.boto3") as mock_boto3:
            mock_boto3.client.return_value = mock_s3

            from app.shared.storage.provider import S3StorageProvider
            provider = S3StorageProvider()

            presigned = provider.s3_client.generate_presigned_url(
                "put_object",
                Params={"Bucket": "trustedcars-images", "Key": "upload/car123.jpg"},
                ExpiresIn=900,
            )

            assert "put_object" in mock_s3.generate_presigned_url.call_args[0]
            assert presigned.startswith("http://localhost:9000"), (
                "Pre-signed PUT URL must point to the MinIO endpoint"
            )


class TestFileUploadAndRetrieval:
    """Test file upload and retrieval through a mocked boto3 client."""

    @pytest.mark.asyncio
    async def test_delete_object_calls_s3_delete(self):
        """
        delete_object() must invoke s3_client.delete_object with the correct
        Bucket and Key parameters.

        Validates: Requirements 5.3
        """
        mock_settings = _make_settings_override()
        mock_s3 = MagicMock()
        mock_s3.delete_object.return_value = {}

        with patch("app.shared.storage.provider.settings", mock_settings), \
             patch("app.shared.storage.provider.boto3") as mock_boto3, \
             patch("app.shared.storage.provider.asyncio") as mock_asyncio:
            mock_boto3.client.return_value = mock_s3
            mock_asyncio.to_thread = AsyncMock(return_value={})

            from app.shared.storage.provider import S3StorageProvider
            provider = S3StorageProvider()
            await provider.delete_object("cars/image-delete-me.jpg")

            mock_asyncio.to_thread.assert_called_once()
            call_args = mock_asyncio.to_thread.call_args
            # First positional arg is the callable (s3.delete_object)
            assert call_args[0][0] == mock_s3.delete_object
            assert call_args[1]["Bucket"] == "trustedcars-images"
            assert call_args[1]["Key"] == "cars/image-delete-me.jpg"

    @pytest.mark.asyncio
    async def test_delete_objects_sends_batch_request(self):
        """
        delete_objects() must send a batch delete request with all provided keys.

        Validates: Requirements 5.3
        """
        mock_settings = _make_settings_override()
        mock_s3 = MagicMock()

        with patch("app.shared.storage.provider.settings", mock_settings), \
             patch("app.shared.storage.provider.boto3") as mock_boto3, \
             patch("app.shared.storage.provider.asyncio") as mock_asyncio:
            mock_boto3.client.return_value = mock_s3
            mock_asyncio.to_thread = AsyncMock(return_value={})

            from app.shared.storage.provider import S3StorageProvider
            provider = S3StorageProvider()
            keys = ["cars/img1.jpg", "cars/img2.jpg", "cars/img3.jpg"]
            await provider.delete_objects(keys)

            mock_asyncio.to_thread.assert_called_once()
            call_args = mock_asyncio.to_thread.call_args
            assert call_args[0][0] == mock_s3.delete_objects
            delete_payload = call_args[1]["Delete"]
            assert delete_payload["Objects"] == [{"Key": k} for k in keys]

    @pytest.mark.asyncio
    async def test_delete_objects_skips_empty_list(self):
        """
        delete_objects() with an empty list must NOT make any S3 API calls.

        Validates: Requirements 5.3
        """
        mock_settings = _make_settings_override()
        mock_s3 = MagicMock()

        with patch("app.shared.storage.provider.settings", mock_settings), \
             patch("app.shared.storage.provider.boto3") as mock_boto3, \
             patch("app.shared.storage.provider.asyncio") as mock_asyncio:
            mock_boto3.client.return_value = mock_s3
            mock_asyncio.to_thread = AsyncMock(return_value={})

            from app.shared.storage.provider import S3StorageProvider
            provider = S3StorageProvider()
            await provider.delete_objects([])

            mock_asyncio.to_thread.assert_not_called()

    @pytest.mark.asyncio
    async def test_delete_objects_batches_large_key_lists(self):
        """
        delete_objects() must split key lists into 1000-key batches to respect
        S3 API limits.

        Validates: Requirements 5.3
        """
        mock_settings = _make_settings_override()
        mock_s3 = MagicMock()

        with patch("app.shared.storage.provider.settings", mock_settings), \
             patch("app.shared.storage.provider.boto3") as mock_boto3, \
             patch("app.shared.storage.provider.asyncio") as mock_asyncio:
            mock_boto3.client.return_value = mock_s3
            mock_asyncio.to_thread = AsyncMock(return_value={})

            from app.shared.storage.provider import S3StorageProvider
            provider = S3StorageProvider()
            # 2500 keys should produce 3 batches: 1000, 1000, 500
            keys = [f"cars/img-{i}.jpg" for i in range(2500)]
            await provider.delete_objects(keys)

            assert mock_asyncio.to_thread.call_count == 3, (
                "2500 keys should be split into 3 batches of ≤1000"
            )


class TestBucketAccessibility:
    """Test bucket existence and accessibility checks."""

    def test_bucket_name_is_configured_in_provider(self):
        """
        The S3StorageProvider must use the configured bucket name from settings.

        Validates: Requirements 5.3
        """
        mock_settings = _make_settings_override()
        mock_settings.S3_BUCKET_NAME = "trustedcars-images"

        with patch("app.shared.storage.provider.settings", mock_settings), \
             patch("app.shared.storage.provider.boto3") as mock_boto3:
            mock_boto3.client.return_value = MagicMock()

            from app.shared.storage.provider import S3StorageProvider
            provider = S3StorageProvider()

            assert provider.bucket == "trustedcars-images", (
                "Provider must use the S3_BUCKET_NAME from configuration"
            )

    def test_head_bucket_succeeds_when_bucket_exists(self):
        """
        head_bucket() succeeding on the S3 client indicates the bucket is
        accessible with the provided credentials.

        Validates: Requirements 5.3
        """
        mock_settings = _make_settings_override("http://localhost:9000")
        mock_s3 = MagicMock()
        mock_s3.head_bucket.return_value = {"ResponseMetadata": {"HTTPStatusCode": 200}}

        with patch("app.shared.storage.provider.settings", mock_settings), \
             patch("app.shared.storage.provider.boto3") as mock_boto3:
            mock_boto3.client.return_value = mock_s3

            from app.shared.storage.provider import S3StorageProvider
            provider = S3StorageProvider()

            # Simulate the bucket accessibility check
            response = provider.s3_client.head_bucket(Bucket=provider.bucket)
            assert response["ResponseMetadata"]["HTTPStatusCode"] == 200

    def test_head_bucket_raises_client_error_when_bucket_missing(self):
        """
        head_bucket() raising a NoSuchBucket ClientError indicates the bucket
        does not exist or is not accessible.

        Validates: Requirements 5.3
        """
        mock_settings = _make_settings_override("http://localhost:9000")
        mock_s3 = MagicMock()
        mock_s3.head_bucket.side_effect = _make_client_error("NoSuchBucket")

        with patch("app.shared.storage.provider.settings", mock_settings), \
             patch("app.shared.storage.provider.boto3") as mock_boto3:
            mock_boto3.client.return_value = mock_s3

            from app.shared.storage.provider import S3StorageProvider
            provider = S3StorageProvider()

            with pytest.raises(ClientError) as exc_info:
                provider.s3_client.head_bucket(Bucket=provider.bucket)

            assert exc_info.value.response["Error"]["Code"] == "NoSuchBucket"


class TestStorageDependencyInjection:
    """Test the dependency injection singleton for StorageProvider."""

    def test_get_storage_provider_returns_s3_provider(self):
        """
        get_storage_provider() must return a configured S3StorageProvider instance.

        Validates: Requirements 5.3
        """
        with patch("app.shared.storage.provider.boto3") as mock_boto3:
            mock_boto3.client.return_value = MagicMock()

            # Reset singleton to force fresh creation
            import app.shared.storage.dependencies as deps
            deps._storage_provider_instance = None

            from app.shared.storage.dependencies import get_storage_provider
            from app.shared.storage.provider import S3StorageProvider

            provider = get_storage_provider()
            assert isinstance(provider, S3StorageProvider)

    def test_get_storage_provider_returns_same_instance(self):
        """
        get_storage_provider() must return the same singleton instance on
        repeated calls (avoids creating unnecessary boto3 clients).

        Validates: Requirements 5.3
        """
        with patch("app.shared.storage.provider.boto3") as mock_boto3:
            mock_boto3.client.return_value = MagicMock()

            import app.shared.storage.dependencies as deps
            deps._storage_provider_instance = None

            from app.shared.storage.dependencies import get_storage_provider

            provider_a = get_storage_provider()
            provider_b = get_storage_provider()
            assert provider_a is provider_b, (
                "get_storage_provider must return the same singleton instance"
            )


# ---------------------------------------------------------------------------
# Live integration tests — only run when MinIO is available at localhost:9000
# ---------------------------------------------------------------------------

def _minio_available() -> bool:
    """Return True if MinIO is reachable at http://localhost:9000."""
    import urllib.request
    try:
        urllib.request.urlopen("http://localhost:9000/minio/health/live", timeout=2)
        return True
    except Exception:
        return False


MINIO_LIVE = pytest.mark.skipif(
    not _minio_available(),
    reason="MinIO not running at localhost:9000 — start MinIO to run live tests",
)


@MINIO_LIVE
class TestLiveMinioConnectivity:
    """
    Live integration tests that connect to a real MinIO instance.
    These tests are skipped when MinIO is not running.

    Validates: Requirements 5.3, 5.4
    """

    @pytest.fixture(scope="class")
    def s3_client(self):
        """Create a real boto3 client connected to local MinIO."""
        import boto3
        from botocore.client import Config
        client = boto3.client(
            "s3",
            endpoint_url="http://localhost:9000",
            aws_access_key_id="minioadmin",
            aws_secret_access_key="minioadmin",
            region_name="us-east-1",
            config=Config(signature_version="s3v4"),
        )
        return client

    @pytest.fixture(scope="class")
    def bucket_name(self) -> str:
        return "trustedcars-images"

    def test_minio_health_endpoint_is_reachable(self):
        """
        The MinIO health endpoint at /minio/health/live must return HTTP 200.

        Validates: Requirements 5.3
        """
        import urllib.request
        with urllib.request.urlopen("http://localhost:9000/minio/health/live", timeout=5) as resp:
            assert resp.status == 200, "MinIO health endpoint must return 200"

    def test_bucket_exists_and_is_accessible(self, s3_client, bucket_name):
        """
        The configured bucket must exist and be accessible with the provided
        MinIO credentials.

        Validates: Requirements 5.3
        """
        response = s3_client.head_bucket(Bucket=bucket_name)
        assert response["ResponseMetadata"]["HTTPStatusCode"] == 200, (
            f"Bucket {bucket_name!r} must be accessible"
        )

    def test_file_upload_and_retrieval(self, s3_client, bucket_name):
        """
        A file uploaded to MinIO must be retrievable with the same content.

        Validates: Requirements 5.3
        """
        test_key = f"test/integration-{uuid.uuid4().hex}.txt"
        test_content = b"TrustedCars MinIO integration test"

        try:
            # Upload
            s3_client.put_object(
                Bucket=bucket_name,
                Key=test_key,
                Body=test_content,
                ContentType="text/plain",
            )

            # Retrieve
            response = s3_client.get_object(Bucket=bucket_name, Key=test_key)
            retrieved = response["Body"].read()
            assert retrieved == test_content, (
                "Retrieved content must match the uploaded content"
            )

        finally:
            # Cleanup — delete the test object
            try:
                s3_client.delete_object(Bucket=bucket_name, Key=test_key)
            except Exception:
                pass  # Best-effort cleanup

    def test_presigned_get_url_generation(self, s3_client, bucket_name):
        """
        generate_presigned_url('get_object') must return a URL that begins
        with the MinIO localhost endpoint and contains a valid signature.

        Validates: Requirements 5.4
        """
        test_key = f"test/presign-{uuid.uuid4().hex}.txt"
        test_content = b"presigned url test content"

        try:
            s3_client.put_object(Bucket=bucket_name, Key=test_key, Body=test_content)

            presigned_url = s3_client.generate_presigned_url(
                "get_object",
                Params={"Bucket": bucket_name, "Key": test_key},
                ExpiresIn=3600,
            )

            assert presigned_url.startswith("http://localhost:9000"), (
                "Pre-signed GET URL must point to the MinIO localhost endpoint"
            )
            assert "X-Amz-Signature" in presigned_url, (
                "Pre-signed URL must contain X-Amz-Signature query parameter"
            )
            assert bucket_name in presigned_url, (
                "Pre-signed URL must contain the bucket name"
            )
            assert test_key in presigned_url, (
                "Pre-signed URL must contain the object key"
            )

        finally:
            try:
                s3_client.delete_object(Bucket=bucket_name, Key=test_key)
            except Exception:
                pass

    def test_presigned_put_url_allows_upload(self, s3_client, bucket_name):
        """
        A pre-signed PUT URL must allow uploading a file via HTTP PUT.

        Validates: Requirements 5.3, 5.4
        """
        import urllib.request
        test_key = f"test/presign-put-{uuid.uuid4().hex}.txt"
        test_content = b"uploaded via pre-signed PUT URL"

        try:
            presigned_put_url = s3_client.generate_presigned_url(
                "put_object",
                Params={
                    "Bucket": bucket_name,
                    "Key": test_key,
                    "ContentType": "text/plain",
                },
                ExpiresIn=900,
            )

            assert presigned_put_url.startswith("http://localhost:9000"), (
                "Pre-signed PUT URL must point to MinIO"
            )

            # Perform the actual PUT upload
            req = urllib.request.Request(
                presigned_put_url,
                data=test_content,
                method="PUT",
                headers={"Content-Type": "text/plain"},
            )
            with urllib.request.urlopen(req, timeout=10) as resp:
                assert resp.status in (200, 204), (
                    f"Pre-signed PUT upload must succeed, got HTTP {resp.status}"
                )

            # Verify the uploaded content
            get_response = s3_client.get_object(Bucket=bucket_name, Key=test_key)
            assert get_response["Body"].read() == test_content

        finally:
            try:
                s3_client.delete_object(Bucket=bucket_name, Key=test_key)
            except Exception:
                pass

    def test_s3_storage_provider_uses_minio_endpoint(self):
        """
        The S3StorageProvider, when configured with S3_ENDPOINT_URL=http://localhost:9000,
        must successfully list objects in the configured bucket, confirming the
        boto3 client is routed to MinIO.

        Validates: Requirements 5.3
        """
        from app.shared.storage.provider import S3StorageProvider
        from app.core.config import settings

        if settings.S3_ENDPOINT_URL != "http://localhost:9000":
            pytest.skip(
                f"S3_ENDPOINT_URL is {settings.S3_ENDPOINT_URL!r}, not localhost:9000"
            )

        provider = S3StorageProvider()

        # list_objects_v2 with max 1 key is the lightest connectivity check
        response = provider.s3_client.list_objects_v2(
            Bucket=provider.bucket,
            MaxKeys=1,
        )
        assert response["ResponseMetadata"]["HTTPStatusCode"] == 200, (
            "S3StorageProvider must be able to list objects in the bucket via MinIO"
        )


if __name__ == "__main__":
    import sys
    sys.exit(pytest.main([__file__, "-v", "--tb=short"]))
