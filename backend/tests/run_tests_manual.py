import asyncio
import uuid
import httpx

# URL of the running API in docker
BASE_URL = "http://localhost:8000"


async def test_mass_assignment_regression():
    async with httpx.AsyncClient(base_url=BASE_URL) as client:
        # 1. User Reg
        email = f"user_{uuid.uuid4()}@test.com"
        pwd = "password123"
        data = {
            "email": email,
            "password": pwd,
            "full_name": "Test Reg",
            "role": "admin",
            "mfa_enabled": True,
            "is_active": False,
        }
        r = await client.post("/api/v1/auth/register/user", json=data)
        assert r.status_code in (200, 201), f"User reg failed: {r.status_code} {r.text}"
        user = r.json()
        assert user["role"] == "user"
        assert user["mfa_enabled"] is False

        # 2. Dealer Reg
        email_d = f"dealer_{uuid.uuid4()}@test.com"
        data_d = {
            "email": email_d,
            "password": pwd,
            "full_name": "Test Dealer",
            "dealership_name": "Dealer",
            "dealership_address": "Address",
            "role": "admin",
            "rating": 5.0,
        }
        r2 = await client.post("/api/v1/auth/register/dealer", json=data_d)
        assert r2.status_code in (
            200,
            201,
        ), f"Dealer reg failed: {r2.status_code} {r2.text}"
        dealer = r2.json()
        assert dealer["role"] == "dealer"

        print("✅ Mass assignment regression passed")


async def test_car_mass_assignment():
    async with httpx.AsyncClient(base_url=BASE_URL) as client:
        # Create dealer
        email = f"dealer_{uuid.uuid4()}@test.com"
        pwd = "password123"
        r = await client.post(
            "/api/v1/auth/register/dealer",
            json={
                "email": email,
                "password": pwd,
                "full_name": "Test Dealer",
                "dealership_name": "Dealer",
                "dealership_address": "Address",
            },
        )
        assert r.status_code in (200, 201)

        # Login
        r_log = await client.post(
            "/api/v1/auth/login", json={"email": email, "password": pwd}
        )
        assert (
            r_log.status_code == 200
        ), f"Login failed: {r_log.status_code} {r_log.text}"
        token = r_log.json()["access_token"]

        # Create car
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

        r_car = await client.post(
            "/api/v1/cars", json=car_data, headers={"Authorization": f"Bearer {token}"}
        )
        assert r_car.status_code in (
            200,
            201,
        ), f"Car creation failed: {r_car.status_code} {r_car.text}"
        car = r_car.json()
        assert car.get("quality_grade") is None
        assert car.get("status") == "pending"

        print("✅ Car mass assignment passed")


async def test_mfa_backup_codes():
    async with httpx.AsyncClient(base_url=BASE_URL) as client:
        # Create user
        email = f"user_{uuid.uuid4()}@test.com"
        pwd = "password123"
        r = await client.post(
            "/api/v1/auth/register/user",
            json={"email": email, "password": pwd, "full_name": "Test User"},
        )
        assert r.status_code in (200, 201)

        # Login
        r_log = await client.post(
            "/api/v1/auth/login", json={"email": email, "password": pwd}
        )
        assert (
            r_log.status_code == 200
        ), f"Login failed: {r_log.status_code} {r_log.text}"
        token = r_log.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # Enroll MFA
        r_enroll = await client.post("/api/v1/auth/mfa/enroll", headers=headers)
        assert r_enroll.status_code == 200, r_enroll.text
        data = r_enroll.json()
        secret = data["secret"]
        backup_codes = data["backup_codes"]
        assert len(backup_codes) == 10

        # Verify MFA
        import pyotp

        totp = pyotp.TOTP(secret)
        code = totp.now()
        r_verify = await client.post(
            "/api/v1/auth/mfa/verify", json={"code": code}, headers=headers
        )
        assert r_verify.status_code == 200, r_verify.text

        # Login again - should require MFA
        r_log2 = await client.post(
            "/api/v1/auth/login", json={"email": email, "password": pwd}
        )
        assert r_log2.status_code == 401, r_log2.text
        assert r_log2.json()["detail"] == "MFA code required"

        # Recover
        r_rec = await client.post(
            "/api/v1/auth/mfa/recovery",
            json={"email": email, "recovery_code": backup_codes[0]},
        )
        assert r_rec.status_code == 200, r_rec.text

        # Login again - should succeed
        r_log3 = await client.post(
            "/api/v1/auth/login", json={"email": email, "password": pwd}
        )
        assert r_log3.status_code == 200, r_log3.text
        assert "access_token" in r_log3.json()

        print("✅ MFA Backup codes passed")


async def main():
    await test_mass_assignment_regression()
    await test_car_mass_assignment()
    await test_mfa_backup_codes()


if __name__ == "__main__":
    asyncio.run(main())
