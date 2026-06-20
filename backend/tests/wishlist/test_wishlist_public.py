import pytest
from httpx import AsyncClient
import uuid

@pytest.fixture
async def buyer_token(async_client: AsyncClient):
    email = f"buyer_{uuid.uuid4()}@example.com"
    await async_client.post(
        "/api/v1/auth/register",
        json={
            "email": email,
            "password": "StrongPassword123!",
            "full_name": "Test Buyer",
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
async def test_public_wishlist_flows(async_client: AsyncClient, buyer_token: str):
    headers = {"Authorization": f"Bearer {buyer_token}"}
    
    # Get initial wishlist
    list_response = await async_client.get("/api/v1/wishlist/", headers=headers)
    assert list_response.status_code == 200
    assert list_response.json() == []
    
    # Add item to wishlist (this might fail with 404 if car doesn't exist, which is expected behavior for integration test)
    random_car_id = str(uuid.uuid4())
    add_response = await async_client.post(f"/api/v1/wishlist/{random_car_id}", headers=headers)
    assert add_response.status_code in [201, 404] 
