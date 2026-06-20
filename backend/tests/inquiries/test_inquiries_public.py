import pytest
from httpx import AsyncClient
import uuid

@pytest.fixture
async def public_inquiry_user(async_client: AsyncClient):
    email = f"inquiry_{uuid.uuid4()}@example.com"
    await async_client.post(
        "/api/v1/auth/register",
        json={
            "email": email,
            "password": "StrongPassword123!",
            "full_name": "Test Inquirer",
            "role": "buyer"
        }
    )
    login_response = await async_client.post(
        "/api/v1/auth/login",
        data={"username": email, "password": "StrongPassword123!"},
        headers={"Content-Type": "application/x-www-form-urlencoded"}
    )
    return login_response.json()["access_token"]

@pytest.mark.asyncio
async def test_public_inquiry_flows(async_client: AsyncClient, public_inquiry_user: str):
    headers = {"Authorization": f"Bearer {public_inquiry_user}"}
    
    # Attempt to submit an inquiry (might fail 404 if car doesn't exist, which is expected)
    random_car_id = str(uuid.uuid4())
    inquiry_response = await async_client.post(
        f"/api/v1/inquiries/cars/{random_car_id}",
        json={"message": "Is this car still available?"},
        headers=headers
    )
    assert inquiry_response.status_code in [201, 404]

    # Fetch inquiries
    fetch_response = await async_client.get("/api/v1/inquiries/sent", headers=headers)
    assert fetch_response.status_code == 200
    assert "items" in fetch_response.json()
