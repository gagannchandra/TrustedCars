import uuid
from app.shared.rbac.hierarchy import can_moderate
from app.modules.auth.models import User
from app.shared.rbac.roles import RoleEnum


def test_admin_self_protection():
    admin = User(id=uuid.uuid4(), role=RoleEnum.admin)
    assert not can_moderate(admin, admin)
