from fastapi import APIRouter, Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID
from pydantic import BaseModel, EmailStr
from app.db.session import get_db
from app.modules.users.schemas import (
    UserPrivateProfile,
    UserPublicProfile,
    UserProfileUpdate,
    DealershipPublic,
)
from app.modules.users.service import UserService
from app.modules.auth.models import User
from app.shared.dependencies.auth import get_current_active_user
from app.core.limiter import limiter

router = APIRouter()
dealers_router = APIRouter()


def get_user_service(db: AsyncSession = Depends(get_db)) -> UserService:
    return UserService(db)


class EmailChangeRequest(BaseModel):
    model_config = {"extra": "forbid"}
    new_email: EmailStr


class EmailVerifyRequest(BaseModel):
    model_config = {"extra": "forbid"}
    new_email: EmailStr
    code: str


@router.get("/me", response_model=UserPrivateProfile)
async def get_current_user(
    current_user: User = Depends(get_current_active_user),
    service: UserService = Depends(get_user_service),
):
    return await service.get_current_user_profile(current_user.id)


@router.put("/me", response_model=UserPrivateProfile)
async def update_current_user(
    req: UserProfileUpdate,
    current_user: User = Depends(get_current_active_user),
    service: UserService = Depends(get_user_service),
):
    return await service.update_user_profile(current_user.id, req)


@router.post("/me/email/request-change")
@limiter.limit("5/minute")
async def request_email_change(
    request: Request,
    req: EmailChangeRequest,
    current_user: User = Depends(get_current_active_user),
    service: UserService = Depends(get_user_service),
):
    return await service.request_email_change(current_user.id, str(req.new_email))


@router.post("/me/email/verify-change")
@limiter.limit("10/minute")
async def verify_email_change(
    request: Request,
    req: EmailVerifyRequest,
    current_user: User = Depends(get_current_active_user),
    service: UserService = Depends(get_user_service),
):
    return await service.verify_email_change(current_user.id, str(req.new_email), req.code)


@router.delete("/me")
async def delete_current_user(
    current_user: User = Depends(get_current_active_user),
    service: UserService = Depends(get_user_service),
):
    await service.soft_delete_user(current_user.id)
    return {"detail": "Account successfully deactivated"}


@router.get("/{id}", response_model=UserPublicProfile)
async def get_public_user(id: UUID, service: UserService = Depends(get_user_service)):
    return await service.get_public_user_profile(id)


@dealers_router.get("/{id}", response_model=DealershipPublic)
async def get_dealer_profile(
    id: UUID, service: UserService = Depends(get_user_service)
):
    return await service.get_dealer_profile(id)
