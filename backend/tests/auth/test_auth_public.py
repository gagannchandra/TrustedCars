import pytest
from httpx import AsyncClient
import uuid

@pytest.mark.asyncio
async def test_public_registration_and_login(async_client: AsyncClient):
    # Register
    email = f"user_{uuid.uuid4()}@example.com"
    register_response = await async_client.post(
        "/api/v1/auth/register",
        json={
            "email": email,
            "password": "StrongPassword123!",
            "full_name": "Test User",
            "role": "private_seller"
        }
    )
    assert register_response.status_code == 201
    
    # Login
    login_response = await async_client.post(
        "/api/v1/auth/login",
        data={
            "username": email,
            "password": "StrongPassword123!"
        },
        headers={"Content-Type": "application/x-www-form-urlencoded"}
    )
    assert login_response.status_code == 200
    data = login_response.json()
    assert "access_token" in data
    
    # Get me
    token = data["access_token"]
    me_response = await async_client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert me_response.status_code == 200
    me_data = me_response.json()
    assert me_data["email"] == email
    assert me_data["role"] == "private_seller"
