from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.exc import IntegrityError
from app.modules.users.repository import UserRepository
from app.core.events import event_bus
from app.modules.users.schemas import UserProfileUpdate
from app.shared.audit.service import AuditService
from app.shared.exceptions.handlers import CustomException
from uuid import UUID


class UserService:
    def __init__(self, session: AsyncSession):
        self.repository = UserRepository(session)
        self.session = session

    async def _log_audit(
        self,
        user_id: UUID,
        action: str,
        target_id: UUID | None = None,
        reason: str | None = None,
        details: str = "",
    ):
        await AuditService(self.session).log_action(
            user_id, action, target_id, reason, details
        )

    async def get_current_user_profile(self, user_id: UUID):
        user = await self.repository.get_user_by_id(user_id)
        if not user:
            raise CustomException(404, "User not found")
        return user

    async def get_public_user_profile(self, user_id: UUID):
        user = await self.repository.get_user_by_id(user_id)
        if not user:
            raise CustomException(404, "User not found")
        return user

    async def get_dealer_profile(self, dealership_id: UUID):
        dealer = await self.repository.get_dealer_by_id(dealership_id)
        if not dealer:
            raise CustomException(404, "Dealership not found")
        return dealer

    async def update_user_profile(self, user_id: UUID, req: UserProfileUpdate):
        user = await self.repository.get_user_by_id(user_id)
        if not user:
            raise CustomException(404, "User not found")

        if req.email and req.email != user.email:
            existing = await self.repository.get_user_by_email(req.email)
            if existing:
                raise CustomException(400, "Email already in use")
            user.email = req.email

        if req.full_name is not None:
            user.full_name = req.full_name
        if req.phone_number is not None:
            user.phone_number = req.phone_number
        if req.avatar_url is not None:
            user.avatar_url = str(req.avatar_url)

        try:
            await self.repository.update_user(user)
            await self._log_audit(
                user_id, "UPDATE_PROFILE", user_id, None, "User updated profile"
            )
            await self.session.commit()
            await self.session.refresh(user)
        except IntegrityError:
            await self.session.rollback()
            raise CustomException(400, "Data validation failed or email in use")

        return user

    async def soft_delete_user(self, user_id: UUID):
        user = await self.repository.get_user_by_id(user_id)
        if not user:
            raise CustomException(404, "User not found")

        await self.repository.soft_delete_user(user)
        await self._log_audit(
            user_id, "SOFT_DELETE", user_id, None, "User deleted their account"
        )
        await event_bus.publish(
            "USER_SOFT_DELETED", session=self.session, user_id=user.id
        )
        await self.session.commit()

    async def deactivate_user(self, user_id: UUID):
        user = await self.repository.get_user_by_id(user_id)
        if not user:
            raise CustomException(404, "User not found")

        user.is_active = False
        await self.repository.update_user(user)
        await self._log_audit(
            user_id, "DEACTIVATE", user_id, None, "User account deactivated"
        )
        await event_bus.publish(
            "USER_DEACTIVATED", session=self.session, user_id=user.id
        )
        await self.session.commit()
