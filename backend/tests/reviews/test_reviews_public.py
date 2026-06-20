import pytest
from httpx import AsyncClient
import uuid

@pytest.fixture
async def reviewer_token(async_client: AsyncClient):
    email = f"reviewer_{uuid.uuid4()}@example.com"
    await async_client.post(
        "/api/v1/auth/register",
        json={
            "email": email,
            "password": "StrongPassword123!",
            "full_name": "Test Reviewer",
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
async def test_public_review_flows(async_client: AsyncClient, reviewer_token: str):
    # Attempt to fetch seller reviews (using arbitrary UUID)
    random_seller_id = str(uuid.uuid4())
    search_response = await async_client.get(f"/api/v1/reviews/sellers/{random_seller_id}")
    assert search_response.status_code == 200
    assert "items" in search_response.json()
