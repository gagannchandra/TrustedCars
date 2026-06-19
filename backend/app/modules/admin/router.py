from fastapi import APIRouter
from app.modules.admin.routers.users import router as users_router
from app.modules.admin.routers.dealers import router as dealers_router
from app.modules.admin.routers.cars import router as cars_router
from app.modules.admin.routers.reviews import router as reviews_router
from app.modules.admin.routers.inquiries import router as inquiries_router
from app.modules.admin.routers.audit_logs import router as audit_logs_router
from app.modules.admin.routers.dashboard import router as dashboard_router

router = APIRouter()

router.include_router(dashboard_router)
router.include_router(users_router)
router.include_router(dealers_router)
router.include_router(cars_router)
router.include_router(reviews_router)
router.include_router(inquiries_router)
router.include_router(audit_logs_router)
