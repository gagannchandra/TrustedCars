Connecting to DB...

=== Active Connections ===
Total Active: 2
Idle in Transaction: 0

=== Longest Transaction ===
PID: 891, Duration: 0:00:00, State: active
Query: 
        SELECT pid, state, now() - xact_start as duration, query
        FROM pg_stat_activity
        WHERE xact_start IS NOT NULL AND state != 'idle'
        ORDER BY duration DESC LIMIT 1;
    

=== Top 20 Slowest Queries ===
1. Calls: 1, Mean: 55.47ms, Total: 55.47ms
   Query: CREATE EXTENSION IF NOT EXISTS pg_stat_statements
--------------------------------------------------
2. Calls: 1, Mean: 6.23ms, Total: 6.23ms
   Query: EXPLAIN ANALYZE SELECT * FROM wishlist w JOIN cars c ON w.car_id = c.id WHERE w.user_id = '00000000-0000-0000-0000-000000000000' AND c.status = 'active'
--------------------------------------------------
3. Calls: 2, Mean: 4.20ms, Total: 8.40ms
   Query: EXPLAIN ANALYZE SELECT * FROM cars WHERE status = 'active' AND make = 'Toyota' ORDER BY created_at DESC LIMIT 20
--------------------------------------------------
4. Calls: 2, Mean: 0.67ms, Total: 1.34ms
   Query: SELECT query, calls, total_exec_time, mean_exec_time, rows
        FROM pg_stat_statements
        ORDER BY mean_exec_time DESC
        LIMIT $1
--------------------------------------------------
5. Calls: 1, Mean: 0.47ms, Total: 0.47ms
   Query: EXPLAIN ANALYZE SELECT status, count(*) FROM cars GROUP BY status
--------------------------------------------------
6. Calls: 136, Mean: 0.36ms, Total: 49.27ms
   Query: WITH RECURSIVE typeinfo_tree(
    oid, ns, name, kind, basetype, elemtype, elemdelim,
    range_subtype, attrtypoids, attrnames, depth)
AS (
    SELECT
        ti.oid, ti.ns, ti.name, ti.kind, ti.basetype,
        ti.elemtype, ti.elemdelim, ti.range_subtype,
        ti.attrtypoids, ti.attrnames, $2

--------------------------------------------------
7. Calls: 3, Mean: 0.27ms, Total: 0.82ms
   Query: SELECT count(*) as active_connections,
               count(*) filter (where state = $1) as idle_in_transaction
        FROM pg_stat_activity
        WHERE datname = current_database()
--------------------------------------------------
8. Calls: 3, Mean: 0.23ms, Total: 0.68ms
   Query: SELECT pid, state, now() - xact_start as duration, query
        FROM pg_stat_activity
        WHERE xact_start IS NOT NULL AND state != $1
        ORDER BY duration DESC LIMIT $2
--------------------------------------------------
9. Calls: 2, Mean: 0.17ms, Total: 0.33ms
   Query: SELECT pg_catalog.pg_class.relname 
FROM pg_catalog.pg_class JOIN pg_catalog.pg_namespace ON pg_catalog.pg_namespace.oid = pg_catalog.pg_class.relnamespace 
WHERE pg_catalog.pg_class.relname = $1::VARCHAR AND pg_catalog.pg_class.relkind = ANY (ARRAY[$2::VARCHAR, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR
--------------------------------------------------
10. Calls: 2635, Mean: 0.16ms, Total: 414.87ms
   Query: SELECT cars.id, cars.user_id, cars.dealership_id, cars.make, cars.model, cars.variant, cars.year, cars.fuel_type, cars.transmission, cars.body_type, cars.odometer_km, cars.ownership_count, cars.asking_price, cars.city, cars.state, cars.description, cars.quality_grade, cars.status, cars.moderation_st
--------------------------------------------------
11. Calls: 3, Mean: 0.12ms, Total: 0.35ms
   Query: SELECT alembic_version.version_num 
FROM alembic_version
--------------------------------------------------
12. Calls: 3, Mean: 0.11ms, Total: 0.33ms
   Query: select current_schema()
--------------------------------------------------
13. Calls: 60, Mean: 0.06ms, Total: 3.39ms
   Query: SELECT outbox_events.id 
FROM outbox_events 
WHERE outbox_events.status = $1::outboxeventstatus OR outbox_events.status = $2::outboxeventstatus AND outbox_events.last_attempt_at < $3::TIMESTAMP WITH TIME ZONE OR outbox_events.status = $4::outboxeventstatus AND outbox_events.next_retry_at <= $5::TIME
--------------------------------------------------
14. Calls: 120, Mean: 0.04ms, Total: 4.32ms
   Query: SELECT count(*) AS count_1 
FROM outbox_events 
WHERE outbox_events.status = $1::outboxeventstatus
--------------------------------------------------
15. Calls: 176, Mean: 0.03ms, Total: 4.97ms
   Query: SELECT
    t.oid,
    t.typelem     AS elemtype,
    t.typtype     AS kind
FROM
    pg_catalog.pg_type AS t
WHERE
    t.oid = $1
--------------------------------------------------
16. Calls: 3, Mean: 0.02ms, Total: 0.06ms
   Query: select pg_catalog.version()
--------------------------------------------------
17. Calls: 136, Mean: 0.01ms, Total: 1.68ms
   Query: SELECT
                        current_setting($1) AS cur,
                        set_config($2, $3, $4) AS new
--------------------------------------------------
18. Calls: 2761, Mean: 0.01ms, Total: 30.71ms
   Query: BEGIN ISOLATION LEVEL READ COMMITTED
--------------------------------------------------
19. Calls: 136, Mean: 0.01ms, Total: 1.19ms
   Query: SELECT
                    set_config($2, $1, $3)
--------------------------------------------------
20. Calls: 1, Mean: 0.00ms, Total: 0.00ms
   Query: SELECT $1
--------------------------------------------------

=== EXPLAIN ANALYZE: Car Search ===
Limit  (cost=3.16..3.19 rows=13 width=462) (actual time=0.048..0.051 rows=18 loops=1)
  ->  Sort  (cost=3.16..3.19 rows=13 width=462) (actual time=0.047..0.048 rows=18 loops=1)
        Sort Key: created_at DESC
        Sort Method: quicksort  Memory: 29kB
        ->  Seq Scan on cars  (cost=0.00..2.92 rows=13 width=462) (actual time=0.009..0.017 rows=18 loops=1)
              Filter: ((status = 'active'::car_status_enum) AND ((make)::text = 'Toyota'::text))
              Rows Removed by Filter: 43
Planning Time: 2.726 ms
Execution Time: 0.156 ms

=== EXPLAIN ANALYZE: Wishlist ===
Hash Join  (cost=12.69..15.57 rows=2 width=546) (actual time=0.032..0.034 rows=0 loops=1)
  Hash Cond: (c.id = w.car_id)
  ->  Seq Scan on cars c  (cost=0.00..2.76 rows=29 width=462) (actual time=0.009..0.009 rows=1 loops=1)
        Filter: (status = 'active'::car_status_enum)
  ->  Hash  (cost=12.64..12.64 rows=4 width=84) (actual time=0.008..0.008 rows=0 loops=1)
        Buckets: 1024  Batches: 1  Memory Usage: 8kB
        ->  Bitmap Heap Scan on wishlist w  (cost=4.18..12.64 rows=4 width=84) (actual time=0.007..0.007 rows=0 loops=1)
              Recheck Cond: (user_id = '00000000-0000-0000-0000-000000000000'::uuid)
              ->  Bitmap Index Scan on ix_wishlist_user_id  (cost=0.00..4.18 rows=4 width=0) (actual time=0.005..0.005 rows=0 loops=1)
                    Index Cond: (user_id = '00000000-0000-0000-0000-000000000000'::uuid)
Planning Time: 2.138 ms
Execution Time: 0.136 ms

=== EXPLAIN ANALYZE: Admin Dashboard (Count Cars by Status) ===
HashAggregate  (cost=2.91..2.93 rows=2 width=12) (actual time=0.032..0.033 rows=2 loops=1)
  Group Key: status
  Batches: 1  Memory Usage: 24kB
  ->  Seq Scan on cars  (cost=0.00..2.61 rows=61 width=4) (actual time=0.012..0.016 rows=61 loops=1)
Planning Time: 0.145 ms
Execution Time: 0.064 ms

=== EXPLAIN ANALYZE: Create Inquiry ===
Insert on inquiries  (cost=0.00..0.01 rows=1 width=116) (actual time=3.164..3.165 rows=1 loops=1)
  ->  Result  (cost=0.00..0.01 rows=1 width=116) (actual time=0.002..0.002 rows=1 loops=1)
Planning Time: 0.014 ms
Execution Time: 3.214 ms
