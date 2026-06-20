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
        try:
            import boto3
            from botocore.exceptions import ClientError
            import json

            # We assume standard AWS credentials are in the environment (AWS_REGION, AWS_ACCESS_KEY_ID, etc.)
            region_name = os.environ.get("AWS_REGION", "us-east-1")
            client = boto3.client("secretsmanager", region_name=region_name)

            response = client.get_secret_value(SecretId=key)
            if "SecretString" in response:
                # AWS Secrets Manager often stores JSON. If it's a JSON dict, we try to parse it.
                # If the key is just a string, we return it.
                secret_string = response["SecretString"]
                try:
                    parsed = json.loads(secret_string)
                    if isinstance(parsed, dict) and key in parsed:
                        return parsed[key]
                    return secret_string
                except json.JSONDecodeError:
                    return secret_string
        except Exception as e:
            logger.error(f"Failed to fetch {key} from AWS Secrets Manager: {e}")
            
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
