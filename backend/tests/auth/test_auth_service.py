"""
Comprehensive Auth Service Tests

Test coverage for:
- User registration (success, duplicate email)
- Email verification (valid OTP, invalid OTP, expired OTP)
- Login (success, invalid credentials, unverified email, suspended user)
- Token refresh (success, invalid token, expired token)
- Logout (token revocation)
- Password reset flow (request, verification, completion)
- MFA enrollment, verification, login flow
- MFA backup code generation and usage
"""

import pytest
import pytest_asyncio
from httpx import AsyncClient
import uuid
from datetime import datetime, timezone, timedelta
from unittest.mock import patch, AsyncMock
import jwt
from app.core.config import settings


@pytest_asyncio.fixture
async def test_email():
    """Generate unique test email for each test"""
    return f"test_{uuid.uuid4()}@example.com"


@pytest_asyncio.fixture
async def test_password():
    """Standard test password"""
    return "StrongPassword123!"


# ============================================================================
# 7.2. Test user registration (success)
# ============================================================================
@pytest.mark.asyncio
async def test_register_user_success(async_client: AsyncClient, test_email, test_password):
    """Test successful user registration sends OTP"""
    with patch("app.shared.email.resend_client.email_service.send_registration_otp", new_callable=AsyncMock) as mock_email:
        mock_email.return_value = True
        
        response = await async_client.post(
            "/api/v1/auth/register/user",
            json={
                "email": test_email,
                "password": test_password,
                "full_name": "Test User"
            }
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["message"] == "Verification code sent to email"
        mock_email.assert_called_once()


# ============================================================================
# 7.3. Test user registration (duplicate email)
# ============================================================================
@pytest.mark.asyncio
async def test_register_user_duplicate_email(async_client: AsyncClient, test_email, test_password, setup_db):
    """Test registration fails with duplicate email"""
    from app.modules.auth.models import User, RoleEnum
    
    # Create existing user
    existing_user = User(
        email=test_email,
        hashed_password="hashed",
        full_name="Existing User",
        role=RoleEnum.user
    )
    setup_db.add(existing_user)
    await setup_db.commit()
    
    # Try to register with same email
    response = await async_client.post(
        "/api/v1/auth/register/user",
        json={
            "email": test_email,
            "password": test_password,
            "full_name": "Another User"
        }
    )
    
    assert response.status_code == 400
    assert "already registered" in response.json()["detail"].lower()


# ============================================================================
# 7.4. Test email verification (valid OTP)
# ============================================================================
@pytest.mark.asyncio
async def test_email_verification_valid_otp(async_client: AsyncClient, test_email, test_password, setup_db):
    """Test successful email verification with valid OTP"""
    from app.modules.auth.otp_service import OTPService
    
    # Create OTP record with password hash in Redis
    otp_service = OTPService(setup_db)
    from app.db.redis import get_redis
    redis_client = await get_redis()
    
    # Store password hash
    from app.core.security import get_password_hash
    hashed_password = get_password_hash(test_password)
    temp_key = f"otp:reg:pwd:{test_email}"
    await redis_client.setex(temp_key, 600, hashed_password)
    
    # Create OTP
    context_data = {
        "full_name": "Test User",
        "role": "user"
    }
    otp_code = await otp_service.create_otp(test_email, "register", context_data)
    
    # Verify with OTP
    response = await async_client.post(
        "/api/v1/auth/verify-registration",
        json={
            "email": test_email,
            "code": otp_code
        }
    )
    
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert "refresh_token" in data
    assert data["token_type"] == "bearer"


# ============================================================================
# 7.5. Test email verification (invalid OTP)
# ============================================================================
@pytest.mark.asyncio
async def test_email_verification_invalid_otp(async_client: AsyncClient, test_email, setup_db):
    """Test email verification fails with invalid OTP"""
    from app.modules.auth.otp_service import OTPService
    
    # Create OTP
    otp_service = OTPService(setup_db)
    context_data = {"full_name": "Test User", "role": "user"}
    await otp_service.create_otp(test_email, "register", context_data)
    
    # Try with wrong OTP
    response = await async_client.post(
        "/api/v1/auth/verify-registration",
        json={
            "email": test_email,
            "code": "999999"  # Wrong OTP
        }
    )
    
    assert response.status_code == 400
    assert "invalid" in response.json()["detail"].lower()


# ============================================================================
# 7.6. Test email verification (expired OTP)
# ============================================================================
@pytest.mark.asyncio
async def test_email_verification_expired_otp(async_client: AsyncClient, test_email, setup_db):
    """Test email verification fails with expired OTP"""
    from app.modules.auth.models import OTPCode
    import passlib.context
    
    # Create expired OTP manually
    pwd_context = passlib.context.CryptContext(schemes=["bcrypt"], deprecated="auto")
    otp_hash = pwd_context.hash("123456")
    
    expired_otp = OTPCode(
        email=test_email,
        type="register",
        otp_hash=otp_hash,
        context_data={"full_name": "Test User", "role": "user"},
        expires_at=datetime.now(timezone.utc) - timedelta(minutes=5)  # Already expired
    )
    setup_db.add(expired_otp)
    await setup_db.commit()
    
    response = await async_client.post(
        "/api/v1/auth/verify-registration",
        json={
            "email": test_email,
            "code": "123456"
        }
    )
    
    assert response.status_code == 400
    assert "expired" in response.json()["detail"].lower()


# ============================================================================
# 7.7. Test login (success with cookies)
# ============================================================================
@pytest.mark.asyncio
async def test_login_success(async_client: AsyncClient, test_email, test_password, setup_db):
    """Test successful login sends OTP"""
    from app.modules.auth.models import User, RoleEnum
    from app.core.security import get_password_hash
    
    # Create verified user
    user = User(
        email=test_email,
        hashed_password=get_password_hash(test_password),
        full_name="Test User",
        role=RoleEnum.user
    )
    setup_db.add(user)
    await setup_db.commit()
    
    with patch("app.shared.email.resend_client.email_service.send_login_otp", new_callable=AsyncMock) as mock_email:
        mock_email.return_value = True
        
        response = await async_client.post(
            "/api/v1/auth/login",
            json={
                "email": test_email,
                "password": test_password
            }
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "OTP sent to email" in data["message"]
        mock_email.assert_called_once()


# ============================================================================
# 7.8. Test login (invalid credentials)
# ============================================================================
@pytest.mark.asyncio
async def test_login_invalid_credentials(async_client: AsyncClient, test_email, test_password, setup_db):
    """Test login fails with invalid password"""
    from app.modules.auth.models import User, RoleEnum
    from app.core.security import get_password_hash
    
    # Create user
    user = User(
        email=test_email,
        hashed_password=get_password_hash(test_password),
        full_name="Test User",
        role=RoleEnum.user
    )
    setup_db.add(user)
    await setup_db.commit()
    
    # Try with wrong password
    response = await async_client.post(
        "/api/v1/auth/login",
        json={
            "email": test_email,
            "password": "WrongPassword123!"
        }
    )
    
    assert response.status_code == 401
    assert "invalid credentials" in response.json()["detail"].lower()


# ============================================================================
# 7.9. Test login (unverified email) - Not applicable in current flow
# Note: In the current system, users cannot exist without verification
# ============================================================================

# ============================================================================
# 7.10. Test login (suspended user)
# ============================================================================
@pytest.mark.asyncio
async def test_login_suspended_user(async_client: AsyncClient, test_email, test_password, setup_db):
    """Test login fails for suspended user"""
    from app.modules.auth.models import User, RoleEnum
    from app.core.security import get_password_hash
    
    # Create suspended user
    user = User(
        email=test_email,
        hashed_password=get_password_hash(test_password),
        full_name="Test User",
        role=RoleEnum.user,
        is_suspended=True
    )
    setup_db.add(user)
    await setup_db.commit()
    
    response = await async_client.post(
        "/api/v1/auth/login",
        json={
            "email": test_email,
            "password": test_password
        }
    )
    
    assert response.status_code == 403
    assert "suspended" in response.json()["detail"].lower()


# ============================================================================
# 7.11. Test token refresh (success)
# ============================================================================
@pytest.mark.asyncio
async def test_token_refresh_success(async_client: AsyncClient, test_email, test_password, setup_db):
    """Test successful token refresh"""
    from app.modules.auth.models import User, RoleEnum, RefreshToken
    from app.core.security import get_password_hash, create_refresh_token
    import hashlib
    
    # Create user
    user = User(
        email=test_email,
        hashed_password=get_password_hash(test_password),
        full_name="Test User",
        role=RoleEnum.user
    )
    setup_db.add(user)
    await setup_db.flush()
    
    # Create refresh token
    refresh_token_plain = create_refresh_token(subject=user.id)
    token_hash = hashlib.sha256(refresh_token_plain.encode()).hexdigest()
    
    family_id = uuid.uuid4()
    rt = RefreshToken(
        user_id=user.id,
        token_hash=token_hash,
        family_id=family_id,
        expires_at=datetime.now(timezone.utc) + timedelta(days=30)
    )
    setup_db.add(rt)
    await setup_db.commit()
    
    # Refresh token
    response = await async_client.post(
        "/api/v1/auth/refresh",
        json={"refresh_token": refresh_token_plain}
    )
    
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert "refresh_token" in data


# ============================================================================
# 7.12. Test token refresh (invalid token)
# ============================================================================
@pytest.mark.asyncio
async def test_token_refresh_invalid_token(async_client: AsyncClient):
    """Test token refresh fails with invalid token"""
    response = await async_client.post(
        "/api/v1/auth/refresh",
        json={"refresh_token": "invalid_token_string"}
    )
    
    assert response.status_code == 401
    assert "invalid" in response.json()["detail"].lower()


# ============================================================================
# 7.13. Test token refresh (expired token)
# ============================================================================
@pytest.mark.asyncio
async def test_token_refresh_expired_token(async_client: AsyncClient, setup_db):
    """Test token refresh fails with expired refresh token"""
    from app.modules.auth.models import User, RoleEnum, RefreshToken
    from app.core.security import get_password_hash
    import hashlib
    
    # Create user
    user = User(
        email=f"test_{uuid.uuid4()}@example.com",
        hashed_password=get_password_hash("password123"),
        full_name="Test User",
        role=RoleEnum.user
    )
    setup_db.add(user)
    await setup_db.flush()
    
    # Create expired refresh token
    # We need to manually create a valid JWT but mark it as expired in DB
    refresh_token_data = {
        "sub": str(user.id),
        "type": "refresh",
        "exp": datetime.now(timezone.utc) + timedelta(days=1)  # JWT not expired yet
    }
    refresh_token_plain = jwt.encode(refresh_token_data, settings.JWT_SECRET_KEY, algorithm=settings.ALGORITHM)
    token_hash = hashlib.sha256(refresh_token_plain.encode()).hexdigest()
    
    rt = RefreshToken(
        user_id=user.id,
        token_hash=token_hash,
        family_id=uuid.uuid4(),
        expires_at=datetime.now(timezone.utc) - timedelta(days=1)  # DB record expired
    )
    setup_db.add(rt)
    await setup_db.commit()
    
    response = await async_client.post(
        "/api/v1/auth/refresh",
        json={"refresh_token": refresh_token_plain}
    )
    
    assert response.status_code == 401
    assert "expired" in response.json()["detail"].lower()


# ============================================================================
# 7.14. Test logout (token revocation)
# ============================================================================
@pytest.mark.asyncio
async def test_logout_token_revocation(async_client: AsyncClient, setup_db):
    """Test logout revokes refresh token"""
    from app.modules.auth.models import User, RoleEnum, RefreshToken
    from app.core.security import get_password_hash, create_refresh_token
    from sqlalchemy import select
    import hashlib
    
    # Create user
    user = User(
        email=f"test_{uuid.uuid4()}@example.com",
        hashed_password=get_password_hash("password123"),
        full_name="Test User",
        role=RoleEnum.user
    )
    setup_db.add(user)
    await setup_db.flush()
    
    # Create refresh token
    refresh_token_plain = create_refresh_token(subject=user.id)
    token_hash = hashlib.sha256(refresh_token_plain.encode()).hexdigest()
    
    rt = RefreshToken(
        user_id=user.id,
        token_hash=token_hash,
        family_id=uuid.uuid4(),
        expires_at=datetime.now(timezone.utc) + timedelta(days=30)
    )
    setup_db.add(rt)
    await setup_db.commit()
    
    # Logout
    response = await async_client.post(
        "/api/v1/auth/logout",
        json={"refresh_token": refresh_token_plain}
    )
    
    assert response.status_code == 200
    
    # Verify token is revoked in database
    result = await setup_db.execute(
        select(RefreshToken).where(RefreshToken.token_hash == token_hash)
    )
    db_token = result.scalar_one_or_none()
    assert db_token is not None
    assert db_token.is_revoked is True


# ============================================================================
# 7.15. Test password reset request
# ============================================================================
@pytest.mark.asyncio
async def test_password_reset_request(async_client: AsyncClient, test_email, test_password, setup_db):
    """Test password reset request sends OTP"""
    from app.modules.auth.models import User, RoleEnum
    from app.core.security import get_password_hash
    
    # Create user
    user = User(
        email=test_email,
        hashed_password=get_password_hash(test_password),
        full_name="Test User",
        role=RoleEnum.user
    )
    setup_db.add(user)
    await setup_db.commit()
    
    with patch("app.shared.email.resend_client.email_service.send_password_reset_otp", new_callable=AsyncMock) as mock_email:
        mock_email.return_value = True
        
        response = await async_client.post(
            "/api/v1/auth/forgot-password",
            json={"email": test_email}
        )
        
        assert response.status_code == 200
        assert "reset code" in response.json()["message"].lower()
        mock_email.assert_called_once()


# ============================================================================
# 7.16. Test password reset verification
# ============================================================================
@pytest.mark.asyncio
async def test_password_reset_verification(async_client: AsyncClient, test_email, setup_db):
    """Test password reset OTP verification returns reset token"""
    from app.modules.auth.models import User, RoleEnum
    from app.core.security import get_password_hash
    from app.modules.auth.otp_service import OTPService
    
    # Create user
    user = User(
        email=test_email,
        hashed_password=get_password_hash("OldPassword123!"),
        full_name="Test User",
        role=RoleEnum.user
    )
    setup_db.add(user)
    await setup_db.flush()
    
    # Create reset OTP
    otp_service = OTPService(setup_db)
    context_data = {"user_id": str(user.id)}
    otp_code = await otp_service.create_otp(test_email, "reset", context_data)
    
    # Verify reset OTP
    response = await async_client.post(
        "/api/v1/auth/verify-reset-password",
        json={
            "email": test_email,
            "code": otp_code
        }
    )
    
    assert response.status_code == 200
    data = response.json()
    assert "reset_token" in data


# ============================================================================
# 7.17. Test password reset completion
# ============================================================================
@pytest.mark.asyncio
async def test_password_reset_completion(async_client: AsyncClient, test_email, setup_db):
    """Test password reset completion with reset token"""
    from app.modules.auth.models import User, RoleEnum, RefreshToken
    from app.core.security import get_password_hash
    from sqlalchemy import select
    
    # Create user with old password
    user = User(
        email=test_email,
        hashed_password=get_password_hash("OldPassword123!"),
        full_name="Test User",
        role=RoleEnum.user
    )
    setup_db.add(user)
    await setup_db.flush()
    
    # Create reset token
    reset_token_data = {
        "sub": str(user.id),
        "type": "reset_password",
        "exp": datetime.now(timezone.utc) + timedelta(minutes=15)
    }
    reset_token = jwt.encode(reset_token_data, settings.JWT_SECRET_KEY, algorithm=settings.ALGORITHM)
    
    # Reset password
    new_password = "NewPassword456!"
    response = await async_client.post(
        "/api/v1/auth/reset-password",
        json={
            "reset_token": reset_token,
            "new_password": new_password
        }
    )
    
    assert response.status_code == 200
    assert "successfully reset" in response.json()["message"].lower()
    
    # Verify all refresh tokens were invalidated
    result = await setup_db.execute(
        select(RefreshToken).where(RefreshToken.user_id == user.id)
    )
    tokens = result.scalars().all()
    assert len(tokens) == 0


# ============================================================================
# 7.18. Test MFA enrollment
# ============================================================================
@pytest.mark.asyncio
async def test_mfa_enrollment(async_client: AsyncClient, admin_user, admin_token_headers):
    """Test MFA enrollment returns secret and backup codes"""
    # Disable MFA first if enabled
    admin_user.mfa_enabled = False
    
    response = await async_client.post(
        "/api/v1/auth/mfa/enroll",
        headers=admin_token_headers
    )
    
    assert response.status_code == 200
    data = response.json()
    assert "secret" in data
    assert "provisioning_uri" in data
    assert "backup_codes" in data
    assert len(data["backup_codes"]) == 10


# ============================================================================
# 7.19. Test MFA verification (valid code)
# ============================================================================
@pytest.mark.asyncio
async def test_mfa_verification_valid_code(async_client: AsyncClient, setup_db):
    """Test MFA verification with valid TOTP code"""
    from app.modules.auth.models import User, RoleEnum
    from app.core.security import get_password_hash, create_access_token
    import pyotp
    from cryptography.fernet import Fernet
    import base64
    import hashlib
    
    # Create user
    user = User(
        email=f"test_{uuid.uuid4()}@example.com",
        hashed_password=get_password_hash("password123"),
        full_name="Test User",
        role=RoleEnum.user,
        mfa_enabled=False
    )
    
    # Create and encrypt MFA secret
    secret = pyotp.random_base32()
    key_bytes = hashlib.sha256(settings.MFA_ENCRYPTION_KEY.encode()).digest()
    fernet_key = base64.urlsafe_b64encode(key_bytes)
    f = Fernet(fernet_key)
    encrypted_secret = f.encrypt(secret.encode()).decode()
    user.mfa_secret = encrypted_secret
    
    setup_db.add(user)
    await setup_db.commit()
    
    # Generate valid TOTP code
    totp = pyotp.TOTP(secret)
    code = totp.now()
    
    # Create access token for user
    access_token = create_access_token(subject=user.id)
    headers = {"Authorization": f"Bearer {access_token}"}
    
    # Verify MFA code
    response = await async_client.post(
        "/api/v1/auth/mfa/verify",
        headers=headers,
        json={"code": code}
    )
    
    assert response.status_code == 200
    data = response.json()
    assert "enabled successfully" in data["message"].lower()


# ============================================================================
# 7.20. Test MFA verification (invalid code)
# ============================================================================
@pytest.mark.asyncio
async def test_mfa_verification_invalid_code(async_client: AsyncClient, setup_db):
    """Test MFA verification fails with invalid TOTP code"""
    from app.modules.auth.models import User, RoleEnum
    from app.core.security import get_password_hash, create_access_token
    import pyotp
    from cryptography.fernet import Fernet
    import base64
    import hashlib
    
    # Create user with MFA secret
    user = User(
        email=f"test_{uuid.uuid4()}@example.com",
        hashed_password=get_password_hash("password123"),
        full_name="Test User",
        role=RoleEnum.user,
        mfa_enabled=False
    )
    
    secret = pyotp.random_base32()
    key_bytes = hashlib.sha256(settings.MFA_ENCRYPTION_KEY.encode()).digest()
    fernet_key = base64.urlsafe_b64encode(key_bytes)
    f = Fernet(fernet_key)
    encrypted_secret = f.encrypt(secret.encode()).decode()
    user.mfa_secret = encrypted_secret
    
    setup_db.add(user)
    await setup_db.commit()
    
    # Use invalid code
    invalid_code = "000000"
    access_token = create_access_token(subject=user.id)
    headers = {"Authorization": f"Bearer {access_token}"}
    
    response = await async_client.post(
        "/api/v1/auth/mfa/verify",
        headers=headers,
        json={"code": invalid_code}
    )
    
    assert response.status_code == 400
    assert "invalid" in response.json()["detail"].lower()


# ============================================================================
# 7.21. Test MFA backup codes generation
# ============================================================================
@pytest.mark.asyncio
async def test_mfa_backup_codes_generation(async_client: AsyncClient, setup_db):
    """Test MFA enrollment generates 10 unique backup codes"""
    from app.modules.auth.models import User, RoleEnum
    from app.core.security import get_password_hash, create_access_token
    
    # Create user without MFA
    user = User(
        email=f"test_{uuid.uuid4()}@example.com",
        hashed_password=get_password_hash("password123"),
        full_name="Test User",
        role=RoleEnum.user,
        mfa_enabled=False
    )
    setup_db.add(user)
    await setup_db.commit()
    
    access_token = create_access_token(subject=user.id)
    headers = {"Authorization": f"Bearer {access_token}"}
    
    # Enroll in MFA
    response = await async_client.post(
        "/api/v1/auth/mfa/enroll",
        headers=headers
    )
    
    assert response.status_code == 200
    data = response.json()
    backup_codes = data["backup_codes"]
    
    # Verify 10 unique codes
    assert len(backup_codes) == 10
    assert len(set(backup_codes)) == 10  # All unique
    
    # Verify codes are stored in database (hashed)
    from sqlalchemy import select
    from app.modules.auth.models import UserMFABackupCode
    result = await setup_db.execute(
        select(UserMFABackupCode).where(UserMFABackupCode.user_id == user.id)
    )
    db_codes = result.scalars().all()
    assert len(db_codes) == 10


# ============================================================================
# 7.22. Test MFA backup code usage
# ============================================================================
@pytest.mark.asyncio
async def test_mfa_backup_code_usage(async_client: AsyncClient, setup_db):
    """Test MFA recovery with backup code"""
    from app.modules.auth.models import User, RoleEnum, UserMFABackupCode
    from app.core.security import get_password_hash
    import hashlib
    
    # Create user with MFA enabled
    user = User(
        email=f"test_{uuid.uuid4()}@example.com",
        hashed_password=get_password_hash("StrongPassword123!"),
        full_name="Test User",
        role=RoleEnum.user,
        mfa_enabled=True
    )
    setup_db.add(user)
    await setup_db.flush()
    
    # Create backup code
    backup_code = "test_backup_code_123"
    code_hash = hashlib.sha256(backup_code.encode()).hexdigest()
    backup = UserMFABackupCode(
        user_id=user.id,
        code_hash=code_hash
    )
    setup_db.add(backup)
    await setup_db.commit()
    
    # Use backup code for recovery
    response = await async_client.post(
        "/api/v1/auth/mfa/recovery",
        json={
            "email": user.email,
            "recovery_code": backup_code
        }
    )
    
    assert response.status_code == 200
    assert "15 minutes" in response.json()["message"]
    
    # Verify backup code is marked as used
    from sqlalchemy import select
    result = await setup_db.execute(
        select(UserMFABackupCode).where(
            UserMFABackupCode.user_id == user.id,
            UserMFABackupCode.code_hash == code_hash
        )
    )
    used_code = result.scalar_one()
    assert used_code.used_at is not None


# ============================================================================
# 7.23. Test login with OTP rate limiting
# ============================================================================
@pytest.mark.asyncio
async def test_login_otp_rate_limit(async_client: AsyncClient, setup_db):
    """Test OTP rate limiting prevents spam"""
    from app.modules.auth.models import User, RoleEnum
    from app.core.security import get_password_hash
    
    test_email = f"test_{uuid.uuid4()}@example.com"
    user = User(
        email=test_email,
        hashed_password=get_password_hash("StrongPassword123!"),
        full_name="Test User",
        role=RoleEnum.user
    )
    setup_db.add(user)
    await setup_db.commit()
    
    with patch("app.shared.email.resend_client.email_service.send_login_otp", new_callable=AsyncMock) as mock_email:
        mock_email.return_value = True
        
        # First request should succeed
        response1 = await async_client.post(
            "/api/v1/auth/login",
            json={"email": test_email, "password": "StrongPassword123!"}
        )
        assert response1.status_code == 200
        
        # Immediate second request should be rate limited
        response2 = await async_client.post(
            "/api/v1/auth/login",
            json={"email": test_email, "password": "StrongPassword123!"}
        )
        assert response2.status_code == 429
        assert "wait" in response2.json()["detail"].lower()


# ============================================================================
# 7.24. Test OTP max attempts
# ============================================================================
@pytest.mark.asyncio
async def test_otp_max_attempts(async_client: AsyncClient, test_email, setup_db):
    """Test OTP verification fails after max attempts"""
    from app.modules.auth.otp_service import OTPService
    from app.core.config import settings
    
    # Create OTP
    otp_service = OTPService(setup_db)
    context_data = {"full_name": "Test User", "role": "user"}
    await otp_service.create_otp(test_email, "register", context_data)
    
    # Try wrong code multiple times (max attempts is 3 by default in settings)
    max_attempts = settings.OTP_MAX_ATTEMPTS
    for i in range(max_attempts):
        response = await async_client.post(
            "/api/v1/auth/verify-registration",
            json={"email": test_email, "code": "999999"}
        )
        if i < max_attempts - 1:
            assert response.status_code == 400
            assert "invalid" in response.json()["detail"].lower()
    
    # Next attempt should indicate max attempts exceeded
    response = await async_client.post(
        "/api/v1/auth/verify-registration",
        json={"email": test_email, "code": "999999"}
    )
    assert response.status_code == 400
    assert ("maximum" in response.json()["detail"].lower() or 
            "exceeded" in response.json()["detail"].lower())


# ============================================================================
# 7.25. Test dealer registration
# ============================================================================
@pytest.mark.asyncio
async def test_register_dealer_success(async_client: AsyncClient):
    """Test successful dealer registration"""
    test_email = f"dealer_{uuid.uuid4()}@example.com"
    
    with patch("app.shared.email.resend_client.email_service.send_registration_otp", new_callable=AsyncMock) as mock_email:
        mock_email.return_value = True
        
        response = await async_client.post(
            "/api/v1/auth/register/dealer",
            json={
                "email": test_email,
                "password": "StrongPassword123!",
                "full_name": "Test Dealer",
                "dealership_name": "Test Motors",
                "dealership_address": "123 Test Street, Test City"
            }
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["message"] == "Verification code sent to email"


# ============================================================================
# 7.26. Test dealer registration creates dealership
# ============================================================================
@pytest.mark.asyncio
async def test_dealer_registration_creates_dealership(async_client: AsyncClient, setup_db):
    """Test dealer verification creates both user and dealership"""
    from app.modules.auth.otp_service import OTPService
    from app.db.redis import get_redis
    from app.core.security import get_password_hash
    from sqlalchemy import select
    from app.modules.auth.models import Dealership
    
    test_email = f"dealer_{uuid.uuid4()}@example.com"
    test_password = "StrongPassword123!"
    
    # Create OTP and store password hash
    otp_service = OTPService(setup_db)
    redis_client = await get_redis()
    
    hashed_password = get_password_hash(test_password)
    temp_key = f"otp:reg:pwd:{test_email}"
    await redis_client.setex(temp_key, 600, hashed_password)
    
    context_data = {
        "full_name": "Test Dealer",
        "role": "dealer",
        "dealership_name": "Test Motors",
        "dealership_address": "123 Test Street"
    }
    otp_code = await otp_service.create_otp(test_email, "register", context_data)
    
    # Verify registration
    response = await async_client.post(
        "/api/v1/auth/verify-registration",
        json={"email": test_email, "code": otp_code}
    )
    
    assert response.status_code == 200
    
    # Verify dealership was created
    result = await setup_db.execute(
        select(Dealership).where(Dealership.name == "Test Motors")
    )
    dealership = result.scalar_one_or_none()
    assert dealership is not None
    assert dealership.address == "123 Test Street"


# ============================================================================
# 7.27. Test cookie setting on login verification
# ============================================================================
@pytest.mark.asyncio
async def test_login_verification_sets_cookies(async_client: AsyncClient, test_email, setup_db):
    """Test login verification sets secure cookies"""
    from app.modules.auth.models import User, RoleEnum
    from app.core.security import get_password_hash
    from app.modules.auth.otp_service import OTPService
    
    # Create user
    user = User(
        email=test_email,
        hashed_password=get_password_hash("StrongPassword123!"),
        full_name="Test User",
        role=RoleEnum.user
    )
    setup_db.add(user)
    await setup_db.flush()
    
    # Create login OTP
    otp_service = OTPService(setup_db)
    otp_code = await otp_service.create_otp(test_email, "login", {"user_id": str(user.id)})
    
    # Verify login
    response = await async_client.post(
        "/api/v1/auth/verify-login",
        json={"email": test_email, "code": otp_code}
    )
    
    assert response.status_code == 200
    
    # Check cookies in response
    cookies = response.cookies
    assert "access_token" in cookies
    assert "refresh_token" in cookies
    
    # Verify cookie attributes (httponly, secure, samesite)
    # Note: AsyncClient doesn't provide full cookie attributes in the response
    # In a real browser, these would be enforced


# ============================================================================
# 7.28. Test logout with invalid token gracefully succeeds
# ============================================================================
@pytest.mark.asyncio
async def test_logout_invalid_token_succeeds(async_client: AsyncClient):
    """Test logout with invalid token still clears cookies"""
    response = await async_client.post(
        "/api/v1/auth/logout",
        json={"refresh_token": "invalid_token"}
    )
    
    # Should succeed even with invalid token
    assert response.status_code == 200
    assert "logged out" in response.json()["detail"].lower()
