import uuid
import passlib.context
from datetime import datetime, timezone, timedelta
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete, update
from app.modules.auth.models import OTPCode
from app.core.config import settings
from app.shared.exceptions.handlers import CustomException

pwd_context = passlib.context.CryptContext(schemes=["bcrypt"], deprecated="auto")

class OTPService:
    def __init__(self, session: AsyncSession):
        self.session = session

    def _generate_numeric_otp(self) -> str:
        import secrets
        return "".join(str(secrets.randbelow(10)) for _ in range(6))

    async def create_otp(self, email: str, otp_type: str, context_data: dict = None) -> str:
        """
        Generates and stores a new OTP for the given email and type.
        Deletes any existing active OTPs for this exact email and type.
        """
        # Clean up existing active OTPs of same type
        stmt = delete(OTPCode).where(OTPCode.email == email, OTPCode.type == otp_type)
        await self.session.execute(stmt)

        otp = self._generate_numeric_otp()
        otp_hash = pwd_context.hash(otp)
        expires_at = datetime.now(timezone.utc) + timedelta(minutes=settings.OTP_EXPIRY_MINUTES)

        otp_record = OTPCode(
            email=email,
            type=otp_type,
            otp_hash=otp_hash,
            context_data=context_data,
            expires_at=expires_at
        )

        self.session.add(otp_record)
        await self.session.commit()
        return otp

    async def verify_otp(self, email: str, otp_type: str, code: str) -> OTPCode:
        """
        Verifies the provided OTP.
        Raises CustomException if invalid, expired, or too many attempts.
        Returns the OTPCode record containing context_data on success.
        The caller is responsible for deleting the OTP record after consuming the context.
        """
        result = await self.session.execute(
            select(OTPCode).where(OTPCode.email == email, OTPCode.type == otp_type)
        )
        otp_record = result.scalars().first()

        if not otp_record:
            raise CustomException(400, "OTP not found or expired")

        if datetime.now(timezone.utc) > otp_record.expires_at:
            await self.delete_otp(otp_record, commit=True)
            raise CustomException(400, "OTP has expired. Please request a new one.")

        if otp_record.attempts >= settings.OTP_MAX_ATTEMPTS:
            await self.delete_otp(otp_record, commit=True)
            raise CustomException(400, "Maximum OTP attempts exceeded. Please request a new one.")

        if not pwd_context.verify(code, otp_record.otp_hash):
            otp_record.attempts += 1
            await self.session.commit()
            raise CustomException(400, "Invalid OTP code")

        # Success - don't delete here so the caller can extract context_data
        return otp_record

    async def delete_otp(self, otp_record: OTPCode, commit: bool = False):
        """Delete an OTP record. Pass commit=True only when this is the final
        operation in the current unit-of-work (e.g. error-path cleanup)."""
        await self.session.delete(otp_record)
        if commit:
            await self.session.commit()

    async def enforce_cooldown(self, email: str, otp_type: str):
        """
        Checks if the user requested an OTP too recently.
        """
        result = await self.session.execute(
            select(OTPCode).where(OTPCode.email == email, OTPCode.type == otp_type)
        )
        otp_record = result.scalars().first()
        
        if otp_record:
            time_since_creation = (datetime.now(timezone.utc) - otp_record.created_at).total_seconds()
            if time_since_creation < settings.OTP_RESEND_COOLDOWN_SECONDS:
                remaining = int(settings.OTP_RESEND_COOLDOWN_SECONDS - time_since_creation)
                raise CustomException(429, f"Please wait {remaining} seconds before requesting a new OTP.")
