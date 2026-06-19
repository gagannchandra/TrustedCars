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
    engine = create_async_engine(settings.DATABASE_URL, echo=True)
    Session = async_sessionmaker(engine, expire_on_commit=False)
    
    async with Session() as session:
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as ac:
            user1 = User(
                email=f"admin_{uuid.uuid4()}@test.com",
                hashed_password="pw",
                full_name="Admin",
                role=RoleEnum.admin
            )
            session.add(user1)
            await session.commit()
            
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

asyncio.run(main())
