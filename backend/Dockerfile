# ============================================================================
# TrustedCars Backend - Production Dockerfile
# ============================================================================
#
# This Dockerfile builds a production-ready container image for the FastAPI
# backend application.
#
# PURPOSE:
#   ✅ Production deployments (AWS ECS, Google Cloud Run, Azure Container Apps)
#   ✅ Kubernetes/Docker Swarm deployments
#   ✅ CI/CD pipeline image builds
#
# NOT USED FOR:
#   ❌ Local development (use native Python with: uvicorn app.main:app --reload)
#
# USAGE:
#   Build: docker build -t trustedcars-api:latest .
#   Run:   docker run -p 8000:8000 --env-file .env trustedcars-api:latest
#
# For local development setup, see README.md "Local Development Setup" section.
# For production deployment guide, see PRODUCTION_DEPLOYMENT.md.
#
# ============================================================================

FROM python:3.11-slim

# Create a non-root user and group
RUN groupadd -r appgroup && useradd -r -g appgroup -d /app -s /sbin/nologin -c "App user" appuser

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

RUN apt-get update \
  && apt-get -y install gcc postgresql-client \
  && apt-get clean \
  && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code and set ownership
COPY --chown=appuser:appgroup . .

# Switch to non-root user
USER appuser

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
