from pydantic import BaseModel, ConfigDict
from typing import Optional


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
