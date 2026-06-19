from pydantic import BaseModel
from typing import Optional


class SuspendUserRequest(BaseModel):
    reason: str


class ModerateDealerRequest(BaseModel):
    reason: str


class ModerateCarRequest(BaseModel):
    reason: str


class RestoreRequest(BaseModel):
    reason: Optional[str] = None
