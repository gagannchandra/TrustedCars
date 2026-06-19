#!/bin/bash
set -e

echo "=== Capturing Data Integrity BEFORE Chaos ==="
docker-compose exec -T db psql -U trustedcars_user -d trustedcars_db -c "
SELECT 'users' as table_name, count(*) FROM users
UNION ALL SELECT 'cars', count(*) FROM cars
UNION ALL SELECT 'reviews', count(*) FROM reviews
UNION ALL SELECT 'outbox_events', count(*) FROM outbox_events;
" > before_chaos.txt

echo "=== Starting Background Load ==="
cat ../load-tests/create_inquiry.js | docker run --rm --network host -i grafana/k6 run - --vus 50 --duration 60s > chaos_load.log 2>&1 &
LOAD_PID=$!

sleep 10
echo "=== Chaos: Restarting API (Worker & Web) ==="
time docker-compose restart api

sleep 10
echo "=== Chaos: Restarting Redis ==="
time docker-compose restart redis

sleep 10
echo "=== Chaos: Restarting Database ==="
time docker-compose restart db

echo "Waiting for load test to finish..."
wait $LOAD_PID || true

echo "=== Capturing Data Integrity AFTER Chaos ==="
# wait for db to be up
while ! docker-compose exec -T db pg_isready -U trustedcars_user -d trustedcars_db > /dev/null; do
  sleep 1
done

docker-compose exec -T db psql -U trustedcars_user -d trustedcars_db -c "
SELECT 'users' as table_name, count(*) FROM users
UNION ALL SELECT 'cars', count(*) FROM cars
UNION ALL SELECT 'reviews', count(*) FROM reviews
UNION ALL SELECT 'outbox_events', count(*) FROM outbox_events;
" > after_chaos.txt

echo "=== Data Integrity Drift ==="
diff before_chaos.txt after_chaos.txt || echo "Drift detected (expected for inquiries/outbox_events)"
