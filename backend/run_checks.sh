#!/bin/bash
echo "Copying updated files..."
docker cp /home/gagan-chandra/Code/TrustedCarz/backend/app/. backend-api-1:/app/app/
docker cp /home/gagan-chandra/Code/TrustedCarz/backend/tests/. backend-api-1:/app/tests/
docker cp /home/gagan-chandra/Code/TrustedCarz/backend/requirements.txt backend-api-1:/app/requirements.txt
docker cp /home/gagan-chandra/Code/TrustedCarz/backend/pytest.ini backend-api-1:/app/pytest.ini

echo "Installing dependencies..."
docker exec -u root backend-api-1 pip install -U pip wheel setuptools
docker exec -u root backend-api-1 pip install -r requirements.txt
docker exec -u root backend-api-1 pip install pytest pytest-asyncio httpx mypy ruff black bandit safety pip-audit

echo "Formatting with Black..."
docker exec -u root backend-api-1 black app/ tests/

echo "=== Pytest ==="
docker exec -e PYTHONPATH=/app -u root backend-api-1 pytest tests/

echo "=== MyPy ==="
docker exec -e PYTHONPATH=/app -u root backend-api-1 mypy app/

echo "=== Ruff ==="
docker exec -u root backend-api-1 ruff check app/

echo "=== Black Check ==="
docker exec -u root backend-api-1 black --check app/ tests/

echo "=== Bandit ==="
docker exec -u root backend-api-1 bandit -r app/

echo "=== Pip-Audit ==="
docker exec -u root backend-api-1 pip-audit
