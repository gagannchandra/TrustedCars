from fastapi import APIRouter, Depends, Body, Response, Request, Cookie, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.core.limiter import limiter
from app.modules.auth.schemas import (
    RegisterUserRequest,
    RegisterDealerRequest,
    LoginRequest,
    TokenResponse,
    UserResponse,
    MFAEnrollResponse,
    MFAVerifyRequest,
    MFARecoveryRequest,
    VerifyOTPRequest,
    ForgotPasswordRequest,
    ResetPasswordRequest,
)
from app.modules.auth.service import AuthService
from app.modules.auth.models import User
from app.shared.dependencies.auth import get_current_active_user

router = APIRouter()


def get_auth_service(db: AsyncSession = Depends(get_db)) -> AuthService:
    return AuthService(db)


@router.post("/register/user")
@limiter.limit("5/minute")
async def register_user(
    request: Request, req: RegisterUserRequest, service: AuthService = Depends(get_auth_service)
):
    return await service.register_user(req)


@router.post("/register/dealer")
@limiter.limit("5/minute")
async def register_dealer(
    request: Request, req: RegisterDealerRequest, service: AuthService = Depends(get_auth_service)
):
    return await service.register_dealer(req)


@router.post("/login")
@limiter.limit("10/minute")
async def login(
    request: Request, req: LoginRequest, service: AuthService = Depends(get_auth_service)
):
    return await service.login(req)


@router.post("/mfa/enroll", response_model=MFAEnrollResponse)
async def enroll_mfa(
    current_user: User = Depends(get_current_active_user),
    service: AuthService = Depends(get_auth_service),
):
    """Generate a new MFA secret and return the provisioning URI. Does not enable MFA until verified."""
    return await service.enroll_mfa(current_user)


@router.post("/mfa/verify")
async def verify_mfa(
    req: MFAVerifyRequest,
    current_user: User = Depends(get_current_active_user),
    service: AuthService = Depends(get_auth_service),
):
    """Verify the MFA code and enable MFA for the user."""
    await service.verify_mfa(current_user, req.code)
    return {"message": "MFA enabled successfully"}


@router.post("/mfa/recovery")
@limiter.limit("10/minute")
async def recover_mfa(
    request: Request, req: MFARecoveryRequest, service: AuthService = Depends(get_auth_service)
):
    """Consume an MFA backup code to open a temporary login window."""
    await service.recover_mfa(req.email, req.recovery_code)
    return {
        "message": "Recovery code accepted. You have 15 minutes to login with your password."
    }


@router.post("/refresh")
@limiter.limit("20/minute")
async def refresh(
    request: Request,
    response: Response,
    refresh_token: str | None = Cookie(None),
    service: AuthService = Depends(get_auth_service),
):
    if not refresh_token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Refresh token missing")
    tokens = await service.refresh(refresh_token)
    response.set_cookie(
        key="access_token",
        value=tokens["access_token"],
        httponly=True,
        secure=True,
        samesite="lax",
        max_age=30 * 60,
    )
    response.set_cookie(
        key="refresh_token",
        value=tokens["refresh_token"],
        httponly=True,
        secure=True,
        samesite="lax",
        max_age=7 * 24 * 60 * 60,
    )
    return {"detail": "Successfully refreshed"}


@router.post("/logout")
async def logout(
    response: Response,
    refresh_token: str | None = Cookie(None),
    service: AuthService = Depends(get_auth_service),
):
    try:
        if refresh_token:
            await service.logout(refresh_token)
    finally:
        response.delete_cookie(key="access_token")
        response.delete_cookie(key="refresh_token")
    return {"detail": "Successfully logged out"}


@router.post("/verify-registration")
@limiter.limit("10/minute")
async def verify_registration(
    request: Request, response: Response, req: VerifyOTPRequest, service: AuthService = Depends(get_auth_service)
):
    tokens = await service.verify_registration(req.email, req.code)
    response.set_cookie(
        key="access_token", value=tokens["access_token"], httponly=True, secure=True, samesite="lax", max_age=30 * 60,
    )
    response.set_cookie(
        key="refresh_token", value=tokens["refresh_token"], httponly=True, secure=True, samesite="lax", max_age=7 * 24 * 60 * 60,
    )
    return {"detail": "Successfully verified and logged in"}


@router.post("/verify-login")
@limiter.limit("10/minute")
async def verify_login(
    request: Request, response: Response, req: VerifyOTPRequest, service: AuthService = Depends(get_auth_service)
):
    tokens = await service.verify_login(req.email, req.code)
    response.set_cookie(
        key="access_token", value=tokens["access_token"], httponly=True, secure=True, samesite="lax", max_age=30 * 60,
    )
    response.set_cookie(
        key="refresh_token", value=tokens["refresh_token"], httponly=True, secure=True, samesite="lax", max_age=7 * 24 * 60 * 60,
    )
    return {"detail": "Successfully logged in"}


@router.post("/forgot-password")
@limiter.limit("5/minute")
async def forgot_password(
    request: Request, req: ForgotPasswordRequest, service: AuthService = Depends(get_auth_service)
):
    return await service.forgot_password(req.email)


@router.post("/verify-reset-password")
@limiter.limit("10/minute")
async def verify_reset_password(
    request: Request, req: VerifyOTPRequest, service: AuthService = Depends(get_auth_service)
):
    return await service.verify_reset_password(req.email, req.code)


@router.post("/reset-password")
@limiter.limit("5/minute")
async def reset_password(
    request: Request, req: ResetPasswordRequest, service: AuthService = Depends(get_auth_service)
):
    return await service.reset_password(req.reset_token, req.new_password)
