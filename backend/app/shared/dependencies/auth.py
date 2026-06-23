from fastapi import Depends, HTTPException, Request
import jwt
from jwt import InvalidTokenError
from app.core.config import settings
from app.shared.exceptions.handlers import CustomException
from app.modules.auth.repository import AuthRepository
from app.db.session import get_db
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID
from app.modules.auth.models import User

async def get_current_user_id(
    request: Request,
    db: AsyncSession = Depends(get_db),
) -> str:
    token = request.cookies.get("access_token")
    if not token:
        raise CustomException(401, "Not authenticated")
    try:
        payload = jwt.decode(
            token, settings.JWT_SECRET_KEY, algorithms=[settings.ALGORITHM]
        )
        if payload.get("type") != "access":
            raise CustomException(401, "Invalid token type")

        user_id_val = payload.get("sub")
        if user_id_val is None:
            raise CustomException(401, "Could not validate credentials")
        user_id = str(user_id_val)

        from app.db.redis import get_redis

        redis_client = await get_redis()
        is_suspended = False
        try:
            is_suspended = await redis_client.get(f"suspended:user:{user_id}")
        except Exception as e:
            # Redis is down, fallback to DB
            import logging

            logging.getLogger(__name__).error(
                f"Redis fallback triggered for user {user_id}: {e}"
            )
            repo = AuthRepository(db)
            user = await repo.get_user_by_id(UUID(user_id))
            if user and (user.deleted_at is not None or user.is_suspended):
                is_suspended = True

        if is_suspended:
            raise HTTPException(status_code=403, detail="Account suspended")

        request.state.user_id = user_id
        from app.core.context import user_id_ctx
        user_id_ctx.set(user_id)
        
        return user_id
    except InvalidTokenError:
        raise CustomException(401, "Could not validate credentials")


async def get_current_active_user(
    user_id: str = Depends(get_current_user_id), db: AsyncSession = Depends(get_db)
) -> User:
    repo = AuthRepository(db)
    user = await repo.get_user_by_id(UUID(user_id))
    if not user or not user.is_active or user.deleted_at is not None or user.is_suspended:
        raise CustomException(401, "User is inactive, deleted, or suspended")
    return user


get_current_user = get_current_active_user


async def get_current_user_optional(
    request: Request,
    db: AsyncSession = Depends(get_db),
) -> User | None:
    """
    Non-throwing auth dependency. Returns the authenticated User if a valid
    access_token cookie is present, otherwise returns None.
    Used for endpoints that are public but show extra data to logged-in users
    (e.g., car detail page showing edit controls to the owner).
    """
    token = request.cookies.get("access_token")
    if not token:
        return None
    try:
        payload = jwt.decode(
            token, settings.JWT_SECRET_KEY, algorithms=[settings.ALGORITHM]
        )
        if payload.get("type") != "access":
            return None
        user_id = payload.get("sub")
        if not user_id:
            return None
        repo = AuthRepository(db)
        user = await repo.get_user_by_id(UUID(str(user_id)))
        if user and user.is_active and user.deleted_at is None and not user.is_suspended:
            return user
        return None
    except (InvalidTokenError, Exception):
        return None



from typing import List, Callable


def require_roles(allowed_roles: List[str]) -> Callable:
    """
    Dependency factory that returns a FastAPI dependency
    requiring the current user to have one of the specified roles.
    
    Usage:
        @router.get("/admin-only", dependencies=[Depends(require_roles(["admin"]))])
        async def admin_endpoint():
            ...
    """
    async def role_checker(
        current_user: User = Depends(get_current_active_user),
    ) -> User:
        if current_user.role not in allowed_roles:
            raise CustomException(
                403,
                f"Access denied. Required roles: {', '.join(allowed_roles)}"
            )
        return current_user
    
    return role_checker
