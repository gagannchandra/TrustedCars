from fastapi import APIRouter, Depends, Query, Request
from app.core.limiter import limiter
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional
from datetime import datetime
from uuid import UUID
from app.db.session import get_db
from app.modules.inquiries.schemas import (
    InquiryCreate,
    MessageCreate,
    InquiryResponse,
    InquiryDetailResponse,
    MessageResponse,
    PaginatedMessageResponse,
)
from app.modules.inquiries.service import InquiryService
from app.shared.dependencies.auth import get_current_active_user
from app.modules.auth.models import User
from app.shared.interfaces.cars import CarOwnershipProvider
from app.core.dependencies import get_car_provider

router = APIRouter(prefix="/api/v1/inquiries", tags=["Inquiries"])


def get_inquiry_service(
    session: AsyncSession = Depends(get_db),
    car_provider: CarOwnershipProvider = Depends(get_car_provider),
) -> InquiryService:
    return InquiryService(session, car_provider)


@router.post("", response_model=InquiryResponse)
@limiter.limit("20/minute")
async def create_inquiry(
    request: Request,
    req: InquiryCreate,
    current_user: User = Depends(get_current_active_user),
    service: InquiryService = Depends(get_inquiry_service),
):
    return await service.create_inquiry(req, current_user)


@router.get("/me", response_model=list[InquiryResponse])
@limiter.limit("30/minute")
async def get_my_inquiries(
    request: Request,
    cursor: Optional[datetime] = Query(None),
    limit: int = Query(50, ge=1, le=100),
    current_user: User = Depends(get_current_active_user),
    service: InquiryService = Depends(get_inquiry_service),
):
    buyer_inqs = await service.list_user_inquiries(current_user, False, cursor, limit)
    seller_inqs = await service.list_user_inquiries(current_user, True, cursor, limit)
    return buyer_inqs + seller_inqs

@router.get("", response_model=list[InquiryResponse])
@limiter.limit("30/minute")
async def list_user_inquiries(
    request: Request,
    as_seller: bool = Query(
        False, description="List inquiries where you are the seller"
    ),
    cursor: Optional[datetime] = Query(None),
    limit: int = Query(50, ge=1, le=100),
    current_user: User = Depends(get_current_active_user),
    service: InquiryService = Depends(get_inquiry_service),
):
    return await service.list_user_inquiries(current_user, as_seller, cursor, limit)


@router.get("/{id}", response_model=InquiryDetailResponse)
async def get_inquiry_details(
    id: UUID,
    current_user: User = Depends(get_current_active_user),
    service: InquiryService = Depends(get_inquiry_service),
):
    return await service.get_inquiry_details(id, current_user)


@router.get("/{id}/messages", response_model=PaginatedMessageResponse)
@limiter.limit("60/minute")
async def list_inquiry_messages(
    request: Request,
    id: UUID,
    cursor: Optional[datetime] = Query(None),
    limit: int = Query(50, ge=1, le=100),
    current_user: User = Depends(get_current_active_user),
    service: InquiryService = Depends(get_inquiry_service),
):
    return await service.list_inquiry_messages(id, current_user, cursor, limit)


@router.post("/{id}/messages", response_model=MessageResponse)
@limiter.limit("60/minute")
async def send_message(
    request: Request,
    id: UUID,
    req: MessageCreate,
    current_user: User = Depends(get_current_active_user),
    service: InquiryService = Depends(get_inquiry_service),
):
    return await service.send_message(id, req, current_user)


@router.patch("/{id}/close", response_model=InquiryResponse)
async def close_inquiry(
    id: UUID,
    current_user: User = Depends(get_current_active_user),
    service: InquiryService = Depends(get_inquiry_service),
):
    return await service.close_inquiry(id, current_user)


from app.shared.rbac.dependencies import RequirePermissions
from app.shared.rbac.permissions import PermissionEnum


@router.patch(
    "/{id}/reopen",
    response_model=InquiryResponse,
    dependencies=[Depends(RequirePermissions([PermissionEnum.REOPEN_INQUIRY]))],
)
async def reopen_inquiry(
    id: UUID,
    current_user: User = Depends(get_current_active_user),
    service: InquiryService = Depends(get_inquiry_service),
):
    return await service.reopen_inquiry(id, current_user, check_ownership=False)


@router.delete(
    "/{id}",
    status_code=204,
    dependencies=[Depends(RequirePermissions([PermissionEnum.DELETE_INQUIRY]))],
)
async def delete_inquiry(
    id: UUID,
    current_user: User = Depends(get_current_active_user),
    service: InquiryService = Depends(get_inquiry_service),
):
    await service.delete_inquiry(id, current_user, check_ownership=False)
