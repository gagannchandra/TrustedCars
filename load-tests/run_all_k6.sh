#!/bin/bash
for script in login.js search_cars.js create_inquiry.js wishlist.js admin_actions.js; do
  echo "Running $script..."
  docker run --rm -i --network host grafana/k6 run - < $script >> k6_results.txt
  echo "----------------------------------------" >> k6_results.txt
done
echo "All done."
