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

    from app.core.statistics import PlatformStatisticsService

    async def handle_stats(event_type, **kwargs):
        session = kwargs.pop("session", None)
        if not session:
            return
        svc = PlatformStatisticsService(session)
        if event_type == "USER_CREATED":
            await svc.handle_user_created(**kwargs)
        elif event_type == "USER_SOFT_DELETED":
            await svc.handle_user_deleted(**kwargs)
        elif event_type == "USER_SUSPENDED":
            await svc.handle_user_suspended(**kwargs)
        elif event_type == "USER_RESTORED":
            await svc.handle_user_restored(**kwargs)
        elif event_type == "CAR_CREATED":
            await svc.handle_car_created(**kwargs)
        elif event_type == "CAR_APPROVED":
            await svc.handle_car_approved(**kwargs)
        elif event_type == "CAR_SOFT_DELETED":
            await svc.handle_car_deleted(**kwargs)
        elif event_type == "REVIEW_CREATED":
            await svc.handle_review_created(**kwargs)
        elif event_type == "REVIEW_DELETED":
            await svc.handle_review_deleted(**kwargs)
        elif event_type == "INQUIRY_CREATED":
            await svc.handle_inquiry_created(**kwargs)

    # Wrap the handlers
    event_bus.subscribe("USER_CREATED", lambda **k: handle_stats("USER_CREATED", **k))
    event_bus.subscribe(
        "USER_SOFT_DELETED", lambda **k: handle_stats("USER_SOFT_DELETED", **k)
    )
    event_bus.subscribe(
        "USER_SUSPENDED", lambda **k: handle_stats("USER_SUSPENDED", **k)
    )
    event_bus.subscribe("USER_RESTORED", lambda **k: handle_stats("USER_RESTORED", **k))
    event_bus.subscribe("CAR_CREATED", lambda **k: handle_stats("CAR_CREATED", **k))
    event_bus.subscribe("CAR_APPROVED", lambda **k: handle_stats("CAR_APPROVED", **k))
    event_bus.subscribe(
        "CAR_SOFT_DELETED", lambda **k: handle_stats("CAR_SOFT_DELETED", **k)
    )
    event_bus.subscribe(
        "REVIEW_CREATED", lambda **k: handle_stats("REVIEW_CREATED", **k)
    )
    event_bus.subscribe(
        "REVIEW_DELETED", lambda **k: handle_stats("REVIEW_DELETED", **k)
    )
    event_bus.subscribe(
        "INQUIRY_CREATED", lambda **k: handle_stats("INQUIRY_CREATED", **k)
    )
    _subscribers_configured = True
