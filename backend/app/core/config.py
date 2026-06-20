from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List


class Settings(BaseSettings):
    PROJECT_NAME: str = "TrustedCars Enterprise"
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str
    JWT_SECRET_KEY: str
    MFA_ENCRYPTION_KEY: str
    METRICS_PASSWORD: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    DATABASE_URL: str
    DATABASE_POOL_SIZE: int = 20
    DATABASE_MAX_OVERFLOW: int = 10
    DATABASE_POOL_TIMEOUT: int = 30
    DATABASE_POOL_RECYCLE_SECONDS: int = 1800
    REDIS_URL: str = "redis://localhost:6379/0"
    SENTRY_DSN: str | None = None

    # S3 Storage Config
    S3_BUCKET_NAME: str = "trustedcars-images"
    AWS_ACCESS_KEY_ID: str = "minioadmin"
    AWS_SECRET_ACCESS_KEY: str = "minioadmin"
    AWS_REGION: str = "us-east-1"
    S3_ENDPOINT_URL: str | None = "http://localhost:9000"

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

    model_config = SettingsConfigDict(
        env_file=".env", env_file_encoding="utf-8", case_sensitive=True
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
