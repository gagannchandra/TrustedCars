#!/bin/bash

# Wait for API to be ready
echo "Waiting for API to be ready..."
while ! curl -s http://localhost:8000/health/ready > /dev/null; do
  sleep 1
done

echo "API is ready. Running load tests using k6..."

SCRIPTS=("search_cars.js" "wishlist.js" "login.js" "create_inquiry.js" "admin_actions.js")

for script in "${SCRIPTS[@]}"; do
    echo "====================================="
    echo "Running 100 VU load test: $script"
    echo "====================================="
    cat ../load-tests/$script | docker run --rm --network host -i grafana/k6 run - --vus 100 --duration 15s
    
    echo "====================================="
    echo "Running 500 VU load test: $script"
    echo "====================================="
    cat ../load-tests/$script | docker run --rm --network host -i grafana/k6 run - --vus 500 --duration 15s
done

echo "Load tests completed."
