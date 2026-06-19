from app.modules.auth.models import User
from app.shared.rbac.roles import RoleEnum

ROLE_PRIVILEGE_LEVELS = {
    RoleEnum.superadmin: 100,
    RoleEnum.admin: 80,
    RoleEnum.content_moderator: 60,
    RoleEnum.support_agent: 40,
    RoleEnum.user: 10,
    RoleEnum.dealer: 10,
}


def can_moderate(actor: User, target: User) -> bool:
    """
    Evaluates if the actor has sufficient hierarchical privileges to moderate the target.

    Rules:
    1. Administrators cannot moderate themselves (Self-Protection).
    2. Users cannot moderate those with equal or higher privileges.
    3. SUPERADMIN can moderate everyone (except themselves).
    """
    if actor.id == target.id:
        return False

    actor_level = ROLE_PRIVILEGE_LEVELS.get(actor.role, 0)
    target_level = ROLE_PRIVILEGE_LEVELS.get(target.role, 0)

    return actor_level > target_level
