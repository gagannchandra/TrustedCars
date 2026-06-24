from datetime import datetime, timedelta, timezone
from passlib.context import CryptContext  # type: ignore
import jwt  # type: ignore
from typing import Any, Union
from app.core.config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def verify_password(plain_password: str, hashed_password: str) -> tuple[bool, bool]:
    import hashlib
    # Check if this is a pre-hashed password (needs migration)
    try:
        pre_hashed = hashlib.sha256(plain_password.encode()).hexdigest()
        if pwd_context.verify(pre_hashed, hashed_password):
            return True, True
    except Exception:
        pass
        
    try:
        if pwd_context.verify(plain_password, hashed_password):
            return True, False
    except Exception:
        pass
        
    return False, False


def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)


def create_access_token(
    subject: Union[str, Any], expires_delta: timedelta | None = None
) -> str:
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(
            minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
        )

    import uuid

    now = datetime.now(timezone.utc)
    to_encode = {
        "exp": expire,
        "iat": now,  # Issued at timestamp
        "sub": str(subject),
        "type": "access",
        "jti": str(uuid.uuid4()),
    }
    encoded_jwt = jwt.encode(
        to_encode, settings.JWT_SECRET_KEY, algorithm=settings.ALGORITHM
    )
    return encoded_jwt


def create_refresh_token(
    subject: Union[str, Any], expires_delta: timedelta | None = None
) -> str:
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(
            days=settings.REFRESH_TOKEN_EXPIRE_DAYS
        )

    import uuid

    now = datetime.now(timezone.utc)
    to_encode = {
        "exp": expire,
        "iat": now,  # Issued at timestamp
        "sub": str(subject),
        "type": "refresh",
        "jti": str(uuid.uuid4()),
    }
    encoded_jwt = jwt.encode(
        to_encode, settings.JWT_SECRET_KEY, algorithm=settings.ALGORITHM
    )
    return encoded_jwt
