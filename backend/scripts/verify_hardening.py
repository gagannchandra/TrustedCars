import asyncio
import uuid
import sys
from datetime import datetime

from app.modules.auth.models import User
from app.shared.rbac.roles import RoleEnum
from app.shared.rbac.hierarchy import can_moderate
from app.shared.schemas.validators import ReasonRequest
from pydantic import ValidationError

def test_admin_self_protection():
    admin = User(id=uuid.uuid4(), role=RoleEnum.admin)
    assert not can_moderate(admin, admin), "Self-protection failed"
    print("✅ Admin self-protection passed")

def test_admin_hierarchy():
    superadmin = User(id=uuid.uuid4(), role=RoleEnum.superadmin)
    admin = User(id=uuid.uuid4(), role=RoleEnum.admin)
    moderator = User(id=uuid.uuid4(), role=RoleEnum.content_moderator)
    support = User(id=uuid.uuid4(), role=RoleEnum.support_agent)
    user = User(id=uuid.uuid4(), role=RoleEnum.user)

    assert can_moderate(superadmin, admin)
    assert not can_moderate(admin, superadmin)
    assert not can_moderate(support, moderator)
    assert can_moderate(moderator, user)
    print("✅ Admin hierarchy passed")

def test_reason_validation():
    try:
        ReasonRequest(reason="   test test test   ")
        assert False, "Should fail on low entropy"
    except ValidationError:
        pass
        
    try:
        ReasonRequest(reason="aaaaaaaaaa")
        assert False, "Should fail on repetition"
    except ValidationError:
        pass
        
    try:
        ReasonRequest(reason="This is a valid moderation reason.")
    except ValidationError as e:
        assert False, f"Should succeed on valid string, got {e}"
        
    print("✅ Reason validation passed")

def test_outbox_event():
    from app.core.models import OutboxEvent
    evt = OutboxEvent(event_type="TEST", payload="{}", idempotency_key="unique_key_123")
    assert evt.idempotency_key == "unique_key_123"
    print("✅ Outbox idempotency model passed")

async def main():
    test_admin_self_protection()
    test_admin_hierarchy()
    test_reason_validation()
    test_outbox_event()
    print("All internal hardening logic verified successfully!")

if __name__ == "__main__":
    asyncio.run(main())
