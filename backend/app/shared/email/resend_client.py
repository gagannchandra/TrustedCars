import resend
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)

class EmailService:
    def __init__(self):
        # Email service is now validated at startup - API key is guaranteed to be present
        self.api_key = settings.RESEND_API_KEY
        self.from_email = settings.RESEND_FROM_EMAIL
        self.app_name = settings.APP_NAME
        
        # Configure Resend SDK with API key
        resend.api_key = self.api_key

    async def _send_email(self, to_email: str, subject: str, html_content: str):
        try:
            params = {
                "from": f"{self.app_name} <{self.from_email}>",
                "to": to_email,
                "subject": subject,
                "html": html_content,
            }
            # Resend python SDK currently is sync, use to_thread for async wrapper
            import asyncio
            response = await asyncio.to_thread(resend.Emails.send, params)
            logger.info(f"Email sent successfully to {to_email}: {response}")
            return True
        except Exception as e:
            logger.exception(f"Failed to send email to {to_email}: {e}")
            return False

    async def send_registration_otp(self, to_email: str, otp: str):
        subject = f"Verify your {self.app_name} registration"
        html = f"""
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
            <h2 style="color: #0F172A;">Welcome to {self.app_name}!</h2>
            <p>Thanks for signing up. Please use the following 6-digit code to verify your email address and complete your registration:</p>
            <div style="background-color: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px; padding: 20px; text-align: center; margin: 30px 0;">
                <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #3B82F6;">{otp}</span>
            </div>
            <p style="font-size: 14px; color: #64748B;">This code will expire in {settings.OTP_EXPIRY_MINUTES} minutes.</p>
            <p>If you didn't request this, you can safely ignore this email.</p>
        </div>
        """
        return await self._send_email(to_email, subject, html)

    async def send_login_otp(self, to_email: str, otp: str):
        subject = f"Your {self.app_name} login code"
        html = f"""
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
            <h2 style="color: #0F172A;">Login Verification</h2>
            <p>Please use the following 6-digit code to securely log in to your {self.app_name} account:</p>
            <div style="background-color: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px; padding: 20px; text-align: center; margin: 30px 0;">
                <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #3B82F6;">{otp}</span>
            </div>
            <p style="font-size: 14px; color: #64748B;">This code will expire in {settings.OTP_EXPIRY_MINUTES} minutes.</p>
            <p>If you didn't attempt to log in, please reset your password immediately as your credentials may be compromised.</p>
        </div>
        """
        return await self._send_email(to_email, subject, html)

    async def send_password_reset_otp(self, to_email: str, otp: str):
        subject = f"Reset your {self.app_name} password"
        html = f"""
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
            <h2 style="color: #0F172A;">Password Reset Request</h2>
            <p>We received a request to reset the password for your {self.app_name} account. Use the code below to verify your identity:</p>
            <div style="background-color: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px; padding: 20px; text-align: center; margin: 30px 0;">
                <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #3B82F6;">{otp}</span>
            </div>
            <p style="font-size: 14px; color: #64748B;">This code will expire in {settings.OTP_EXPIRY_MINUTES} minutes.</p>
            <p>If you didn't request a password reset, you can safely ignore this email.</p>
        </div>
        """
        return await self._send_email(to_email, subject, html)

    async def send_email_change_otp(self, new_email: str, otp: str):
        subject = f"Verify your new {self.app_name} email address"
        html = f"""
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
            <h2 style="color: #0F172A;">Email Address Change</h2>
            <p>We received a request to change your {self.app_name} account email to this address. Use the code below to confirm:</p>
            <div style="background-color: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px; padding: 20px; text-align: center; margin: 30px 0;">
                <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #3B82F6;">{otp}</span>
            </div>
            <p style="font-size: 14px; color: #64748B;">This code will expire in {settings.OTP_EXPIRY_MINUTES} minutes.</p>
            <p>If you didn't request this change, please secure your account immediately — someone may have access to it.</p>
        </div>
        """
        return await self._send_email(new_email, subject, html)

# Global singleton
email_service = EmailService()
