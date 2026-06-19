import uuid
from app.modules.auth.models import User, RoleEnum
from app.shared.rbac.hierarchy import can_moderate


def test_dealer_restore_safety():
    admin = User(id=uuid.uuid4(), role=RoleEnum.admin)
    dealer = User(id=uuid.uuid4(), role=RoleEnum.dealer)

    assert can_moderate(admin, dealer)
