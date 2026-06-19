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
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header.split(" ")[1]
        else:
            raise CustomException(401, "Not authenticated")
    try:
        payload = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
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
            if user and user.deleted_at is not None:
                is_suspended = True

        if is_suspended:
            raise HTTPException(status_code=403, detail="Account suspended")

        return user_id
    except InvalidTokenError:
        raise CustomException(401, "Could not validate credentials")


async def get_current_active_user(
    user_id: str = Depends(get_current_user_id), db: AsyncSession = Depends(get_db)
) -> User:
    repo = AuthRepository(db)
    user = await repo.get_user_by_id(UUID(user_id))
    if not user or not user.is_active or user.deleted_at is not None:
        raise CustomException(401, "User is inactive or deleted")
    return user


get_current_user = get_current_active_user
