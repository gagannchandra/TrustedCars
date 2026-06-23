from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.exc import IntegrityError
from sqlalchemy import delete
from app.modules.auth.repository import AuthRepository
from app.modules.auth.schemas import (
    RegisterUserRequest,
    RegisterDealerRequest,
    LoginRequest,
)
from app.modules.auth.models import User, RefreshToken, Dealership, RoleEnum
from app.shared.audit.service import AuditService
from app.core.security import (
    get_password_hash,
    verify_password,
    create_access_token,
    create_refresh_token,
)
from app.shared.exceptions.handlers import CustomException
import hashlib
import uuid
import asyncio
from datetime import datetime, timezone, timedelta
import jwt
from jwt import InvalidTokenError
from app.core.config import settings


class AuthService:
    def __init__(self, session: AsyncSession):
        self.repository = AuthRepository(session)
        self.session = session

    async def _log_audit(
        self,
        user_id: uuid.UUID,
        action: str,
        target_id: uuid.UUID | None = None,
        reason: str | None = None,
        details: str = "",
    ):
        await AuditService(self.session).log_action(
            user_id, action, target_id, reason, details
        )

    def hash_token(self, token: str) -> str:
        return hashlib.sha256(token.encode()).hexdigest()

    async def hash_password(self, password: str) -> str:
        return await asyncio.to_thread(get_password_hash, password)

    async def verify_password_async(self, plain: str, hashed: str) -> tuple[bool, bool]:
        return await asyncio.to_thread(verify_password, plain, hashed)

    def _get_fernet_key(self, key: str) -> bytes:
        import base64
        import hashlib

        key_bytes = hashlib.sha256(key.encode()).digest()
        return base64.urlsafe_b64encode(key_bytes)

    def encrypt_mfa_secret(self, secret: str, key: str) -> str:
        from cryptography.fernet import Fernet

        f = Fernet(self._get_fernet_key(key))
        return f.encrypt(secret.encode()).decode()

    def decrypt_mfa_secret(self, encrypted_secret: str | None, key: str) -> str:
        from cryptography.fernet import Fernet

        f = Fernet(self._get_fernet_key(key))
        return f.decrypt(str(encrypted_secret).encode()).decode()

    async def register_user(self, req: RegisterUserRequest) -> dict:
        existing = await self.repository.get_user_by_email(req.email)
        if existing:
            raise CustomException(400, "Email already registered")
            
        from app.modules.auth.otp_service import OTPService
        from app.shared.email.resend_client import email_service
        
        otp_service = OTPService(self.session)
        await otp_service.enforce_cooldown(req.email, "register")
        
        hashed = await self.hash_password(req.password)
        
        # Store password hash in Redis with OTP expiry instead of DB for security
        from app.db.redis import get_redis
        redis_client = await get_redis()
        temp_key = f"otp:reg:pwd:{req.email}"
        await redis_client.setex(temp_key, 600, hashed)  # 10 min expiry
        
        context_data = {
            "full_name": req.full_name,
            "role": RoleEnum.user.value
        }
        
        otp = await otp_service.create_otp(req.email, "register", context_data)
        success = await email_service.send_registration_otp(req.email, otp)
        
        if not success:
            raise CustomException(500, "Failed to send verification email. Please try again.")
            
        return {"message": "Verification code sent to email"}

    async def register_dealer(self, req: RegisterDealerRequest) -> dict:
        existing = await self.repository.get_user_by_email(req.email)
        if existing:
            raise CustomException(400, "Email already registered")
            
        from app.modules.auth.otp_service import OTPService
        from app.shared.email.resend_client import email_service
        
        otp_service = OTPService(self.session)
        await otp_service.enforce_cooldown(req.email, "register")
        
        hashed = await self.hash_password(req.password)
        
        # Store password hash in Redis with OTP expiry instead of DB for security
        from app.db.redis import get_redis
        redis_client = await get_redis()
        temp_key = f"otp:reg:pwd:{req.email}"
        await redis_client.setex(temp_key, 600, hashed)  # 10 min expiry
        
        context_data = {
            "full_name": req.full_name,
            "role": RoleEnum.dealer.value,
            "dealership_name": req.dealership_name,
            "dealership_address": req.dealership_address
        }
        
        otp = await otp_service.create_otp(req.email, "register", context_data)
        success = await email_service.send_registration_otp(req.email, otp)
        
        if not success:
            raise CustomException(500, "Failed to send verification email. Please try again.")
            
        return {"message": "Verification code sent to email"}

    async def login(self, req: LoginRequest):
        from app.db.redis import get_redis
        redis_client = await get_redis()
        lockout_key = f"failed_login:{req.email}"
        try:
            failed_attempts = await redis_client.get(lockout_key)
            if failed_attempts and int(failed_attempts) >= 5:
                raise CustomException(429, "Too many failed login attempts. Please try again later.")
        except CustomException:
            raise
        except Exception as e:
            import structlog
            structlog.get_logger(__name__).error("Redis down during login lockout check", error=str(e))
            raise CustomException(503, "Authentication service temporarily unavailable")
        
        user = await self.repository.get_user_by_email(req.email)
        if not user:
            _DUMMY_HASH = "$2b$12$G1O.N2dD8iC4C04N2bN.wOg2/yV2Hl9Xg2O3wY.s2S4uX8q9k0Y6O"
            await self.verify_password_async(req.password, _DUMMY_HASH)
            try:
                await redis_client.incr(lockout_key)
                await redis_client.expire(lockout_key, 15 * 60)
            except Exception:
                pass
            raise CustomException(401, "Invalid credentials")

        if user.is_suspended:
            raise CustomException(403, "Account suspended. Please contact support.")

        is_valid, needs_rehash = await self.verify_password_async(req.password, user.hashed_password)
        if not is_valid:
            try:
                await redis_client.incr(lockout_key)
                await redis_client.expire(lockout_key, 15 * 60)
            except Exception:
                pass
            raise CustomException(401, "Invalid credentials")

        if needs_rehash:
            user.hashed_password = await self.hash_password(req.password)
            self.session.add(user)
            
        try:
            await redis_client.delete(lockout_key)
        except Exception:
            pass

        from app.modules.auth.otp_service import OTPService
        from app.shared.email.resend_client import email_service
        
        otp_service = OTPService(self.session)
        await otp_service.enforce_cooldown(req.email, "login")
        
        otp = await otp_service.create_otp(req.email, "login", {"user_id": str(user.id)})
        success = await email_service.send_login_otp(req.email, otp)
        
        if not success:
            raise CustomException(500, "Failed to send login verification email")
            
        return {"message": "OTP sent to email. Please verify to login."}

    async def refresh(self, refresh_token_plain: str):
        try:
            payload = jwt.decode(
                refresh_token_plain,
                settings.JWT_SECRET_KEY,
                algorithms=[settings.ALGORITHM],
            )
            if payload.get("type") != "refresh":
                raise CustomException(401, "Invalid token type")
        except InvalidTokenError:
            raise CustomException(401, "Invalid or expired token")

        token_hash = self.hash_token(refresh_token_plain)
        db_token = await self.repository.get_refresh_token_for_update(token_hash)

        if not db_token:
            raise CustomException(401, "Invalid refresh token")

        if db_token.is_revoked:
            await self.repository.revoke_refresh_token_family(db_token.family_id)
            await self.session.commit()
            raise CustomException(401, "Token revoked. Please login again.")

        if db_token.expires_at < datetime.now(timezone.utc):
            raise CustomException(401, "Refresh token expired")

        user = await self.repository.get_user_by_id(db_token.user_id)
        if not user:
            raise CustomException(401, "User not found")
        if user.is_suspended:
            raise CustomException(403, "Account suspended")
        if user.deleted_at is not None:
            raise CustomException(401, "Account deleted")

        db_token.is_revoked = True

        access_token = create_access_token(subject=db_token.user_id)
        new_refresh_plain = create_refresh_token(subject=db_token.user_id)

        new_rt = RefreshToken(
            user_id=db_token.user_id,
            token_hash=self.hash_token(new_refresh_plain),
            family_id=db_token.family_id,
            expires_at=datetime.now(timezone.utc)
            + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS),
        )

        await self.repository.save_refresh_token(new_rt)
        await self.session.commit()

        return {"access_token": access_token, "refresh_token": new_refresh_plain}

    async def enroll_mfa(self, current_user: User) -> dict:
        if current_user.mfa_enabled:
            raise CustomException(
                400,
                "MFA is already active. Disable it first before re-enrolling."
            )
        import pyotp
        import secrets
        from app.modules.auth.models import UserMFABackupCode

        await self.session.execute(
            delete(UserMFABackupCode).where(
                UserMFABackupCode.user_id == current_user.id,
                UserMFABackupCode.used_at.is_(None),
            )
        )

        secret = pyotp.random_base32()

        encrypted_secret = self.encrypt_mfa_secret(secret, settings.MFA_ENCRYPTION_KEY)

        current_user.mfa_secret = encrypted_secret

        # Generate 10 backup codes
        plaintext_codes = []
        for _ in range(10):
            code = secrets.token_urlsafe(12)
            plaintext_codes.append(code)
            hashed_code = hashlib.sha256(code.encode()).hexdigest()
            backup_code_entry = UserMFABackupCode(
                user_id=current_user.id, code_hash=hashed_code
            )
            self.session.add(backup_code_entry)

        # Do not set mfa_enabled = True yet.
        await self.session.commit()

        uri = pyotp.totp.TOTP(secret).provisioning_uri(
            name=current_user.email, issuer_name="TrustedCarz"
        )
        return {
            "secret": secret,
            "provisioning_uri": uri,
            "backup_codes": plaintext_codes,
        }

    async def verify_mfa(self, current_user: User, code: str):
        if not current_user.mfa_secret:
            raise CustomException(status_code=400, detail="MFA not enrolled")

        import pyotp

        secret = self.decrypt_mfa_secret(current_user.mfa_secret, settings.MFA_ENCRYPTION_KEY)
        totp = pyotp.TOTP(secret)
        
        from app.db.redis import get_redis
        redis_client = await get_redis()
        redis_key = f"totp_used:{current_user.id}:{code}"
        
        try:
            is_new_code = await redis_client.set(redis_key, "1", nx=True, ex=90)
            if not is_new_code:
                raise CustomException(status_code=401, detail="MFA code already used")
        except CustomException:
            raise
        except Exception as e:
            import structlog
            structlog.get_logger(__name__).error("Redis down during TOTP replay check", error=str(e))
            raise CustomException(503, "Authentication service temporarily unavailable")

        if not totp.verify(code):
            try:
                await redis_client.delete(redis_key)
            except Exception:
                pass
            raise CustomException(status_code=400, detail="Invalid MFA code")

        current_user.mfa_enabled = True
        await self.session.commit()

        await self._log_audit(
            current_user.id,
            "MFA_ENABLED",
            current_user.id,
            None,
            f"User {current_user.id} enabled MFA",
        )

    async def recover_mfa(self, email: str, recovery_code: str):
        user = await self.repository.get_user_by_email(email)
        if not user or not user.mfa_enabled:
            # Dummy timing check for enumeration mitigation
            dummy_hash = hashlib.sha256(recovery_code.encode()).hexdigest()
            from sqlalchemy.future import select
            from app.modules.auth.models import UserMFABackupCode
            stmt = select(UserMFABackupCode).where(
                UserMFABackupCode.user_id == uuid.UUID("00000000-0000-0000-0000-000000000000"),
                UserMFABackupCode.code_hash == dummy_hash
            )
            await self.session.execute(stmt)
            raise CustomException(status_code=400, detail="Invalid request")

        from sqlalchemy.future import select
        from app.modules.auth.models import UserMFABackupCode

        recovery_hash = hashlib.sha256(recovery_code.encode()).hexdigest()

        stmt = select(UserMFABackupCode).where(
            UserMFABackupCode.user_id == user.id,
            UserMFABackupCode.code_hash == recovery_hash,
            UserMFABackupCode.used_at.is_(None),
        )
        result = await self.session.execute(stmt)
        matched_code = result.scalar_one_or_none()

        if not matched_code:
            raise CustomException(
                status_code=400, detail="Invalid or already used recovery code"
            )

        # Consume the recovery code atomically
        matched_code.used_at = datetime.now(timezone.utc)

        # Mark user as recovered for the next 15 minutes to allow login
        user.mfa_recovery_verified_until = datetime.now(timezone.utc) + timedelta(
            minutes=15
        )

        await self._log_audit(
            user.id, "MFA_RECOVERY", user.id, None, "User consumed an MFA backup code"
        )
        await self.session.commit()

    async def logout(self, refresh_token_plain: str):
        try:
            payload = jwt.decode(
                refresh_token_plain,
                settings.JWT_SECRET_KEY,
                algorithms=[settings.ALGORITHM],
            )
        except InvalidTokenError:
            pass

        token_hash = self.hash_token(refresh_token_plain)
        db_token = await self.repository.get_refresh_token(token_hash)
        if db_token:
            db_token.is_revoked = True
            await self._log_audit(
                db_token.user_id, "LOGOUT", db_token.user_id, None, "User logged out"
            )
            await self.session.commit()

    async def handle_user_deleted(self, user_id: uuid.UUID):
        await self.repository.revoke_all_user_refresh_tokens(user_id)
        from sqlalchemy import update
        from app.core.models import DeletedReason

        now = datetime.now(timezone.utc)
        stmt = (
            update(Dealership)
            .where(Dealership.user_id == user_id, Dealership.deleted_at.is_(None))
            .values(deleted_at=now, deleted_reason=DeletedReason.account_deleted)
        )
        await self.session.execute(stmt)

    async def handle_user_deactivated(self, user_id: uuid.UUID):
        await self.repository.revoke_all_user_refresh_tokens(user_id)

    async def handle_user_suspended(self, user_id: uuid.UUID):
        await self.repository.revoke_all_user_refresh_tokens(user_id)
        from app.db.redis import get_redis
        redis_client = await get_redis()
        await redis_client.set(f"suspended:user:{user_id}", "1")

    async def handle_user_restored(self, user_id: uuid.UUID):
        from app.db.redis import get_redis
        redis_client = await get_redis()
        await redis_client.delete(f"suspended:user:{user_id}")

    async def verify_registration(self, email: str, code: str) -> User:
        from app.modules.auth.otp_service import OTPService
        from app.db.redis import get_redis
        
        otp_service = OTPService(self.session)
        redis_client = await get_redis()
        
        otp_record = await otp_service.verify_otp(email, "register", code)
        context = otp_record.context_data
        
        # Retrieve password hash from Redis
        temp_key = f"otp:reg:pwd:{email}"
        password_hash = await redis_client.get(temp_key)
        if not password_hash:
            await otp_service.delete_otp(otp_record, commit=True)
            raise CustomException(400, "Registration session expired. Please start again.")
        
        existing = await self.repository.get_user_by_email(email)
        if existing:
            await otp_service.delete_otp(otp_record, commit=True)
            await redis_client.delete(temp_key)
            raise CustomException(400, "Email already registered")
            
        user = User(
            email=email,
            hashed_password=password_hash,
            full_name=context["full_name"],
            role=RoleEnum(context["role"]),
        )
        try:
            user = await self.repository.create_user(user)
            if user.role == RoleEnum.dealer:
                dealer = Dealership(
                    user_id=user.id,
                    name=context["dealership_name"],
                    address=context["dealership_address"],
                )
                await self.repository.create_dealership(dealer)
                await self._log_audit(user.id, "REGISTER_DEALER", user.id, None, f"Registered dealership {dealer.name}")
            else:
                await self._log_audit(user.id, "REGISTER_USER", user.id, None, "Registered user account")
            
            await otp_service.delete_otp(otp_record)
            await redis_client.delete(temp_key)  # Clean up password hash

            access_token = create_access_token(subject=user.id)
            refresh_token_plain = create_refresh_token(subject=user.id)

            family_id = uuid.uuid4()
            rt = RefreshToken(
                user_id=user.id,
                token_hash=self.hash_token(refresh_token_plain),
                family_id=family_id,
                expires_at=datetime.now(timezone.utc)
                + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS),
            )
            await self.repository.save_refresh_token(rt)

            await self.session.commit()
            await self.session.refresh(user)
        except IntegrityError:
            await self.session.rollback()
            await redis_client.delete(temp_key)
            raise CustomException(400, "Email already registered")

        return {
            "access_token": access_token,
            "refresh_token": refresh_token_plain,
            "token_type": "bearer",
        }

    async def verify_login(self, email: str, code: str) -> dict:
        from app.modules.auth.otp_service import OTPService
        otp_service = OTPService(self.session)
        
        otp_record = await otp_service.verify_otp(email, "login", code)
        
        user = await self.repository.get_user_by_email(email)
        if not user or str(user.id) != otp_record.context_data["user_id"]:
            await otp_service.delete_otp(otp_record, commit=True)
            raise CustomException(401, "Invalid user record")
            
        await otp_service.delete_otp(otp_record)
        
        access_token = create_access_token(subject=user.id)
        refresh_token_plain = create_refresh_token(subject=user.id)

        family_id = uuid.uuid4()
        rt = RefreshToken(
            user_id=user.id,
            token_hash=self.hash_token(refresh_token_plain),
            family_id=family_id,
            expires_at=datetime.now(timezone.utc)
            + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS),
        )
        await self.repository.save_refresh_token(rt)
        await self._log_audit(user.id, "LOGIN_OTP", user.id, None, "User logged in via OTP")
        await self.session.commit()

        return {
            "access_token": access_token,
            "refresh_token": refresh_token_plain,
            "token_type": "bearer",
        }

    async def forgot_password(self, email: str):
        user = await self.repository.get_user_by_email(email)
        if not user:
            # Silently succeed to prevent email enumeration
            return {"message": "If that email is registered, a reset code was sent."}

        from app.modules.auth.otp_service import OTPService
        from app.shared.email.resend_client import email_service
        
        otp_service = OTPService(self.session)
        await otp_service.enforce_cooldown(email, "reset")
        
        otp = await otp_service.create_otp(email, "reset", {"user_id": str(user.id)})
        await email_service.send_password_reset_otp(email, otp)
        
        return {"message": "If that email is registered, a reset code was sent."}

    async def verify_reset_password(self, email: str, code: str):
        from app.modules.auth.otp_service import OTPService
        otp_service = OTPService(self.session)
        
        otp_record = await otp_service.verify_otp(email, "reset", code)
        
        # Don't delete OTP here, let reset_password consume it.
        # Alternatively, we could delete it and issue a short-lived JWT token to prove they verified.
        # Let's issue a temporary JWT token to make the final reset stateless.
        
        await otp_service.delete_otp(otp_record)
        
        user_id = otp_record.context_data["user_id"]
        reset_token = jwt.encode(
            {"sub": user_id, "type": "reset_password", "exp": datetime.now(timezone.utc) + timedelta(minutes=15)},
            settings.JWT_SECRET_KEY,
            algorithm=settings.ALGORITHM
        )
        
        return {"reset_token": reset_token}

    async def reset_password(self, reset_token: str, new_password: str):
        try:
            payload = jwt.decode(
                reset_token,
                settings.JWT_SECRET_KEY,
                algorithms=[settings.ALGORITHM],
            )
            if payload.get("type") != "reset_password":
                raise CustomException(401, "Invalid token type")
        except InvalidTokenError:
            raise CustomException(401, "Invalid or expired reset token")
            
        user_id = payload.get("sub")
        user = await self.repository.get_user_by_id(user_id)
        if not user:
            raise CustomException(404, "User not found")
            
        user.hashed_password = await self.hash_password(new_password)
        self.session.add(user)
        
        # Invalidate all existing sessions
        await self.session.execute(
            delete(RefreshToken).where(RefreshToken.user_id == user.id)
        )
        
        await self._log_audit(user.id, "PASSWORD_RESET", user.id, None, "User reset their password")
        await self.session.commit()
        
        return {"message": "Password successfully reset. You may now login."}
