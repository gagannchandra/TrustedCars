from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List


class Settings(BaseSettings):
    PROJECT_NAME: str = "TrustedCars Enterprise"
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    DATABASE_URL: str
    DATABASE_POOL_SIZE: int = 20
    DATABASE_MAX_OVERFLOW: int = 10
    DATABASE_POOL_TIMEOUT: int = 30
    DATABASE_POOL_RECYCLE_SECONDS: int = 1800
    REDIS_URL: str = "redis://localhost:6380/0"
    SENTRY_DSN: str | None = None

    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:5175",
    ]

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
