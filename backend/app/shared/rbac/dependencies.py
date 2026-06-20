from typing import List
from fastapi import Request, HTTPException, status, Depends
from app.modules.auth.models import User
from app.shared.rbac.permissions import PermissionEnum
from app.shared.rbac.mappings import get_role_permissions
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.shared.dependencies.auth import get_current_user
from app.shared.interfaces.dealers import DealerAuthorizationProvider


class RequirePermissions:
    def __init__(self, required_permissions: List[PermissionEnum]):
        self.required_permissions = required_permissions

    async def __call__(
        self,
        request: Request,
        current_user: User = Depends(get_current_user),
        db: AsyncSession = Depends(get_db),
    ):
        # 1. Enforce MFA for any privileged action
        if not current_user.mfa_enabled:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="MFA is required to perform privileged actions.",
            )

        # 2. Check permissions
        user_permissions = get_role_permissions(current_user.role)
        for perm in self.required_permissions:
            if perm not in user_permissions:
                # Log SECURITY_VIOLATION using AuditService
                # We can dispatch it to the event bus or call AuditService directly
                # However, AuditService might need session, so we can dispatch an event
                from app.core.events import event_bus

                # We'll just raise 403, and ideally middleware or exception handlers log it.
                # To be explicit, we can dispatch it:
                from app.core.context import correlation_id_ctx, request_id_ctx

                req_id = request_id_ctx.get()
                corr_id = correlation_id_ctx.get()

                await event_bus.publish(
                    "audit.log_created",
                    session=db,
                    action="SECURITY_VIOLATION",
                    actor_id=str(current_user.id),
                    target_resource_id=None,
                    resource_type="endpoint",
                    details={"required": perm.value, "path": request.url.path},
                    request_id=req_id,
                    correlation_id=corr_id,
                )

                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"Missing required permission: {perm.value}",
                )

        return current_user


async def assert_can_edit_resource(
    current_user: User,
    owner_user_ids,
    dealership_id=None,
    dealer_provider: DealerAuthorizationProvider | None = None,
    resource_name: str = "resource",
):
    from app.modules.auth.models import RoleEnum
    from app.shared.exceptions.handlers import CustomException

    if current_user.role == RoleEnum.dealer and dealership_id and dealer_provider:
        if not await dealer_provider.is_dealer_authorized(current_user.id, dealership_id):
            raise CustomException(403, f"Not authorized to edit this dealership's {resource_name}")
    else:
        if isinstance(owner_user_ids, list):
            if current_user.id not in owner_user_ids:
                raise CustomException(403, f"Not authorized to edit this {resource_name}")
        elif owner_user_ids != current_user.id:
            raise CustomException(403, f"Not authorized to edit this {resource_name}")
