import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
import uuid
from app.main import app


@pytest_asyncio.fixture
async def dealer_token():
    email = f"dealer_{uuid.uuid4()}@test.com"
    pwd = "password123"

    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as ac:
        # Create dealer
        reg_data = {
            "email": email,
            "password": pwd,
            "full_name": "Test Dealer",
            "dealership_name": "Dealer",
            "dealership_address": "Address",
        }
        await ac.post("/api/v1/auth/register/dealer", json=reg_data)

        response = await ac.post(
            "/api/v1/auth/login", json={"email": email, "password": pwd}
        )
        return response.json()["access_token"]


@pytest.mark.asyncio
async def test_car_creation_mass_assignment(dealer_token):
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as ac:
        headers = {"Authorization": f"Bearer {dealer_token}"}

        car_data = {
            "make": "Toyota",
            "model": "Camry",
            "year": 2022,
            "fuel_type": "petrol",
            "transmission": "automatic",
            "body_type": "sedan",
            "odometer_km": 15000,
            "ownership_count": 1,
            "asking_price": 25000.0,
            "city": "Austin",
            "state": "TX",
            "description": "Clean car",
            # MALICIOUS INJECTIONS
            "quality_grade": "A+",
            "status": "active",
            "moderation_status": "active",
            "moderation_reason": "bypassed",
            "previous_moderation_status": "bypassed",
            "is_featured": True,
            "approved_by": str(uuid.uuid4()),
            "approved_at": "2026-01-01T00:00:00Z",
        }

        response = await ac.post("/api/v1/cars", json=car_data, headers=headers)

        # Pydantic should explicitly reject the request due to extra="forbid"
        assert response.status_code == 422
