from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.shared.interfaces.dealers import DealerAuthorizationProvider


def get_dealer_provider(
    session: AsyncSession = Depends(get_db),
) -> DealerAuthorizationProvider:
    from app.modules.auth.providers import AuthDealerProvider

    return AuthDealerProvider(session)


from app.shared.interfaces.cars import CarOwnershipProvider


def get_car_provider(
    session: AsyncSession = Depends(get_db),
    dealer_provider: DealerAuthorizationProvider = Depends(get_dealer_provider),
) -> CarOwnershipProvider:
    from app.modules.cars.providers import AuthCarProvider

    return AuthCarProvider(session, dealer_provider)
