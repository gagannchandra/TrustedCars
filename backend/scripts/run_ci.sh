#!/bin/bash
set -e

echo "==> Building CI Image <=="
docker build -t trustedcarz-api-ci -f Dockerfile.ci .

echo "==> Running Pytest <=="
docker run --rm -e TESTING=1 --network host trustedcarz-api-ci pytest tests/

echo "==> Running Ruff <=="
docker run --rm trustedcarz-api-ci ruff check app/ tests/

echo "==> Running Black <=="
docker run --rm trustedcarz-api-ci black --check app/ tests/

echo "==> Running MyPy <=="
docker run --rm trustedcarz-api-ci mypy app/

echo "==> Running Bandit <=="
docker run --rm trustedcarz-api-ci bandit -r app/ -c pyproject.toml

echo "==> Running Safety <=="
docker run --rm trustedcarz-api-ci safety check -r requirements.txt --full-report

echo "==> Running Pip-Audit <=="
docker run --rm trustedcarz-api-ci pip-audit

echo "==> CI PIPELINE PASSED <=="
