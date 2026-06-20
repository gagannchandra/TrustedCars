from app.shared.storage.provider import StorageProvider, S3StorageProvider
from app.core.config import settings

# Initialize a singleton instance if settings are valid
# For testing/local dev without boto3 setup, we could use a dummy provider, but we'll use S3 mapping.
_storage_provider_instance = None

def get_storage_provider() -> StorageProvider:
    global _storage_provider_instance
    if _storage_provider_instance is None:
        _storage_provider_instance = S3StorageProvider()
    return _storage_provider_instance
