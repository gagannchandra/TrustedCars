from typing import Protocol
from uuid import UUID


class DealerAuthorizationProvider(Protocol):
    async def is_dealer_authorized(
        self, user_id: UUID, dealership_id: UUID | None
    ) -> bool: ...
