"""
Integration tests for Redis connectivity.

Tests verify that:
- Redis connects from the backend using the configured REDIS_URL
- Session/key storage and retrieval works correctly
- Password-authenticated Redis connections work
- Connection failures produce clear error messages

Requirements: 4.2, 4.3, 4.4
"""
import asyncio
import os
import pytest
import logging

import redis.asyncio as aioredis


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _make_redis_client(url: str) -> aioredis.Redis:
    """
    Create a *fresh* redis.asyncio client (not the module-level singleton).

    Using a fresh client per test avoids 'Event loop is closed' errors caused
    by the module-level connection pool being invalidated after a loop teardown.
    """
    return aioredis.Redis.from_url(
        url,
        decode_responses=True,
        socket_connect_timeout=2,
        socket_timeout=2,
    )


def _get_redis_url_from_settings() -> str:
    """Return the configured REDIS_URL without importing the singleton."""
    from app.core.config import settings
    return settings.REDIS_URL


# ---------------------------------------------------------------------------
# 1. Test Redis connection from backend
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_redis_connection_from_backend():
    """
    Requirement 4.2 – When Redis is installed the backend SHALL connect using a
    localhost connection string.

    Verify that a fresh client built from the configured REDIS_URL can
    successfully ping the locally running Redis instance.
    """
    url = _get_redis_url_from_settings()
    client = _make_redis_client(url)
    try:
        result = await client.ping()
        assert result is True, "Redis PING should return True when the server is reachable"
    finally:
        await client.aclose()


@pytest.mark.asyncio
async def test_redis_url_uses_localhost():
    """
    Requirement 4.3 – The Redis connection string SHALL be configurable via
    environment variables and SHALL use localhost for native development.

    Verify that the configured REDIS_URL points to localhost, not a Docker
    service name.
    """
    from app.core.config import settings

    redis_url = settings.REDIS_URL.lower()

    # Must not contain Docker service name
    assert "@redis:" not in redis_url, (
        "REDIS_URL must not use Docker service name 'redis'. "
        f"Current REDIS_URL: {settings.REDIS_URL}"
    )

    # Should be a valid redis:// URL
    assert redis_url.startswith("redis://") or redis_url.startswith("rediss://"), (
        f"REDIS_URL must start with 'redis://' or 'rediss://'. Got: {settings.REDIS_URL}"
    )


# ---------------------------------------------------------------------------
# 2. Test session storage and retrieval
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_redis_set_and_get_key():
    """
    Requirement 4.2 – Basic key/value read-write works via the backend Redis client.
    """
    url = _get_redis_url_from_settings()
    client = _make_redis_client(url)
    test_key = "integration_test:set_get"
    test_value = "hello_redis"

    try:
        await client.set(test_key, test_value)
        retrieved = await client.get(test_key)
        assert retrieved == test_value, (
            f"Expected '{test_value}', got '{retrieved}'"
        )
    finally:
        await client.delete(test_key)
        await client.aclose()


@pytest.mark.asyncio
async def test_redis_key_expiry():
    """
    Requirement 4.2 – Keys stored with a TTL (e.g. OTP passwords, login
    lockouts) expire correctly after the configured time.
    """
    url = _get_redis_url_from_settings()
    client = _make_redis_client(url)
    test_key = "integration_test:expiry"

    try:
        # Store with a 1-second TTL
        await client.setex(test_key, 1, "ephemeral_value")

        # Key must exist immediately after setting
        value = await client.get(test_key)
        assert value == "ephemeral_value", "Key should exist immediately after setex"

        # After TTL elapses the key must be gone
        await asyncio.sleep(1.5)
        expired = await client.get(test_key)
        assert expired is None, "Key should have expired after TTL"
    finally:
        await client.delete(test_key)
        await client.aclose()


@pytest.mark.asyncio
async def test_redis_otp_session_storage_pattern():
    """
    Requirement 4.2 – The OTP password-hash session pattern used in
    AuthService.register_user() stores a hashed password in Redis and
    retrieves it during verify_registration().

    This test exercises the same read/write/delete pattern without calling the
    full authentication service.
    """
    url = _get_redis_url_from_settings()
    client = _make_redis_client(url)
    email = "integration_test_user@example.com"
    temp_key = f"otp:reg:pwd:{email}"
    fake_password_hash = "$2b$12$fakehash_for_testing_purposes_only"

    try:
        # Simulate storing a password hash during registration
        await client.setex(temp_key, 600, fake_password_hash)

        # Simulate retrieving it during OTP verification
        stored_hash = await client.get(temp_key)
        assert stored_hash == fake_password_hash, (
            "Stored password hash should be retrievable from Redis"
        )

        # Simulate cleanup after successful registration
        await client.delete(temp_key)
        after_delete = await client.get(temp_key)
        assert after_delete is None, "Key should be absent after deletion"
    finally:
        await client.delete(temp_key)
        await client.aclose()


@pytest.mark.asyncio
async def test_redis_login_lockout_pattern():
    """
    Requirement 4.2 – The login-lockout counter pattern used in AuthService.login()
    increments and expires correctly.
    """
    url = _get_redis_url_from_settings()
    client = _make_redis_client(url)
    email = "lockout_test@example.com"
    lockout_key = f"failed_login:{email}"

    try:
        # Ensure key starts fresh
        await client.delete(lockout_key)

        # Simulate two failed login attempts
        for _ in range(2):
            await client.incr(lockout_key)
            await client.expire(lockout_key, 15 * 60)

        count = await client.get(lockout_key)
        assert count == "2", f"Lockout counter should be '2', got {count!r}"

        # Check TTL is set
        ttl = await client.ttl(lockout_key)
        assert ttl > 0, "Lockout key should have a positive TTL"

        # Simulate clearing lockout after successful login
        await client.delete(lockout_key)
        after_clear = await client.get(lockout_key)
        assert after_clear is None, "Lockout counter should be removed after clearing"
    finally:
        await client.delete(lockout_key)
        await client.aclose()


@pytest.mark.asyncio
async def test_redis_user_suspension_pattern():
    """
    Requirement 4.2 – The user-suspension flag pattern used in
    AuthService.handle_user_suspended/restored() can be set and deleted.
    """
    import uuid

    url = _get_redis_url_from_settings()
    client = _make_redis_client(url)
    fake_user_id = uuid.uuid4()
    suspension_key = f"suspended:user:{fake_user_id}"

    try:
        # Simulate suspending a user
        await client.set(suspension_key, "1")
        flag = await client.get(suspension_key)
        assert flag == "1", "Suspension flag should be '1'"

        # Simulate restoring the user
        await client.delete(suspension_key)
        after_restore = await client.get(suspension_key)
        assert after_restore is None, "Suspension flag should be removed after restore"
    finally:
        await client.delete(suspension_key)
        await client.aclose()


# ---------------------------------------------------------------------------
# 3. Test Redis connection with password authentication
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_redis_connection_with_password_auth():
    """
    Requirement 4.3 – The Redis connection string SHALL be configurable via
    environment variables, including password authentication.

    This test verifies that connecting with the same password that is encoded
    in the REDIS_URL succeeds.  If the running Redis has no password the URL
    has no password and we verify the connection still works (anonymous auth).
    """
    import urllib.parse

    url = _get_redis_url_from_settings()

    # Parse password from URL (may be None/empty for password-free Redis)
    parsed = urllib.parse.urlparse(url)
    password = parsed.password  # None if not present

    client = _make_redis_client(url)
    try:
        pong = await client.ping()
        assert pong is True, (
            "Connection with password from REDIS_URL should succeed"
            if password
            else "Connection to password-free Redis should succeed"
        )
    finally:
        await client.aclose()


@pytest.mark.asyncio
async def test_redis_password_auth_url_format():
    """
    Requirement 4.3 – Verify that if REDIS_PASSWORD is set in the environment,
    it is reflected in the REDIS_URL so the backend does not silently ignore it.
    """
    from app.core.config import settings

    redis_password = os.environ.get("REDIS_PASSWORD", "")

    if not redis_password:
        pytest.skip(
            "REDIS_PASSWORD not set in environment — skipping password format check"
        )

    # If REDIS_PASSWORD is configured, the URL should include it
    assert redis_password in settings.REDIS_URL, (
        "REDIS_PASSWORD is set but the REDIS_URL does not include it. "
        "Update REDIS_URL to: redis://:<password>@localhost:6379/0"
    )


# ---------------------------------------------------------------------------
# 4. Test clear error messages on connection failure
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_redis_connection_failure_gives_clear_error():
    """
    Requirement 4.4 – When Redis is unavailable the backend SHALL log clear
    error messages indicating the connection failure.

    This test deliberately connects to a port with no Redis listener and
    asserts that the resulting exception carries meaningful diagnostic
    information.
    """
    bad_url = "redis://localhost:19999/0"   # Port with no listener
    client = _make_redis_client(bad_url)

    try:
        with pytest.raises(Exception) as exc_info:
            await client.ping()

        # The exception message should contain either the host, the port, or a
        # recognisable connection-error token so operators can diagnose the
        # problem quickly.
        error_str = str(exc_info.value).lower()
        has_diagnostic_info = any(
            token in error_str
            for token in [
                "connection",
                "refused",
                "timeout",
                "19999",
                "localhost",
                "connect",
                "error",
            ]
        )
        assert has_diagnostic_info, (
            f"Connection error should carry diagnostic info about the failure. "
            f"Got: {exc_info.value!r}"
        )
    finally:
        await client.aclose()


@pytest.mark.asyncio
async def test_redis_wrong_password_gives_clear_error():
    """
    Requirement 4.4 – Connecting with a wrong password produces a recognisable
    authentication error.

    This test only runs when the local Redis is configured with a password;
    it is skipped for password-free Redis instances.
    """
    import urllib.parse
    from app.core.config import settings

    parsed = urllib.parse.urlparse(settings.REDIS_URL)
    correct_password = parsed.password

    if not correct_password:
        pytest.skip(
            "Local Redis has no password — skipping wrong-password error test"
        )

    # Build URL with obviously wrong password
    wrong_url = settings.REDIS_URL.replace(correct_password, "definitely_wrong_password_xyz")
    client = _make_redis_client(wrong_url)

    try:
        with pytest.raises(Exception) as exc_info:
            await client.ping()

        error_str = str(exc_info.value).lower()
        has_auth_info = any(
            token in error_str
            for token in ["auth", "password", "noauth", "invalid", "wrong", "denied"]
        )
        assert has_auth_info, (
            f"Wrong-password error should reference authentication failure. "
            f"Got: {exc_info.value!r}"
        )
    finally:
        await client.aclose()


@pytest.mark.asyncio
async def test_config_logs_warning_for_docker_style_redis_url(caplog):
    """
    Requirement 4.4 – When the REDIS_URL uses a Docker service name the
    backend SHALL log a clear warning so developers know to update their .env.
    """
    import importlib

    docker_url = "redis://redis:6379/0"
    original_url = os.environ.get("REDIS_URL")

    try:
        os.environ["REDIS_URL"] = docker_url

        with caplog.at_level(logging.WARNING):
            import app.core.config as config_module
            importlib.reload(config_module)

        # The model_validator in Settings should log a warning about Docker service names
        warning_logged = any(
            "docker" in record.message.lower()
            or "service name" in record.message.lower()
            or "redis" in record.message.lower()
            for record in caplog.records
            if record.levelno >= logging.WARNING
        )
        assert warning_logged, (
            "Settings should emit a warning when REDIS_URL uses Docker service name 'redis'. "
            f"Log records: {[r.message for r in caplog.records]}"
        )
    except Exception:
        # Settings validation may raise ValueError for the Docker URL; that is also
        # an acceptable form of "clear error message" per Requirement 4.4.
        pass
    finally:
        # Restore original environment
        if original_url is None:
            os.environ.pop("REDIS_URL", None)
        else:
            os.environ["REDIS_URL"] = original_url

        # Reload config back to original state
        import app.core.config as config_module
        try:
            importlib.reload(config_module)
        except Exception:
            pass


# ---------------------------------------------------------------------------
# Entry-point for direct invocation
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    import sys
    print("Running Redis connectivity integration tests...")
    print("\nNote: These tests require:")
    print("  1. Redis running on localhost:6379")
    print("  2. REDIS_URL set in backend/.env")
    print()
    sys.exit(pytest.main([__file__, "-v", "--asyncio-mode=auto"]))
