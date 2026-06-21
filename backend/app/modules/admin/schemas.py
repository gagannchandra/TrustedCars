from pydantic import BaseModel, ConfigDict
from typing import Optional


class SettingsResponse(BaseModel):
    platform_fee: float
    auto_approve: bool


class UpdateSettingsRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")
    platform_fee: Optional[float] = None
    auto_approve: Optional[bool] = None
    reason: str


class SuspendUserRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")
    reason: str


class ModerateDealerRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")
    reason: str


class ModerateCarRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")
    reason: str


class RestoreRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")
    reason: Optional[str] = None
