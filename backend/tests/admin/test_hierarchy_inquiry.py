import pytest
import uuid
from app.modules.auth.models import User, RoleEnum
from app.modules.inquiries.models import Inquiry


@pytest.mark.asyncio
async def test_close_inquiry_hierarchy_protection(
    async_client, admin_token_headers, setup_db
):
    super_admin = User(
        email=f"super_{uuid.uuid4()}@test.com",
        hashed_password="pw",
        full_name="SuperAdmin",
        role=RoleEnum.admin,
    )
    target = User(
        email=f"target_{uuid.uuid4()}@test.com",
        hashed_password="pw",
        full_name="Target",
        role=RoleEnum.user,
    )
    setup_db.add_all([super_admin, target])
    await setup_db.commit()

    inquiry = Inquiry(car_id=uuid.uuid4(), buyer_id=super_admin.id, seller_id=target.id)
    setup_db.add(inquiry)
    await setup_db.commit()

    res = await async_client.post(
        f"/api/v1/admin/inquiries/{inquiry.id}/close", headers=admin_token_headers
    )
    assert res.status_code == 403
    assert "hierarchy" in res.json()["detail"].lower()
