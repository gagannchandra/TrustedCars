from app.core.events import event_bus
from app.modules.auth.service import AuthService
from app.modules.cars.service import CarService
from app.modules.auth.providers import AuthDealerProvider
from app.modules.images.service import ImageService
from app.modules.inquiries.service import InquiryService
from app.modules.wishlist.service import WishlistService
from app.modules.reviews.service import ReviewsService

_subscribers_configured = False


async def on_user_deleted(session, user_id):
    from uuid import UUID

    uid = UUID(str(user_id)) if isinstance(user_id, str) else user_id
    await AuthService(session).handle_user_deleted(uid)
    await CarService(session, AuthDealerProvider(session)).handle_user_deleted(uid)
    await InquiryService(session, None).handle_user_deleted(uid)
    await WishlistService(session).handle_user_deleted(uid)
    await ReviewsService(session).handle_user_deleted(uid)


async def on_user_deactivated(session, user_id):
    from uuid import UUID

    uid = UUID(str(user_id)) if isinstance(user_id, str) else user_id
    await AuthService(session).handle_user_deactivated(uid)
    await CarService(session, AuthDealerProvider(session)).handle_user_deactivated(uid)


async def on_car_deleted(session, car_id):
    from uuid import UUID

    cid = UUID(str(car_id)) if isinstance(car_id, str) else car_id
    await ImageService(session, None).handle_car_deleted(cid)
    await InquiryService(session, None).handle_car_deleted(cid)
    await WishlistService(session).handle_car_deleted(cid)
    await ReviewsService(session).handle_car_deleted(cid)


async def on_cars_bulk_deleted(session, car_ids, user_id):
    await ImageService(session, None).handle_cars_bulk_deleted(car_ids)
    await InquiryService(session, None).handle_cars_bulk_deleted(car_ids)
    await WishlistService(session).handle_cars_bulk_deleted(car_ids)
    await ReviewsService(session).handle_cars_bulk_deleted(car_ids)


def setup_subscribers():
    global _subscribers_configured
    if _subscribers_configured:
        return

    event_bus.subscribe("USER_SOFT_DELETED", on_user_deleted)
    event_bus.subscribe("USER_DEACTIVATED", on_user_deactivated)
    event_bus.subscribe("CAR_SOFT_DELETED", on_car_deleted)
    event_bus.subscribe("CARS_BULK_SOFT_DELETED", on_cars_bulk_deleted)

    _subscribers_configured = True
