import os
import structlog
from typing import Optional

logger = structlog.get_logger(__name__)


class SecretManager:
    def __init__(self, provider: str = "env"):
        """
        provider: "env", "aws", "doppler", or "vault"
        """
        self.provider = provider
        if provider != "env":
            logger.info(f"Initialized SecretManager with provider: {provider}")

    def get_secret(self, key: str, default: Optional[str] = None) -> Optional[str]:
        if self.provider == "aws":
            return self._get_aws_secret(key, default)
        elif self.provider == "doppler":
            return self._get_doppler_secret(key, default)
        elif self.provider == "vault":
            return self._get_vault_secret(key, default)
        else:
            return os.environ.get(key, default)

    def _get_aws_secret(self, key: str, default: Optional[str]) -> Optional[str]:
        # In a real implementation, use boto3 to fetch from AWS Secrets Manager
        logger.debug(f"Fetching {key} from AWS Secrets Manager (mocked)")
        return os.environ.get(key, default)

    def _get_doppler_secret(self, key: str, default: Optional[str]) -> Optional[str]:
        logger.debug(f"Fetching {key} from Doppler (mocked)")
        return os.environ.get(key, default)

    def _get_vault_secret(self, key: str, default: Optional[str]) -> Optional[str]:
        logger.debug(f"Fetching {key} from HashiCorp Vault (mocked)")
        return os.environ.get(key, default)


# Global secrets manager instance. In production, set SECRET_PROVIDER=aws
secret_manager = SecretManager(provider=os.environ.get("SECRET_PROVIDER", "env"))


def get_secret(key: str, default: Optional[str] = None) -> Optional[str]:
    return secret_manager.get_secret(key, default)
