"""
Unit tests for SERVE_FRONTEND configuration setting.

Tests verify that the SERVE_FRONTEND flag is properly configured with:
- Default value of False (API-only mode)
- Validation logic that provides clear guidance
- Environment variable parsing

Requirements: 1.6, 6.2
"""
import pytest
import os
from pydantic import ValidationError


def test_serve_frontend_defaults_to_false():
    """Test that SERVE_FRONTEND defaults to False when not set."""
    # Create minimal environment for testing
    env_vars = {
        "SECRET_KEY": "test-secret-key",
        "JWT_SECRET_KEY": "test-jwt-secret",
        "MFA_ENCRYPTION_KEY": "test-mfa-key-32-chars-long!!!",
        "METRICS_PASSWORD": "test-metrics-password",
        "DATABASE_URL": "postgresql+asyncpg://test:test@localhost:5432/test",
        "AWS_ACCESS_KEY_ID": "test-access-key",
        "AWS_SECRET_ACCESS_KEY": "test-secret-key",
        "RESEND_API_KEY": "re_test_api_key_123456789",
        "RESEND_FROM_EMAIL": "test@example.com",
        "APP_NAME": "TrustedCarz Test",
        "FRONTEND_URL": "http://localhost:5173",
        "BACKEND_URL": "http://localhost:8000",
    }
    
    # Store original env vars
    original_env = {}
    for key in env_vars:
        original_env[key] = os.environ.get(key)
    
    try:
        # Set test environment
        for key, value in env_vars.items():
            os.environ[key] = value
        
        # Remove SERVE_FRONTEND if it exists
        if "SERVE_FRONTEND" in os.environ:
            del os.environ["SERVE_FRONTEND"]
        
        # Import Settings (must be after environment is set)
        from app.core.config import Settings
        
        # Create settings instance
        settings = Settings()
        
        # Verify SERVE_FRONTEND defaults to False
        assert settings.SERVE_FRONTEND is False, "SERVE_FRONTEND should default to False"
        
    finally:
        # Restore original environment
        for key, value in original_env.items():
            if value is None:
                if key in os.environ:
                    del os.environ[key]
            else:
                os.environ[key] = value


def test_serve_frontend_can_be_enabled():
    """Test that SERVE_FRONTEND can be set to True via environment variable."""
    env_vars = {
        "SECRET_KEY": "test-secret-key",
        "JWT_SECRET_KEY": "test-jwt-secret",
        "MFA_ENCRYPTION_KEY": "test-mfa-key-32-chars-long!!!",
        "METRICS_PASSWORD": "test-metrics-password",
        "DATABASE_URL": "postgresql+asyncpg://test:test@localhost:5432/test",
        "AWS_ACCESS_KEY_ID": "test-access-key",
        "AWS_SECRET_ACCESS_KEY": "test-secret-key",
        "RESEND_API_KEY": "re_test_api_key_123456789",
        "RESEND_FROM_EMAIL": "test@example.com",
        "APP_NAME": "TrustedCarz Test",
        "FRONTEND_URL": "http://localhost:5173",
        "BACKEND_URL": "http://localhost:8000",
        "SERVE_FRONTEND": "true",
    }
    
    original_env = {}
    for key in env_vars:
        original_env[key] = os.environ.get(key)
    
    try:
        for key, value in env_vars.items():
            os.environ[key] = value
        
        from app.core.config import Settings
        
        settings = Settings()
        
        assert settings.SERVE_FRONTEND is True, "SERVE_FRONTEND should be True when set to 'true'"
        
    finally:
        for key, value in original_env.items():
            if value is None:
                if key in os.environ:
                    del os.environ[key]
            else:
                os.environ[key] = value


def test_serve_frontend_parses_string_values():
    """Test that SERVE_FRONTEND correctly parses various string values."""
    test_cases = [
        ("true", True),
        ("True", True),
        ("TRUE", True),
        ("false", False),
        ("False", False),
        ("FALSE", False),
        ("1", True),
        ("0", False),
    ]
    
    base_env = {
        "SECRET_KEY": "test-secret-key",
        "JWT_SECRET_KEY": "test-jwt-secret",
        "MFA_ENCRYPTION_KEY": "test-mfa-key-32-chars-long!!!",
        "METRICS_PASSWORD": "test-metrics-password",
        "DATABASE_URL": "postgresql+asyncpg://test:test@localhost:5432/test",
        "AWS_ACCESS_KEY_ID": "test-access-key",
        "AWS_SECRET_ACCESS_KEY": "test-secret-key",
        "RESEND_API_KEY": "re_test_api_key_123456789",
        "RESEND_FROM_EMAIL": "test@example.com",
        "APP_NAME": "TrustedCarz Test",
        "FRONTEND_URL": "http://localhost:5173",
        "BACKEND_URL": "http://localhost:8000",
    }
    
    for str_value, expected_bool in test_cases:
        original_env = {}
        env_vars = {**base_env, "SERVE_FRONTEND": str_value}
        
        for key in env_vars:
            original_env[key] = os.environ.get(key)
        
        try:
            for key, value in env_vars.items():
                os.environ[key] = value
            
            # Need to reload module to pick up new environment
            import importlib
            import app.core.config
            importlib.reload(app.core.config)
            
            from app.core.config import Settings
            
            settings = Settings()
            
            assert settings.SERVE_FRONTEND is expected_bool, \
                f"SERVE_FRONTEND='{str_value}' should parse to {expected_bool}"
            
        finally:
            for key, value in original_env.items():
                if value is None:
                    if key in os.environ:
                        del os.environ[key]
                else:
                    os.environ[key] = value


if __name__ == "__main__":
    print("Running SERVE_FRONTEND configuration tests...")
    print("\nTest 1: Default value")
    test_serve_frontend_defaults_to_false()
    print("✓ SERVE_FRONTEND defaults to False")
    
    print("\nTest 2: Enable via environment variable")
    test_serve_frontend_can_be_enabled()
    print("✓ SERVE_FRONTEND can be set to True")
    
    print("\nTest 3: Parse string values")
    test_serve_frontend_parses_string_values()
    print("✓ SERVE_FRONTEND correctly parses string values")
    
    print("\n✓ All tests passed!")
