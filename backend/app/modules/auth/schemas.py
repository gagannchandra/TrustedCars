from pydantic import BaseModel, EmailStr, Field, ConfigDict
from typing import Optional
from uuid import UUID
from datetime import datetime
from app.modules.auth.models import RoleEnum


class RegisterUserRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=128)
    full_name: str = Field(..., min_length=2, max_length=255)


class RegisterDealerRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=128)
    full_name: str = Field(..., min_length=2, max_length=255)
    dealership_name: str = Field(..., min_length=2, max_length=255)
    dealership_address: str = Field(..., min_length=5, max_length=500)


class LoginRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")
    email: EmailStr
    password: str
    mfa_code: Optional[str] = None


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class UserResponse(BaseModel):
    id: UUID
    email: EmailStr
    full_name: str
    role: RoleEnum
    is_active: bool
    created_at: datetime
    mfa_enabled: bool = False

    model_config = {"from_attributes": True}


class MFAEnrollResponse(BaseModel):
    secret: str
    provisioning_uri: str
    backup_codes: list[str]


class MFAVerifyRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")
    code: str


class MFARecoveryRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")
    email: EmailStr
    recovery_code: str
