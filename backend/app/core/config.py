from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import field_validator
from typing import List


class Settings(BaseSettings):
    PROJECT_NAME: str = "TrustedCarz Enterprise"
    API_V1_STR: str = "/api/v1"
    ENVIRONMENT: str = "development"
    SECRET_KEY: str
    JWT_SECRET_KEY: str
    MFA_ENCRYPTION_KEY: str
    METRICS_PASSWORD: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    SESSIONS_VALID_FROM: str | None = None  # ISO 8601 timestamp - invalidates all sessions issued before this time

    DATABASE_URL: str
    DATABASE_POOL_SIZE: int = 20
    DATABASE_MAX_OVERFLOW: int = 10
    DATABASE_POOL_TIMEOUT: int = 30
    DATABASE_POOL_RECYCLE_SECONDS: int = 1800
    REDIS_URL: str = "redis://localhost:6379/0"
    SENTRY_DSN: str | None = None

    # S3 Storage Config
    S3_BUCKET_NAME: str = "trustedcarz-images"
    AWS_ACCESS_KEY_ID: str          # Required — no default
    AWS_SECRET_ACCESS_KEY: str      # Required — no default
    AWS_REGION: str = "us-east-1"
    S3_ENDPOINT_URL: str | None = None  # None = real AWS; set for MinIO/local dev

    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:5175",
    ]

    RESEND_API_KEY: str
    RESEND_FROM_EMAIL: str
    APP_NAME: str
    FRONTEND_URL: str
    BACKEND_URL: str
    OTP_EXPIRY_MINUTES: int = 10
    OTP_RESEND_COOLDOWN_SECONDS: int = 60
    OTP_MAX_ATTEMPTS: int = 5
    OTP_RATE_LIMIT_WINDOW_MINUTES: int = 15
    OTP_RATE_LIMIT_MAX_REQUESTS: int = 10
    DISABLE_OTP_AUTH: bool = False  # Set to True to bypass OTP for development

    @field_validator("RESEND_API_KEY")
    @classmethod
    def validate_resend_api_key(cls, v: str, info) -> str:
        """
        Validate RESEND_API_KEY is properly configured.
        
        Security Requirement: Email service is critical for OTP delivery, password resets,
        and account verification. A missing or placeholder API key will cause silent
        failures in production, preventing users from registering or authenticating.
        
        Args:
            v: The value of RESEND_API_KEY
            info: Validation context containing other field values
            
        Returns:
            str: The validated RESEND_API_KEY value
            
        Raises:
            ValueError: If API key is empty, None, or a known placeholder value
        """
        # Check if key is empty or None
        if not v or v.strip() == "":
            raise ValueError(
                "CRITICAL CONFIGURATION ERROR: RESEND_API_KEY is not configured. "
                "Email service is required for OTP delivery, user registration, and password resets. "
                "Set RESEND_API_KEY in environment variables with a valid Resend API key. "
                "Get your API key from: https://resend.com/api-keys"
            )
        
        # Check for common placeholder values that indicate misconfiguration
        placeholder_patterns = [
            "re_placeholder",
            "your_resend_api_key",
            "replace_me",
            "changeme",
            "xxx",
            "test_key",
            "fake_key",
        ]
        
        v_lower = v.lower()
        for pattern in placeholder_patterns:
            if pattern in v_lower:
                raise ValueError(
                    f"CRITICAL CONFIGURATION ERROR: RESEND_API_KEY appears to be a placeholder value: '{v[:20]}...'. "
                    "Please replace it with a valid Resend API key. "
                    "Email service will not function with placeholder keys. "
                    "Get your API key from: https://resend.com/api-keys"
                )
        
        # Valid Resend API keys start with "re_" prefix
        if not v.startswith("re_"):
            raise ValueError(
                f"INVALID RESEND_API_KEY FORMAT: Key must start with 're_' prefix. "
                f"Current value starts with: '{v[:10]}...'. "
                "Please verify you're using a valid Resend API key from: https://resend.com/api-keys"
            )
        
        return v

    @field_validator("DISABLE_OTP_AUTH")
    @classmethod
    def validate_otp_auth(cls, v: bool, info) -> bool:
        """
        Prevent OTP authentication from being disabled in production.
        
        Security Requirement: OTP (One-Time Password) email verification is mandatory
        in production environments to ensure user email ownership and prevent
        unauthorized account access.
        
        Args:
            v: The value of DISABLE_OTP_AUTH
            info: Validation context containing other field values
            
        Returns:
            bool: The validated DISABLE_OTP_AUTH value
            
        Raises:
            ValueError: If OTP auth is disabled in production environment
        """
        # Get ENVIRONMENT from validation context data
        environment = info.data.get("ENVIRONMENT", "development")
        
        if v is True and environment == "production":
            raise ValueError(
                "CRITICAL SECURITY ERROR: OTP authentication cannot be disabled in production environment. "
                "Email verification via OTP is required for production deployments to ensure account security. "
                "Set DISABLE_OTP_AUTH=false or remove it entirely (defaults to false)."
            )
        
        return v

    model_config = SettingsConfigDict(
        env_file=".env", env_file_encoding="utf-8", case_sensitive=True, extra="ignore"
    )


settings = Settings()  # type: ignore

# Post-load secrets from the secret manager
from app.core.secrets import get_secret

# Only override if the secret manager returns a value
db_url = get_secret("DATABASE_URL")
if db_url:
    settings.DATABASE_URL = db_url

secret_key = get_secret("SECRET_KEY")
if secret_key:
    settings.SECRET_KEY = secret_key

jwt_secret_key = get_secret("JWT_SECRET_KEY")
if jwt_secret_key:
    settings.JWT_SECRET_KEY = jwt_secret_key

mfa_encryption_key = get_secret("MFA_ENCRYPTION_KEY")
if mfa_encryption_key:
    settings.MFA_ENCRYPTION_KEY = mfa_encryption_key

metrics_password = get_secret("METRICS_PASSWORD")
if metrics_password:
    settings.METRICS_PASSWORD = metrics_password
