from typing import Protocol
from uuid import UUID
from app.modules.auth.models import User


class CarOwnershipProvider(Protocol):
    async def verify_user_can_edit_car(
        self, car_id: UUID, current_user: User
    ) -> bool: ...

    async def get_car_seller_id(self, car_id: UUID) -> UUID | None: ...

    async def is_user_seller_of_car(self, car_id: UUID, current_user: User) -> bool: ...
