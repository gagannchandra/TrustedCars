from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import field_validator, model_validator
from typing import List
import logging

logger = logging.getLogger(__name__)


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

    # CORS Configuration
    # Development: Allows frontend dev server (Vite) to call backend API
    # Production: Must be configured with actual production domain(s)
    # 
    # Configuration Requirement: CORS (Cross-Origin Resource Sharing) is required
    # for development mode when the frontend dev server (port 5173) and backend
    # API (port 8000) run on different ports. In integrated mode (backend serves
    # frontend), CORS is not strictly needed as requests are same-origin.
    # 
    # Development Setup:
    #   CORS_ORIGINS=["http://localhost:5173", "http://localhost:5174", "http://localhost:5175"]
    #   These ports cover the Vite dev server default port (5173) and common alternatives
    #   when the default port is occupied (5174, 5175).
    # 
    # Production Setup:
    #   CORS_ORIGINS=["https://trustedcars.com", "https://www.trustedcars.com"]
    #   Use ONLY your actual production domain(s). Do not use wildcards (*) in production
    #   as this compromises security by allowing requests from any origin.
    # 
    # Security Note:
    #   - Always use HTTPS URLs in production (https://)
    #   - Never use wildcard origins ("*") with allow_credentials=True
    #   - Restrict origins to the minimum set of trusted domains
    #   - The backend CORS middleware (main.py) is configured with allow_credentials=True
    #     to support cookie-based JWT authentication, which requires explicit origins
    # 
    # Example Production Configuration (.env):
    #   CORS_ORIGINS='["https://trustedcars.com","https://www.trustedcars.com"]'
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

    # Frontend Integration Config
    SERVE_FRONTEND: bool = False  # Set to True to serve built React frontend from /frontend/dist

    @field_validator("SERVE_FRONTEND")
    @classmethod
    def validate_serve_frontend(cls, v: bool, info) -> bool:
        """
        Validate SERVE_FRONTEND configuration and provide clear guidance.
        
        Configuration Requirement: When SERVE_FRONTEND=true, the backend will serve
        the built React frontend as static files from /frontend/dist. The frontend
        must be built before starting the backend in this mode.
        
        Args:
            v: The value of SERVE_FRONTEND
            info: Validation context containing other field values
            
        Returns:
            bool: The validated SERVE_FRONTEND value
            
        Note:
            When SERVE_FRONTEND=false, the backend runs in API-only mode and does not
            serve frontend static files. This is the default mode and is suitable for:
            - Development with separate Vite dev server (hot module replacement)
            - Production deployments with separate frontend hosting (CDN, Nginx, etc.)
            - API-only services without a web interface
            
            When SERVE_FRONTEND=true, ensure:
            - Frontend is built: cd frontend && npm run build
            - /frontend/dist directory exists with index.html and assets/
            - Frontend routes don't conflict with API routes (handled by route priority)
        """
        environment = info.data.get("ENVIRONMENT", "development")
        
        # In development, provide helpful guidance when enabling frontend serving
        if v is True and environment == "development":
            import logging
            logger = logging.getLogger(__name__)
            logger.info(
                "SERVE_FRONTEND=true: Backend will serve frontend static files from /frontend/dist. "
                "Ensure frontend is built with 'cd frontend && npm run build' before starting the backend. "
                "For development with hot reload, use SERVE_FRONTEND=false and run Vite dev server separately."
            )
        
        return v

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

    @model_validator(mode="after")
    def validate_environment_configuration(self) -> "Settings":
        """
        Validate environment configuration at startup.
        
        This validator performs comprehensive checks on all environment variables to ensure:
        1. All required variables are set with non-empty values
        2. Docker-style connection strings are detected and warned about
        3. Connection strings are properly formatted
        4. Critical services are properly configured
        
        Configuration Requirement: The application requires specific environment variables
        to connect to PostgreSQL, Redis, and S3-compatible storage. Missing or misconfigured
        variables will cause runtime failures, so we validate early at startup.
        
        Returns:
            Settings: The validated settings instance
            
        Raises:
            ValueError: If any required environment variable is missing or invalid
        """
        errors = []
        warnings = []
        
        # 1. Validate required database configuration
        if not self.DATABASE_URL or self.DATABASE_URL.strip() == "":
            errors.append(
                "DATABASE_URL is required but not set. "
                "Please configure PostgreSQL connection string in .env file. "
                "Example: DATABASE_URL=postgresql+asyncpg://user:password@localhost:5432/dbname"
            )
        else:
            # Check for Docker-style database connection string
            if "@db:" in self.DATABASE_URL or "@postgres:" in self.DATABASE_URL:
                warnings.append(
                    f"DATABASE_URL appears to use Docker service name ('{self.DATABASE_URL.split('@')[1].split(':')[0]}'). "
                    "For native development, use 'localhost' instead. "
                    "Example: DATABASE_URL=postgresql+asyncpg://user:password@localhost:5432/dbname"
                )
            
            # Validate PostgreSQL URL format
            if not self.DATABASE_URL.startswith(("postgresql://", "postgresql+asyncpg://")):
                errors.append(
                    f"DATABASE_URL has invalid format. Must start with 'postgresql://' or 'postgresql+asyncpg://'. "
                    f"Current value: {self.DATABASE_URL[:50]}..."
                )
        
        # 2. Validate required Redis configuration
        if not self.REDIS_URL or self.REDIS_URL.strip() == "":
            errors.append(
                "REDIS_URL is required but not set. "
                "Please configure Redis connection string in .env file. "
                "Example: REDIS_URL=redis://localhost:6379/0"
            )
        else:
            # Check for Docker-style Redis connection string
            if "@redis:" in self.REDIS_URL or "redis://redis:" in self.REDIS_URL:
                warnings.append(
                    "REDIS_URL appears to use Docker service name ('redis'). "
                    "For native development, use 'localhost' instead. "
                    "Example: REDIS_URL=redis://localhost:6379/0"
                )
            
            # Validate Redis URL format
            if not self.REDIS_URL.startswith(("redis://", "rediss://", "https://")):
                errors.append(
                    f"REDIS_URL has invalid format. Must start with 'redis://', 'rediss://', or 'https://' (for Upstash). "
                    f"Current value: {self.REDIS_URL[:50]}..."
                )
        
        # 3. Validate required S3/storage configuration
        if not self.AWS_ACCESS_KEY_ID or self.AWS_ACCESS_KEY_ID.strip() == "":
            errors.append(
                "AWS_ACCESS_KEY_ID is required but not set. "
                "Please configure S3/MinIO access key in .env file. "
                "For local MinIO: AWS_ACCESS_KEY_ID=minioadmin"
            )
        
        if not self.AWS_SECRET_ACCESS_KEY or self.AWS_SECRET_ACCESS_KEY.strip() == "":
            errors.append(
                "AWS_SECRET_ACCESS_KEY is required but not set. "
                "Please configure S3/MinIO secret key in .env file. "
                "For local MinIO: AWS_SECRET_ACCESS_KEY=minioadmin"
            )
        
        # Check for Docker-style S3 endpoint
        if self.S3_ENDPOINT_URL:
            if "minio:" in self.S3_ENDPOINT_URL or "//minio:" in self.S3_ENDPOINT_URL:
                warnings.append(
                    f"S3_ENDPOINT_URL appears to use Docker service name ('minio'). "
                    "For native development, use 'localhost' instead. "
                    "Example: S3_ENDPOINT_URL=http://localhost:9000"
                )
        
        # 4. Validate required security keys
        if not self.SECRET_KEY or self.SECRET_KEY.strip() == "":
            errors.append(
                "SECRET_KEY is required but not set. "
                "Please configure application secret key in .env file. "
                "Generate with: openssl rand -hex 32"
            )
        
        if not self.JWT_SECRET_KEY or self.JWT_SECRET_KEY.strip() == "":
            errors.append(
                "JWT_SECRET_KEY is required but not set. "
                "Please configure JWT secret key in .env file. "
                "Generate with: openssl rand -hex 32"
            )
        
        if not self.MFA_ENCRYPTION_KEY or self.MFA_ENCRYPTION_KEY.strip() == "":
            errors.append(
                "MFA_ENCRYPTION_KEY is required but not set. "
                "Please configure MFA encryption key in .env file. "
                "Generate with: openssl rand -hex 32"
            )
        
        if not self.METRICS_PASSWORD or self.METRICS_PASSWORD.strip() == "":
            errors.append(
                "METRICS_PASSWORD is required but not set. "
                "Please configure metrics endpoint password in .env file."
            )
        
        # 5. Validate email configuration (RESEND_API_KEY is validated separately by field_validator)
        if not self.RESEND_FROM_EMAIL or self.RESEND_FROM_EMAIL.strip() == "":
            errors.append(
                "RESEND_FROM_EMAIL is required but not set. "
                "Please configure sender email address in .env file. "
                "Example: RESEND_FROM_EMAIL=noreply@yourdomain.com"
            )
        
        # 6. Validate application URLs
        if not self.FRONTEND_URL or self.FRONTEND_URL.strip() == "":
            errors.append(
                "FRONTEND_URL is required but not set. "
                "Please configure frontend URL in .env file. "
                "Example: FRONTEND_URL=http://localhost:5173"
            )
        
        if not self.BACKEND_URL or self.BACKEND_URL.strip() == "":
            errors.append(
                "BACKEND_URL is required but not set. "
                "Please configure backend URL in .env file. "
                "Example: BACKEND_URL=http://localhost:8000"
            )
        
        # Log warnings for Docker-style configuration
        if warnings:
            logger.warning(
                "⚠️  CONFIGURATION WARNINGS DETECTED:\n" +
                "\n".join(f"  • {warning}" for warning in warnings) +
                "\n\nThese warnings indicate you may be using Docker-style service names in your connection strings. "
                "For native development, update your .env file to use 'localhost' instead of Docker service names."
            )
        
        # If there are critical errors, raise them
        if errors:
            error_message = (
                "❌ CRITICAL CONFIGURATION ERRORS - Application cannot start:\n\n" +
                "\n".join(f"  {i+1}. {error}" for i, error in enumerate(errors)) +
                "\n\nPlease update your .env file with the required environment variables. "
                "See .env.example for reference configuration."
            )
            raise ValueError(error_message)
        
        # Log successful validation
        logger.info("✓ Environment configuration validated successfully")
        
        return self

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
