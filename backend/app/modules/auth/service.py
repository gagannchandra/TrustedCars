from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.exc import IntegrityError
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

    async def verify_password_async(self, plain: str, hashed: str) -> bool:
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

    async def register_user(self, req: RegisterUserRequest) -> User:
        hashed = await self.hash_password(req.password)
        existing = await self.repository.get_user_by_email(req.email)
        if existing:
            raise CustomException(400, "Email already registered")

        user = User(
            email=req.email,
            hashed_password=hashed,
            full_name=req.full_name,
            role=RoleEnum.user,
        )
        try:
            user = await self.repository.create_user(user)
            await self._log_audit(
                user.id, "REGISTER_USER", user.id, None, "Registered user account"
            )
            await self.session.commit()
            await self.session.refresh(user)
        except IntegrityError:
            await self.session.rollback()
            raise CustomException(400, "Email already registered")
        return user

    async def register_dealer(self, req: RegisterDealerRequest) -> User:
        hashed = await self.hash_password(req.password)
        existing = await self.repository.get_user_by_email(req.email)
        if existing:
            raise CustomException(400, "Email already registered")

        user = User(
            email=req.email,
            hashed_password=hashed,
            full_name=req.full_name,
            role=RoleEnum.dealer,
        )
        try:
            user = await self.repository.create_user(user)
            dealer = Dealership(
                user_id=user.id,
                name=req.dealership_name,
                address=req.dealership_address,
            )
            await self.repository.create_dealership(dealer)
            await self._log_audit(
                user.id,
                "REGISTER_DEALER",
                user.id,
                None,
                f"Registered dealership {req.dealership_name}",
            )
            await self.session.commit()
            await self.session.refresh(user)
        except IntegrityError:
            await self.session.rollback()
            raise CustomException(400, "Email already registered")
        return user

    async def login(self, req: LoginRequest):
        user = await self.repository.get_user_by_email(req.email)
        if not user:
            await self.session.rollback()
            raise CustomException(401, "Invalid credentials")

        user_id = user.id
        hashed_password = user.hashed_password
        mfa_enabled = user.mfa_enabled
        mfa_recovery_verified_until = user.mfa_recovery_verified_until
        encrypted_mfa_secret = user.mfa_secret

        await self.session.rollback()

        if not await self.verify_password_async(req.password, hashed_password):
            raise CustomException(401, "Invalid credentials")

        recovery_window_consumed = False
        if mfa_enabled:
            now = datetime.now(timezone.utc)
            if (
                mfa_recovery_verified_until
                and mfa_recovery_verified_until > now
            ):
                recovery_window_consumed = True
            else:
                if not req.mfa_code:
                    raise CustomException(401, "MFA code required")
                import pyotp

                secret = self.decrypt_mfa_secret(encrypted_mfa_secret, settings.MFA_ENCRYPTION_KEY)
                totp = pyotp.TOTP(secret)
                if not totp.verify(req.mfa_code):
                    raise CustomException(401, "Invalid MFA code")

        user = await self.repository.get_user_by_id(user_id)
        if not user:
            raise CustomException(401, "Invalid credentials")
        if recovery_window_consumed:
            user.mfa_recovery_verified_until = None

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
        await self._log_audit(user.id, "LOGIN", user.id, None, "User logged in")
        await self.session.commit()

        return {
            "access_token": access_token,
            "refresh_token": refresh_token_plain,
            "token_type": "bearer",
        }

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
        import pyotp
        import secrets
        from app.modules.auth.models import UserMFABackupCode

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
            name=current_user.email, issuer_name="TrustedCars"
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

        if not totp.verify(code):
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
            if payload.get("type") != "refresh":
                raise CustomException(401, "Invalid token type")
        except InvalidTokenError:
            raise CustomException(401, "Invalid or expired token")

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
