from pydantic import BaseModel, ConfigDict, EmailStr, HttpUrl, Field
from typing import Optional
from uuid import UUID
from datetime import datetime
from app.modules.auth.models import RoleEnum


class UserProfileUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")
    full_name: Optional[str] = Field(None, min_length=2, max_length=255)
    email: Optional[EmailStr] = None
    phone_number: Optional[str] = Field(None, pattern=r"^\+?[1-9]\d{1,14}$")
    avatar_url: Optional[HttpUrl] = None


class UserPublicProfile(BaseModel):
    id: UUID
    full_name: str
    avatar_url: Optional[str] = None
    role: RoleEnum
    created_at: datetime
    model_config = {"from_attributes": True}


class DealershipPublic(BaseModel):
    id: UUID
    name: str
    address: str
    phone_number: Optional[str] = None
    user: Optional[UserPublicProfile] = None
    model_config = {"from_attributes": True}


class UserPrivateProfile(UserPublicProfile):
    email: EmailStr
    phone_number: Optional[str] = None
    is_active: bool
    dealership: Optional[DealershipPublic] = None
