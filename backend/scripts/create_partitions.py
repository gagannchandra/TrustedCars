import argparse
import asyncio
from datetime import datetime, timezone
from dateutil.relativedelta import relativedelta
from sqlalchemy.ext.asyncio import create_async_engine

from app.core.config import settings

async def create_partitions(months_ahead: int = 12):
    engine = create_async_engine(str(settings.SQLALCHEMY_DATABASE_URI), echo=True)
    async with engine.begin() as conn:
        now = datetime.now(timezone.utc)
        
        tables = ["audit_logs", "outbox_events"]
        
        for table in tables:
            for i in range(months_ahead + 1):
                target_date = now + relativedelta(months=i)
                year = target_date.year
                month = target_date.month
                
                start_date = datetime(year, month, 1, tzinfo=timezone.utc)
                end_date = start_date + relativedelta(months=1)
                
                partition_name = f"{table}_y{year}m{month:02d}"
                start_str = start_date.strftime('%Y-%m-%d')
                end_str = end_date.strftime('%Y-%m-%d')
                
                # Create partition if not exists
                sql = f"""
                CREATE TABLE IF NOT EXISTS {partition_name} 
                PARTITION OF {table} 
                FOR VALUES FROM ('{start_str}') TO ('{end_str}');
                """
                
                print(f"Executing: {sql.strip()}")
                await conn.execute(sql)
                
        print("Partition creation complete.")
        
    await engine.dispose()

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Create table partitions ahead of time.")
    parser.add_argument("--months", type=int, default=12, help="Number of months ahead to create partitions for")
    args = parser.parse_args()
    
    asyncio.run(create_partitions(args.months))
