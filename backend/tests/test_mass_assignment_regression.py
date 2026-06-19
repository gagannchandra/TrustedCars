import pytest
from httpx import AsyncClient, ASGITransport
import uuid
from app.main import app


@pytest.mark.asyncio
async def test_user_registration_mass_assignment():
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as ac:
        email = f"user_{uuid.uuid4()}@test.com"
        # Try to inject admin role and mfa_enabled during registration
        data = {
            "email": email,
            "password": "password123",
            "full_name": "Test Reg",
            "role": "admin",  # Malicious
            "mfa_enabled": True,  # Malicious
            "is_active": False,  # Malicious
        }
        resp = await ac.post("/api/v1/auth/register/user", json=data)

        # Should be 422 because we explicitly forbid extra fields
        assert resp.status_code == 422


@pytest.mark.asyncio
async def test_dealer_registration_mass_assignment():
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as ac:
        email = f"dealer_{uuid.uuid4()}@test.com"
        data = {
            "email": email,
            "password": "password123",
            "full_name": "Test Reg",
            "dealership_name": "Test Dealer",
            "dealership_address": "Test Address",
            "role": "admin",  # Malicious
            "rating": 5.0,  # Malicious
        }
        resp = await ac.post("/api/v1/auth/register/dealer", json=data)

        assert resp.status_code == 422
