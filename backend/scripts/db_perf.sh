#!/bin/bash
set -e

echo "=== Database Performance Metrics ==="
docker-compose exec -T db psql -U trustedcarz_user -d trustedcarz_db -c "
-- Total and Active Connections
SELECT count(*) as total_connections,
       sum(case when state = 'active' then 1 else 0 end) as active_connections
FROM pg_stat_activity;

-- Lock Waits
SELECT count(*) as lock_waits
FROM pg_stat_activity 
WHERE wait_event_type = 'Lock';

-- Deadlocks
SELECT pg_stat_get_db_deadlocks(oid) as deadlocks 
FROM pg_database 
WHERE datname = 'trustedcarz_db';

-- Sequential Scans vs Index Scans (Overview)
SELECT sum(seq_scan) as total_seq_scans, 
       sum(idx_scan) as total_index_scans
FROM pg_stat_user_tables;
"
