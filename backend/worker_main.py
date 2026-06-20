import asyncio
from app.core.worker import AsyncOutboxWorker
from app.bootstrap.subscribers import setup_subscribers
import os

async def reconciliation_loop():
    from app.db.session import AsyncSessionLocal
    from app.shared.statistics.reconciliation import reconcile_platform_statistics
    import logging
    while True:
        try:
            async with AsyncSessionLocal() as session:
                await reconcile_platform_statistics(session)
        except Exception as e:
            logging.getLogger(__name__).error(f"Reconciliation error: {e}")
        await asyncio.sleep(86400)  # every 24 hours

async def main():
    setup_subscribers()
    worker = AsyncOutboxWorker()
    await worker.start()
    reconciliation_task = asyncio.create_task(reconciliation_loop())
    try:
        await asyncio.Event().wait()  # run forever
    finally:
        reconciliation_task.cancel()
        await worker.stop()
        from app.db.session import engine
        await engine.dispose()

if __name__ == "__main__":
    if os.getenv("TESTING") != "1":
        asyncio.run(main())
