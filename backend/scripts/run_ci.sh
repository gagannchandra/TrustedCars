#!/bin/bash
set -e

echo "==> Building CI Image <=="
docker build -t trustedcars-api-ci -f Dockerfile.ci .

echo "==> Running Pytest <=="
docker run --rm -e TESTING=1 --network host trustedcars-api-ci pytest tests/

echo "==> Running Ruff <=="
docker run --rm trustedcars-api-ci ruff check app/ tests/

echo "==> Running Black <=="
docker run --rm trustedcars-api-ci black --check app/ tests/

echo "==> Running MyPy <=="
docker run --rm trustedcars-api-ci mypy app/

echo "==> Running Bandit <=="
docker run --rm trustedcars-api-ci bandit -r app/ -c pyproject.toml

echo "==> Running Safety <=="
docker run --rm trustedcars-api-ci safety check -r requirements.txt --full-report

echo "==> Running Pip-Audit <=="
docker run --rm trustedcars-api-ci pip-audit

echo "==> CI PIPELINE PASSED <=="
