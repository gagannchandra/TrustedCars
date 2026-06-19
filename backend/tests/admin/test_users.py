import pytest
import uuid
from app.modules.auth.models import User, RoleEnum
from app.core.models import OutboxEvent
from sqlalchemy import select


@pytest.mark.asyncio
async def test_suspend_user_unauthorized(async_client):
    res = await async_client.post(
        f"/api/v1/admin/users/{uuid.uuid4()}/suspend", json={"reason": "test"}
    )
    assert res.status_code in [401, 403]


@pytest.mark.asyncio
async def test_suspend_user_missing_mfa(async_client, setup_db):
    user = User(
        email=f"nomfa_{uuid.uuid4()}@test.com",
        hashed_password="pw",
        full_name="User",
        role=RoleEnum.admin,
        mfa_enabled=False,
    )
    setup_db.add(user)
    await setup_db.commit()

    from app.core.security import create_access_token

    token = create_access_token(user.id)
    res = await async_client.post(
        f"/api/v1/admin/users/{uuid.uuid4()}/suspend",
        json={"reason": "test"},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert res.status_code == 403
    assert "MFA is required" in res.json()["detail"]


@pytest.mark.asyncio
async def test_suspend_user_hierarchy_protection(
    async_client, admin_token_headers, setup_db
):
    other_admin = User(
        email=f"admin_{uuid.uuid4()}@test.com",
        hashed_password="pw",
        full_name="Admin",
        role=RoleEnum.admin,
    )
    setup_db.add(other_admin)
    await setup_db.commit()

    res = await async_client.post(
        f"/api/v1/admin/users/{other_admin.id}/suspend",
        json={"reason": "test"},
        headers=admin_token_headers,
    )
    assert res.status_code == 403
    assert "hierarchy" in res.json()["detail"]


@pytest.mark.asyncio
async def test_suspend_user_success(
    async_client, admin_token_headers, setup_db, admin_user
):
    target = User(
        email=f"target_{uuid.uuid4()}@test.com",
        hashed_password="pw",
        full_name="Target",
        role=RoleEnum.user,
    )
    setup_db.add(target)
    await setup_db.commit()

    res = await async_client.post(
        f"/api/v1/admin/users/{target.id}/suspend",
        json={"reason": "spamming"},
        headers=admin_token_headers,
    )
    assert res.status_code == 200

    await setup_db.refresh(target)
    assert target.is_suspended is True

    # Verify Audit
    from app.shared.audit.models import AuditLog

    stmt = select(AuditLog).where(
        AuditLog.target_id == target.id, AuditLog.action == "USER_SUSPENDED"
    )
    audit = (await setup_db.execute(stmt)).scalar_one_or_none()
    assert audit is not None
    assert audit.user_id == admin_user.id
    assert audit.reason == "spamming"

    # Verify Outbox
    stmt_ob = select(OutboxEvent).where(OutboxEvent.event_type == "USER_SUSPENDED")
    ob = (await setup_db.execute(stmt_ob)).scalars().all()
    assert len(ob) > 0
