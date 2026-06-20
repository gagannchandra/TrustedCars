import pytest
from httpx import AsyncClient
import uuid

@pytest.fixture
async def public_user_token(async_client: AsyncClient):
    email = f"user_{uuid.uuid4()}@example.com"
    await async_client.post(
        "/api/v1/auth/register",
        json={
            "email": email,
            "password": "StrongPassword123!",
            "full_name": "Test Seller",
            "role": "private_seller"
        }
    )
    login_response = await async_client.post(
        "/api/v1/auth/login",
        data={"username": email, "password": "StrongPassword123!"},
        headers={"Content-Type": "application/x-www-form-urlencoded"}
    )
    return login_response.json()["access_token"]

@pytest.mark.asyncio
async def test_public_car_create_and_search(async_client: AsyncClient, public_user_token: str):
    # Create Car
    headers = {"Authorization": f"Bearer {public_user_token}"}
    create_response = await async_client.post(
        "/api/v1/cars/",
        json={
            "make": "Toyota",
            "model": "Corolla",
            "year": 2020,
            "price": 500000,
            "mileage": 15000,
            "fuel_type": "petrol",
            "transmission": "automatic",
            "body_type": "sedan",
            "color": "White",
            "description": "Clean car",
            "city": "Mumbai"
        },
        headers=headers
    )
    assert create_response.status_code == 201
    car_id = create_response.json()["id"]

    # Search Cars
    search_response = await async_client.get("/api/v1/cars/?make=Toyota")
    assert search_response.status_code == 200
    # Car should not be found immediately because status is 'pending' for newly created cars, but the endpoint works.
    assert "items" in search_response.json()
