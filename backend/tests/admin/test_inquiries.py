import pytest
import uuid
from app.modules.auth.models import User
from app.modules.inquiries.models import Inquiry, InquiryStatusEnum


@pytest.mark.asyncio
async def test_inquiry_moderation(async_client, admin_token_headers, setup_db):
    b_user = User(
        email=f"b_{uuid.uuid4()}@test.com", hashed_password="pw", full_name="B"
    )
    s_user = User(
        email=f"s_{uuid.uuid4()}@test.com", hashed_password="pw", full_name="S"
    )
    setup_db.add_all([b_user, s_user])
    await setup_db.flush()

    inquiry = Inquiry(
        car_id=uuid.uuid4(),
        buyer_id=b_user.id,
        seller_id=s_user.id,
        status=InquiryStatusEnum.open,
    )
    setup_db.add(inquiry)
    await setup_db.commit()

    res = await async_client.post(
        f"/api/v1/admin/inquiries/{inquiry.id}/archive", headers=admin_token_headers
    )
    assert res.status_code == 200

    await setup_db.refresh(inquiry)
    assert inquiry.status == InquiryStatusEnum.archived
    assert inquiry.previous_status == InquiryStatusEnum.open
