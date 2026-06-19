import uuid
from app.shared.rbac.hierarchy import can_moderate
from app.modules.auth.models import User
from app.shared.rbac.roles import RoleEnum


def test_admin_self_protection():
    admin = User(id=uuid.uuid4(), role=RoleEnum.admin)
    assert not can_moderate(admin, admin)


def test_hierarchy_protections():
    superadmin = User(id=uuid.uuid4(), role=RoleEnum.superadmin)
    admin = User(id=uuid.uuid4(), role=RoleEnum.admin)
    moderator = User(id=uuid.uuid4(), role=RoleEnum.content_moderator)
    support = User(id=uuid.uuid4(), role=RoleEnum.support_agent)
    user = User(id=uuid.uuid4(), role=RoleEnum.user)

    # Superadmin can moderate anyone
    assert can_moderate(superadmin, admin)
    assert can_moderate(superadmin, moderator)
    assert can_moderate(superadmin, user)

    # Admin can moderate lower but not superadmin or self
    assert not can_moderate(admin, superadmin)
    assert not can_moderate(admin, admin)
    assert can_moderate(admin, moderator)
    assert can_moderate(admin, user)

    # Support cannot moderate admin or superadmin
    assert not can_moderate(support, admin)
    assert not can_moderate(support, superadmin)
    assert not can_moderate(support, moderator)
    assert can_moderate(support, user)
