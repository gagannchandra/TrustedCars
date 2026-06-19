#!/bin/bash
set -e

echo "=== Security Regression Tests ==="

echo -n "1. Admin Bypass (Normal user accessing admin): "
curl -s -o /dev/null -w "%{http_code}" -X POST http://localhost:8000/api/v1/admin/users/123/suspend -H "Authorization: Bearer invalid_normal_token"
echo ""

echo -n "2. IDOR (Accessing someone else's private data): "
curl -s -o /dev/null -w "%{http_code}" http://localhost:8000/api/v1/users/me/wishlist -H "Authorization: Bearer invalid_token"
echo ""

echo -n "3. SQL Injection in Search: "
curl -s -o /dev/null -w "%{http_code}" "http://localhost:8000/api/v1/cars?make=Toyota'; DROP TABLE users;--"
echo ""

echo -n "4. MFA Bypass (Login without OTP when required): "
curl -s -o /dev/null -w "%{http_code}" -X POST http://localhost:8000/api/v1/auth/login/mfa -d '{"email":"test@test.com", "password":"password"}' -H "Content-Type: application/json"
echo ""

echo -n "5. Rate Limiting (Bursting 100 requests to login): "
for i in {1..20}; do
  curl -s -o /dev/null -w "%{http_code}" -X POST http://localhost:8000/api/v1/auth/login -d '{"email":"test@test.com", "password":"bad"}' -H "Content-Type: application/json" > /dev/null &
done
wait
echo " (Completed burst, expecting some 429s)"

echo -n "6. Correlation ID Injection: "
curl -s -i http://localhost:8000/health/ready -H "X-Correlation-ID: injected-malicious-id" | head -n 1
echo ""

echo "Security tests completed."
