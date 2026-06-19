#!/bin/bash
set -e

echo "=== Backup & Restore Drill ==="

echo "1. Generating backup..."
docker-compose exec -T db pg_dump -U trustedcars_user -d trustedcars_db -F c -f /tmp/backup.dump

echo "2. Deleting a controlled subset of records (e.g., users with specific email)..."
docker-compose exec -T db psql -U trustedcars_user -d trustedcars_db -c "
DELETE FROM users WHERE email = 'dealer_508d377c-a7fb-409a-9866-8cf1baea4c80@test.com';
"

echo "3. Restoring backup..."
docker-compose exec -T db pg_restore -U trustedcars_user -d trustedcars_db --clean --if-exists -1 /tmp/backup.dump

echo "4. Verifying record restored..."
docker-compose exec -T db psql -U trustedcars_user -d trustedcars_db -c "
SELECT count(*) FROM users WHERE email = 'dealer_508d377c-a7fb-409a-9866-8cf1baea4c80@test.com';
"
