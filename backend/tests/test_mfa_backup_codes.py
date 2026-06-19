import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
import uuid
from app.main import app


@pytest_asyncio.fixture
async def user_auth():
    email = f"user_{uuid.uuid4()}@test.com"
    pwd = "password123"

    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as ac:
        reg_data = {"email": email, "password": pwd, "full_name": "Test User"}
        await ac.post("/api/v1/auth/register/user", json=reg_data)

        response = await ac.post(
            "/api/v1/auth/login", json={"email": email, "password": pwd}
        )
        return {"email": email, "pwd": pwd, "token": response.json()["access_token"]}


async def test_mfa_backup_codes(user_auth):
    email = user_auth["email"]
    pwd = user_auth["pwd"]
    token = user_auth["token"]

    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as ac:
        # 1. Enroll MFA
        headers = {"Authorization": f"Bearer {token}"}
        enroll_resp = await ac.post("/api/v1/auth/mfa/enroll", headers=headers)
        assert enroll_resp.status_code == 200
        enroll_data = enroll_resp.json()

        backup_codes = enroll_data.get("backup_codes", [])
        assert len(backup_codes) == 10
        secret = enroll_data.get("secret")

        # 2. Verify MFA to fully enable
        import pyotp

        totp = pyotp.TOTP(secret)
        code = totp.now()

        verify_resp = await ac.post(
            "/api/v1/auth/mfa/verify", json={"code": code}, headers=headers
        )
        assert verify_resp.status_code == 200

        # 3. Test Login requiring MFA
        login_resp = await ac.post(
            "/api/v1/auth/login", json={"email": email, "password": pwd}
        )
        assert login_resp.status_code == 401
        assert login_resp.json()["detail"] == "MFA code required"

        # 4. Use Backup Code (Recovery)
        recovery_code = backup_codes[0]
        rec_resp = await ac.post(
            "/api/v1/auth/mfa/recovery",
            json={"email": email, "recovery_code": recovery_code},
        )
        assert rec_resp.status_code == 200

        # 5. Login after Recovery
        login_resp2 = await ac.post(
            "/api/v1/auth/login", json={"email": email, "password": pwd}
        )
        assert login_resp2.status_code == 200
        assert "access_token" in login_resp2.json()

        # 6. Reuse Backup Code
        rec_resp2 = await ac.post(
            "/api/v1/auth/mfa/recovery",
            json={"email": email, "recovery_code": recovery_code},
        )
        assert rec_resp2.status_code == 400
        assert "Invalid or already used recovery code" in rec_resp2.json()["detail"]

        # 7. Use invalid code
        rec_resp3 = await ac.post(
            "/api/v1/auth/mfa/recovery",
            json={"email": email, "recovery_code": "INVALID_CODE"},
        )
        assert rec_resp3.status_code == 400
