import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_audit_log_keyset_pagination(
    async_client: AsyncClient, admin_token_headers: dict, setup_db
):

    # Check that endpoint returns 200
    res = await async_client.get(
        "/api/v1/admin/audit-logs?limit=5", headers=admin_token_headers
    )
    print("RESPONSE:", res.status_code, res.text)
    assert res.status_code == 200

    data = res.json()
    assert "items" in data
    assert "has_more" in data
