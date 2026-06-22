from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.exc import IntegrityError
from app.modules.users.repository import UserRepository
from app.core.events import event_bus
from app.modules.users.schemas import UserProfileUpdate
from app.shared.audit.service import AuditService
from app.shared.exceptions.handlers import CustomException
from uuid import UUID


class UserService:
    def __init__(self, session: AsyncSession):
        self.repository = UserRepository(session)
        self.session = session

    async def _log_audit(
        self,
        user_id: UUID,
        action: str,
        target_id: UUID | None = None,
        reason: str | None = None,
        details: str = "",
    ):
        await AuditService(self.session).log_action(
            user_id, action, target_id, reason, details
        )

    async def get_current_user_profile(self, user_id: UUID):
        user = await self.repository.get_user_by_id(user_id)
        if not user:
            raise CustomException(404, "User not found")
        return user

    async def get_public_user_profile(self, user_id: UUID):
        user = await self.repository.get_user_by_id(user_id)
        if not user:
            raise CustomException(404, "User not found")
        return user

    async def get_dealer_profile(self, dealership_id: UUID):
        dealer = await self.repository.get_dealer_by_id(dealership_id)
        if not dealer:
            raise CustomException(404, "Dealership not found")
        return dealer

    async def update_user_profile(self, user_id: UUID, req: UserProfileUpdate):
        user = await self.repository.get_user_by_id(user_id)
        if not user:
            raise CustomException(404, "User not found")

        # Email changes are NOT allowed through this endpoint.
        # They require OTP re-verification via /me/email/request-change and /me/email/verify-change.
        if req.email and str(req.email) != str(user.email):
            raise CustomException(
                400,
                "Email cannot be changed here. Use the email change flow: "
                "POST /me/email/request-change, then POST /me/email/verify-change.",
            )

        if req.full_name is not None:
            user.full_name = req.full_name
        if req.phone_number is not None:
            user.phone_number = req.phone_number
        if req.avatar_url is not None:
            user.avatar_url = str(req.avatar_url)

        try:
            await self.repository.update_user(user)
            await self._log_audit(
                user_id, "UPDATE_PROFILE", user_id, None, "User updated profile"
            )
            await self.session.commit()
            await self.session.refresh(user)
        except IntegrityError:
            await self.session.rollback()
            raise CustomException(400, "Data validation failed")

        return user

    async def request_email_change(self, user_id: UUID, new_email: str):
        """Step 1: Validate new email and send OTP to the NEW address."""
        from app.modules.auth.otp_service import OTPService
        from app.shared.email.resend_client import email_service

        user = await self.repository.get_user_by_id(user_id)
        if not user:
            raise CustomException(404, "User not found")

        if str(new_email).lower() == str(user.email).lower():
            raise CustomException(400, "New email is the same as the current email")

        existing = await self.repository.get_user_by_email(new_email)
        if existing:
            raise CustomException(400, "Email already in use")

        otp_service = OTPService(self.session)
        await otp_service.enforce_cooldown(new_email, "email_change")

        otp = await otp_service.create_otp(
            email=new_email,
            otp_type="email_change",
            context_data={"user_id": str(user_id), "new_email": new_email},
        )
        await email_service.send_email_change_otp(new_email, otp)
        return {"message": "A verification code was sent to the new email address."}

    async def verify_email_change(self, user_id: UUID, new_email: str, code: str):
        """Step 2: Verify OTP sent to new address and apply the change."""
        from sqlalchemy import delete as sa_delete
        from app.modules.auth.otp_service import OTPService
        from app.modules.auth.models import RefreshToken

        otp_service = OTPService(self.session)
        otp_record = await otp_service.verify_otp(new_email, "email_change", code)

        ctx = otp_record.context_data
        if str(ctx.get("user_id")) != str(user_id):
            await otp_service.delete_otp(otp_record, commit=True)
            raise CustomException(403, "OTP does not belong to this user")

        if str(ctx.get("new_email")).lower() != str(new_email).lower():
            await otp_service.delete_otp(otp_record, commit=True)
            raise CustomException(400, "Email mismatch")

        user = await self.repository.get_user_by_id(user_id)
        if not user:
            await otp_service.delete_otp(otp_record, commit=True)
            raise CustomException(404, "User not found")

        existing = await self.repository.get_user_by_email(new_email)
        if existing and existing.id != user.id:
            await otp_service.delete_otp(otp_record, commit=True)
            raise CustomException(400, "Email already in use")

        old_email = user.email
        user.email = new_email

        # Revoke all sessions — user must log in again with new email
        await self.session.execute(
            sa_delete(RefreshToken).where(RefreshToken.user_id == user.id)
        )

        await otp_service.delete_otp(otp_record)
        await self.repository.update_user(user)
        await self._log_audit(
            user_id, "EMAIL_CHANGED", user_id, None,
            f"Email changed from {old_email} to {new_email}"
        )

        try:
            await self.session.commit()
            await self.session.refresh(user)
        except IntegrityError:
            await self.session.rollback()
            raise CustomException(400, "Email already in use")

        return {"message": "Email changed successfully. Please log in again."}


    async def soft_delete_user(self, user_id: UUID):
        user = await self.repository.get_user_by_id(user_id)
        if not user:
            raise CustomException(404, "User not found")

        await self.repository.soft_delete_user(user)
        await self._log_audit(
            user_id, "SOFT_DELETE", user_id, None, "User deleted their account"
        )
        await event_bus.publish(
            "USER_SOFT_DELETED", session=self.session, user_id=user.id
        )
        await self.session.commit()

    async def deactivate_user(self, user_id: UUID):
        user = await self.repository.get_user_by_id(user_id)
        if not user:
            raise CustomException(404, "User not found")

        user.is_active = False
        await self.repository.update_user(user)
        await self._log_audit(
            user_id, "DEACTIVATE", user_id, None, "User account deactivated"
        )
        await event_bus.publish(
            "USER_DEACTIVATED", session=self.session, user_id=user.id
        )
        await self.session.commit()
