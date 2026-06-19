import pytest
from app.core.models import PlatformStatistics


@pytest.mark.asyncio
async def test_dashboard_statistics(async_client, admin_token_headers, setup_db):
    from sqlalchemy import select

    stmt = select(PlatformStatistics).where(PlatformStatistics.id == 1)
    stats = (await setup_db.execute(stmt)).scalar_one_or_none()
    if not stats:
        stats = PlatformStatistics(
            id=1,
            total_users=10,
            active_users=8,
            suspended_users=2,
            total_dealers=5,
            active_dealers=4,
            suspended_dealers=1,
            pending_cars=3,
            active_cars=20,
            hidden_cars=2,
            total_reviews=100,
        )
        setup_db.add(stats)
    else:
        stats.total_users = 10
        stats.total_reviews = 100
    await setup_db.commit()

    res = await async_client.get(
        "/api/v1/admin/dashboard/statistics", headers=admin_token_headers
    )
    assert res.status_code == 200
    data = res.json()
    assert data["total_users"] == 10
    assert data["total_reviews"] == 100
