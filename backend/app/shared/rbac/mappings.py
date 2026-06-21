from app.shared.rbac.roles import RoleEnum
from app.shared.rbac.permissions import PermissionEnum
from typing import Set

ROLE_PERMISSIONS: dict[RoleEnum, Set[PermissionEnum]] = {
    RoleEnum.user: set(),
    RoleEnum.dealer: set(),
    RoleEnum.admin: {
        PermissionEnum.VIEW_ADMIN_DASHBOARD,
        PermissionEnum.VIEW_AUDIT_LOGS,
        PermissionEnum.SUSPEND_USER,
        PermissionEnum.RESTORE_USER,
        PermissionEnum.DELETE_USER,
        PermissionEnum.SUSPEND_DEALER,
        PermissionEnum.RESTORE_DEALER,
        PermissionEnum.DELETE_DEALER,
        PermissionEnum.APPROVE_CAR,
        PermissionEnum.REJECT_CAR,
        PermissionEnum.HIDE_CAR,
        PermissionEnum.RESTORE_CAR,
        PermissionEnum.FEATURE_CAR,
        PermissionEnum.DELETE_REVIEW,
        PermissionEnum.RESTORE_REVIEW,
        PermissionEnum.CLOSE_INQUIRY,
        PermissionEnum.ARCHIVE_INQUIRY,
    },
    RoleEnum.support_agent: {
        PermissionEnum.VIEW_ADMIN_DASHBOARD,
        PermissionEnum.SUSPEND_USER,
        PermissionEnum.RESTORE_USER,
        PermissionEnum.CLOSE_INQUIRY,
        PermissionEnum.ARCHIVE_INQUIRY,
    },
    RoleEnum.content_moderator: {
        PermissionEnum.VIEW_ADMIN_DASHBOARD,
        PermissionEnum.APPROVE_CAR,
        PermissionEnum.REJECT_CAR,
        PermissionEnum.HIDE_CAR,
        PermissionEnum.FEATURE_CAR,
        PermissionEnum.DELETE_REVIEW,
        PermissionEnum.RESTORE_REVIEW,
    },
    RoleEnum.superadmin: set(PermissionEnum),
}


def get_role_permissions(role: RoleEnum) -> Set[PermissionEnum]:
    return ROLE_PERMISSIONS.get(role, set())
