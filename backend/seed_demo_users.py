import asyncio
import os
import sys

# Ensure backend root is in PYTHONPATH
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import select
from app.db.session import AsyncSessionLocal
from app.modules.auth.models import User
from app.core.security import get_password_hash
from app.shared.rbac.roles import RoleEnum

async def seed_users():
    users_to_create = [
        {"email": "admin@trustedcarz.in", "password": "Admin@123", "role": RoleEnum.admin, "full_name": "Admin User"},
        {"email": "rahul.sharma@gmail.com", "password": "User@123", "role": RoleEnum.user, "full_name": "Rahul Sharma"},
        {"email": "sneha.kapoor@gmail.com", "password": "User@123", "role": RoleEnum.user, "full_name": "Sneha Kapoor"},
        {"email": "dealer@trustedcarz.in", "password": "Dealer@123", "role": RoleEnum.dealer, "full_name": "Demo Dealer"}
    ]
    
    async with AsyncSessionLocal() as session:
        for user_data in users_to_create:
            result = await session.execute(select(User).where(User.email == user_data["email"]))
            existing_user = result.scalars().first()
            if not existing_user:
                new_user = User(
                    email=user_data["email"],
                    hashed_password=get_password_hash(user_data["password"]),
                    full_name=user_data["full_name"],
                    role=user_data["role"],
                    is_active=True
                )
                session.add(new_user)
                print(f"Created user: {user_data['email']}")
            else:
                print(f"User already exists: {user_data['email']}")
        
        await session.commit()
        print("Demo users seeded successfully.")

if __name__ == "__main__":
    asyncio.run(seed_users())
