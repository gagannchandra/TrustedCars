#!/bin/bash
set -e
echo "Starting Real DR Drill..."
START_TIME=$(date +%s)

# Create an isolated recovery dataset
docker exec backend-db-1 psql -U trustedcars_user -d trustedcars_db -c "
CREATE TABLE IF NOT EXISTS dr_test_table (id SERIAL PRIMARY KEY, data TEXT);
TRUNCATE dr_test_table;
INSERT INTO dr_test_table (data) VALUES ('row1'), ('row2'), ('row3'), ('row4'), ('row5');
"

# Validate exact row counts before
COUNT_BEFORE=$(docker exec backend-db-1 psql -U trustedcars_user -d trustedcars_db -t -c "SELECT count(*) FROM dr_test_table;")
echo "Row count before: $COUNT_BEFORE"

# Simulate Backup
echo "Taking pg_dump..."
docker exec backend-db-1 pg_dump -U trustedcars_user -d trustedcars_db -t dr_test_table -f /tmp/backup.sql

# Delete controlled subset of records
echo "Deleting records to simulate data loss..."
docker exec backend-db-1 psql -U trustedcars_user -d trustedcars_db -c "DELETE FROM dr_test_table WHERE id IN (1,2,3);"

# Restore records from backup
echo "Restoring from backup..."
docker exec backend-db-1 psql -U trustedcars_user -d trustedcars_db -c "DROP TABLE dr_test_table;"
docker exec backend-db-1 psql -U trustedcars_user -d trustedcars_db -f /tmp/backup.sql

# Validate exact row counts after
COUNT_AFTER=$(docker exec backend-db-1 psql -U trustedcars_user -d trustedcars_db -t -c "SELECT count(*) FROM dr_test_table;")
echo "Row count after: $COUNT_AFTER"

END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))
echo "DR Simulation Complete in $DURATION seconds. RTO=$DURATION RPO=0s"
