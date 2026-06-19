import asyncio
import asyncpg
import json
from app.core.config import settings

async def profile_db():
    print("Connecting to DB...")
    conn = await asyncpg.connect(settings.DATABASE_URL.replace("postgresql+asyncpg", "postgresql"))
    
    print("\n=== Active Connections ===")
    active_conns = await conn.fetch("""
        SELECT count(*) as active_connections,
               count(*) filter (where state = 'idle in transaction') as idle_in_transaction
        FROM pg_stat_activity
        WHERE datname = current_database();
    """)
    for row in active_conns:
        print(f"Total Active: {row['active_connections']}")
        print(f"Idle in Transaction: {row['idle_in_transaction']}")
        
    print("\n=== Longest Transaction ===")
    longest_tx = await conn.fetch("""
        SELECT pid, state, now() - xact_start as duration, query
        FROM pg_stat_activity
        WHERE xact_start IS NOT NULL AND state != 'idle'
        ORDER BY duration DESC LIMIT 1;
    """)
    for row in longest_tx:
        print(f"PID: {row['pid']}, Duration: {row['duration']}, State: {row['state']}")
        print(f"Query: {row['query'][:200]}")

    print("\n=== Top 20 Slowest Queries ===")
    slow_queries = await conn.fetch("""
        SELECT query, calls, total_exec_time, mean_exec_time, rows
        FROM pg_stat_statements
        ORDER BY mean_exec_time DESC
        LIMIT 20;
    """)
    for idx, q in enumerate(slow_queries):
        print(f"{idx+1}. Calls: {q['calls']}, Mean: {q['mean_exec_time']:.2f}ms, Total: {q['total_exec_time']:.2f}ms")
        print(f"   Query: {q['query'][:300]}")
        print("-" * 50)
        
    print("\n=== EXPLAIN ANALYZE: Car Search ===")
    explain_car = await conn.fetch("""
        EXPLAIN ANALYZE SELECT * FROM cars WHERE status = 'active' AND make = 'Toyota' ORDER BY created_at DESC LIMIT 20;
    """)
    for row in explain_car:
        print(row['QUERY PLAN'])

    print("\n=== EXPLAIN ANALYZE: Wishlist ===")
    explain_wishlist = await conn.fetch("""
        EXPLAIN ANALYZE SELECT * FROM wishlist w JOIN cars c ON w.car_id = c.id WHERE w.user_id = '00000000-0000-0000-0000-000000000000' AND c.status = 'active';
    """)
    for row in explain_wishlist:
        print(row['QUERY PLAN'])
        
    print("\n=== EXPLAIN ANALYZE: Admin Dashboard (Count Cars by Status) ===")
    explain_admin = await conn.fetch("""
        EXPLAIN ANALYZE SELECT status, count(*) FROM cars GROUP BY status;
    """)
    for row in explain_admin:
        print(row['QUERY PLAN'])
        
    print("\n=== EXPLAIN ANALYZE: Create Inquiry ===")
    explain_inquiry = await conn.fetch("""
        EXPLAIN ANALYZE INSERT INTO inquiries (id, car_id, buyer_id, seller_id, status, created_at, updated_at) 
        VALUES ('00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000', 'open', now(), now())
        RETURNING id;
    """)
    for row in explain_inquiry:
        print(row['QUERY PLAN'])
        
    # rollback the inquiry insert
    await conn.execute("DELETE FROM inquiries WHERE id = '00000000-0000-0000-0000-000000000000';")

    await conn.close()

if __name__ == "__main__":
    asyncio.run(profile_db())
