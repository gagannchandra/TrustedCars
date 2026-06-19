import pytest
import uuid
from app.modules.auth.models import User, RoleEnum, Dealership


@pytest.mark.asyncio
async def test_suspend_dealer_hierarchy_protection(
    async_client, admin_token_headers, setup_db
):
    super_admin = User(
        email=f"super_{uuid.uuid4()}@test.com",
        hashed_password="pw",
        full_name="SuperAdmin",
        role=RoleEnum.admin,
    )
    setup_db.add(super_admin)
    await setup_db.commit()

    dealer = Dealership(user_id=super_admin.id, name="Super Dealer", address="123")
    setup_db.add(dealer)
    await setup_db.commit()

    res = await async_client.post(
        f"/api/v1/admin/dealers/{dealer.id}/suspend",
        json={"reason": "test"},
        headers=admin_token_headers,
    )
    assert res.status_code == 403
    assert "hierarchy" in res.json()["detail"].lower()


@pytest.mark.asyncio
async def test_delete_dealer_hierarchy_protection(
    async_client, admin_token_headers, setup_db
):
    super_admin = User(
        email=f"super_{uuid.uuid4()}@test.com",
        hashed_password="pw",
        full_name="SuperAdmin",
        role=RoleEnum.admin,
    )
    setup_db.add(super_admin)
    await setup_db.commit()

    dealer = Dealership(user_id=super_admin.id, name="Super Dealer", address="123")
    setup_db.add(dealer)
    await setup_db.commit()

    res = await async_client.delete(
        f"/api/v1/admin/dealers/{dealer.id}", headers=admin_token_headers
    )
    assert res.status_code == 403
    assert "hierarchy" in res.json()["detail"].lower()
