#!/bin/bash

echo "Starting DB performance monitor..."
for i in {1..20}; do
  echo "--- Capture $i ---"
  ./scripts/db_perf.sh
  sleep 5
done
echo "DB performance monitor finished."
