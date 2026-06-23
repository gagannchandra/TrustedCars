import asyncio
import uuid
import sys
from datetime import datetime, timezone
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import select

import os
sys.path.append(os.path.join(os.path.dirname(__file__), ".."))

from app.core.config import settings
from app.modules.auth.models import User, RoleEnum
from app.modules.cars.models import Car, CarStatusEnum, FuelTypeEnum, TransmissionEnum, BodyTypeEnum
from app.core.models import DeletedReason

async def verify_restore_safety():
    engine = create_async_engine(settings.DATABASE_URL)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    async with async_session() as session:
        print("Creating test user...")
        user = User(
            email=f"test_restore_{uuid.uuid4()}@trustedcarz.com",
            hashed_password="fakehash",
            full_name="Test Dealer",
            role=RoleEnum.dealer
        )
        session.add(user)
        await session.flush()
        
        user_id = user.id
        print(f"Created user: {user_id}")
        
        print("Creating 10 active cars...")
        for i in range(10):
            car = Car(
                user_id=user_id,
                make="Toyota",
                model="Camry",
                year=2020,
                fuel_type=FuelTypeEnum.petrol,
                transmission=TransmissionEnum.automatic,
                body_type=BodyTypeEnum.sedan,
                odometer_km=10000,
                asking_price=20000.00,
                city="Test City",
                state="Test State",
                status=CarStatusEnum.active
            )
            session.add(car)
            
        print("Creating 5 manually deleted cars (USER_REQUEST)...")
        for i in range(5):
            car = Car(
                user_id=user_id,
                make="Honda",
                model="Civic",
                year=2019,
                fuel_type=FuelTypeEnum.petrol,
                transmission=TransmissionEnum.automatic,
                body_type=BodyTypeEnum.sedan,
                odometer_km=20000,
                asking_price=15000.00,
                city="Test City",
                state="Test State",
                status=CarStatusEnum.active,
                deleted_at=datetime.now(timezone.utc),
                deleted_reason=DeletedReason.user_request,
                deleted_by=user_id
            )
            session.add(car)
            
        await session.commit()
        
        print("Simulating User Suspension (soft delete)...")
        # In actual flow, this happens via Event processing.
        # But we will do it directly for the test.
        # The outbox event would set deleted_at and deleted_reason=POLICY_VIOLATION for all ACTIVE cars.
        
        result = await session.execute(select(Car).where(Car.user_id == user_id, Car.deleted_at == None))
        active_cars = result.scalars().all()
        for car in active_cars:
            car.deleted_at = datetime.now(timezone.utc)
            car.deleted_reason = DeletedReason.policy_violation
            # admin id
            car.deleted_by = uuid.uuid4()
            
        await session.commit()
        
        print("Simulating User Restoration...")
        # The restoration should ONLY restore cars where deleted_reason == POLICY_VIOLATION
        
        result = await session.execute(select(Car).where(Car.user_id == user_id, Car.deleted_reason == DeletedReason.policy_violation))
        suspended_cars = result.scalars().all()
        restored_count = 0
        for car in suspended_cars:
            car.deleted_at = None
            car.deleted_reason = None
            car.deleted_by = None
            restored_count += 1
            
        await session.commit()
        
        print(f"Restored {restored_count} cars.")
        
        # Verify
        result = await session.execute(select(Car).where(Car.user_id == user_id, Car.deleted_at == None))
        final_active = len(result.scalars().all())
        
        result = await session.execute(select(Car).where(Car.user_id == user_id, Car.deleted_at != None))
        final_deleted = len(result.scalars().all())
        
        print(f"Final active cars: {final_active} (Expected: 10)")
        print(f"Final deleted cars: {final_deleted} (Expected: 5)")
        
        if final_active == 10 and final_deleted == 5:
            print("RESTORE SAFETY TEST: PASSED")
        else:
            print("RESTORE SAFETY TEST: FAILED")

if __name__ == "__main__":
    asyncio.run(verify_restore_safety())
