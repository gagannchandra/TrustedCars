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
)
from app.modules.auth.service import AuthService
from app.modules.auth.models import User
from app.shared.dependencies.auth import get_current_active_user

router = APIRouter()


def get_auth_service(db: AsyncSession = Depends(get_db)) -> AuthService:
    return AuthService(db)


@router.post("/register/user", response_model=UserResponse)
@limiter.limit("5/minute")
async def register_user(
    request: Request, req: RegisterUserRequest, service: AuthService = Depends(get_auth_service)
):
    return await service.register_user(req)


@router.post("/register/dealer", response_model=UserResponse)
@limiter.limit("5/minute")
async def register_dealer(
    request: Request, req: RegisterDealerRequest, service: AuthService = Depends(get_auth_service)
):
    return await service.register_dealer(req)


@router.post("/login")
@limiter.limit("10/minute")
async def login(
    request: Request, response: Response, req: LoginRequest, service: AuthService = Depends(get_auth_service)
):
    tokens = await service.login(req)
    response.set_cookie(
        key="access_token",
        value=tokens.access_token,
        httponly=True,
        secure=True,
        samesite="lax",
        max_age=30 * 60, # 30 mins
    )
    response.set_cookie(
        key="refresh_token",
        value=tokens.refresh_token,
        httponly=True,
        secure=True,
        samesite="lax",
        max_age=7 * 24 * 60 * 60, # 7 days
    )
    return {"detail": "Successfully logged in"}


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
async def recover_mfa(
    req: MFARecoveryRequest, service: AuthService = Depends(get_auth_service)
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
        value=tokens.access_token,
        httponly=True,
        secure=True,
        samesite="lax",
        max_age=30 * 60,
    )
    response.set_cookie(
        key="refresh_token",
        value=tokens.refresh_token,
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
    if refresh_token:
        await service.logout(refresh_token)
    response.delete_cookie(key="access_token")
    response.delete_cookie(key="refresh_token")
    return {"detail": "Successfully logged out"}
