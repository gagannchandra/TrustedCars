import os
os.environ["TESTING"] = "1"
os.environ["PYTHONASYNCIODEBUG"] = "1"

import pytest_asyncio
import uuid
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker
from app.main import app
from app.core.config import settings
from app.modules.auth.models import User, RoleEnum
from app.core.security import create_access_token

# Removed custom event_loop fixture to let pytest-asyncio manage loops

from sqlalchemy.exc import InterfaceError

@pytest_asyncio.fixture(scope="function")
async def setup_db():
    test_engine = create_async_engine(settings.DATABASE_URL, echo=False)
    TestingSessionLocal = async_sessionmaker(
        autocommit=False, autoflush=False, expire_on_commit=False, bind=test_engine
    )
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        try:
            await session.close()
        except InterfaceError:
            pass
        await test_engine.dispose()

@pytest_asyncio.fixture(scope="function")
async def setup_app_db():
    test_engine = create_async_engine(settings.DATABASE_URL, echo=False)
    TestingSessionLocal = async_sessionmaker(
        autocommit=False, autoflush=False, expire_on_commit=False, bind=test_engine
    )
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        try:
            await session.close()
        except InterfaceError:
            pass
        await test_engine.dispose()

from app.db.session import get_db

@pytest_asyncio.fixture(scope="function")
async def async_client(setup_db, setup_app_db):
    app.dependency_overrides[get_db] = lambda: setup_app_db
    transport = ASGITransport(app=app)
    try:
        async with AsyncClient(transport=transport, base_url="http://test") as ac:
            yield ac
    finally:
        app.dependency_overrides.clear()


@pytest_asyncio.fixture
async def admin_user(setup_db):
    print("ADMIN_USER START")
    user = User(
        email=f"admin_{uuid.uuid4()}@test.com",
        hashed_password="pw",
        full_name="Admin",
        role=RoleEnum.admin,
        is_active=True,
        mfa_enabled=True,
    )
    setup_db.add(user)
    print("ADMIN_USER BEFORE FLUSH")
    await setup_db.commit()
    print("ADMIN_USER AFTER FLUSH")
    return user


@pytest_asyncio.fixture
async def admin_token_headers(admin_user):
    token = create_access_token(subject=admin_user.id)
    return {"Authorization": f"Bearer {token}"}


@pytest_asyncio.fixture
async def moderator_user(setup_db):
    user = User(
        email=f"mod_{uuid.uuid4()}@test.com",
        hashed_password="hashed_password",
        full_name="Moderator User",
        role=RoleEnum.content_moderator,
        is_active=True,
        mfa_enabled=True,
    )
    setup_db.add(user)
    await setup_db.commit()
    return user


@pytest_asyncio.fixture
async def support_user(setup_db):
    user = User(
        email=f"sup_{uuid.uuid4()}@test.com",
        hashed_password="hashed_password",
        full_name="Support User",
        role=RoleEnum.support_agent,
        is_active=True,
        mfa_enabled=True,
    )
    setup_db.add(user)
    await setup_db.flush()
    return user

@pytest_asyncio.fixture(scope="session", autouse=True)
async def cleanup_redis():
    yield
    from app.db.redis import redis_client
    await redis_client.close()

