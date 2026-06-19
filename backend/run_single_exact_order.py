import asyncio
import os
os.environ["TESTING"] = "1"
import uuid
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker
from app.modules.auth.models import User, RoleEnum
from app.core.config import settings
from httpx import AsyncClient, ASGITransport
from app.main import app

async def main():
    engine = create_async_engine(settings.DATABASE_URL, echo=False)
    Session = async_sessionmaker(engine, expire_on_commit=False)
    
    session = Session()
    try:
        # 1. admin_user
        user1 = User(
            email=f"admin_{uuid.uuid4()}@test.com",
            hashed_password="pw",
            full_name="Admin",
            role=RoleEnum.admin
        )
        session.add(user1)
        await session.flush()  # We changed it to flush
        
        # 2. async_client
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as ac:
            # 3. test body
            user2 = User(
                email=f"user_{uuid.uuid4()}@test.com",
                hashed_password="pw",
                full_name="User",
                role=RoleEnum.user
            )
            session.add(user2)
            try:
                await session.flush()
                print("FLUSH SUCCESS")
            except Exception as e:
                print("FLUSH EXCEPTION:", type(e))
                import traceback
                traceback.print_exc()
    finally:
        await session.close()

asyncio.run(main())
