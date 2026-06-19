from fastapi import APIRouter, Depends, Body
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
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
async def register_user(
    req: RegisterUserRequest, service: AuthService = Depends(get_auth_service)
):
    return await service.register_user(req)


@router.post("/register/dealer", response_model=UserResponse)
async def register_dealer(
    req: RegisterDealerRequest, service: AuthService = Depends(get_auth_service)
):
    return await service.register_dealer(req)


@router.post("/login", response_model=TokenResponse)
async def login(req: LoginRequest, service: AuthService = Depends(get_auth_service)):
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
async def recover_mfa(
    req: MFARecoveryRequest, service: AuthService = Depends(get_auth_service)
):
    """Consume an MFA backup code to open a temporary login window."""
    await service.recover_mfa(req.email, req.recovery_code)
    return {
        "message": "Recovery code accepted. You have 15 minutes to login with your password."
    }


@router.post("/refresh", response_model=TokenResponse)
async def refresh(
    refresh_token: str = Body(..., embed=True),
    service: AuthService = Depends(get_auth_service),
):
    return await service.refresh(refresh_token)


@router.post("/logout")
async def logout(
    refresh_token: str = Body(..., embed=True),
    service: AuthService = Depends(get_auth_service),
):
    await service.logout(refresh_token)
    return {"detail": "Successfully logged out"}
