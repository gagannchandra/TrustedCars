# TrustedCars - Production Deployment Guide

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Infrastructure Setup](#infrastructure-setup)
3. [Database Setup](#database-setup)
4. [Application Deployment](#application-deployment)
5. [Post-Deployment](#post-deployment)
6. [Monitoring & Maintenance](#monitoring--maintenance)
7. [Rollback Procedures](#rollback-procedures)
8. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Services
- [ ] Docker Registry (AWS ECR, Docker Hub, GCR)
- [ ] Managed PostgreSQL (AWS RDS, DigitalOcean Managed Database)
- [ ] Managed Redis (AWS ElastiCache, Redis Cloud)
- [ ] Object Storage (AWS S3, DigitalOcean Spaces)
- [ ] Load Balancer (AWS ALB, Nginx)
- [ ] SSL Certificates (Let's Encrypt, AWS ACM)
- [ ] Secrets Manager (AWS Secrets Manager, Vault, Doppler)
- [ ] Monitoring (CloudWatch, Datadog, Prometheus + Grafana)

### Required Credentials
- [ ] Database connection string
- [ ] Redis connection string
- [ ] S3 access credentials or IAM role
- [ ] Email service API key (Resend)
- [ ] Sentry DSN
- [ ] Docker registry credentials

---

## Infrastructure Setup

### Option 1: AWS Deployment (Recommended)

#### 1.1 VPC Configuration
```bash
# Create VPC with public and private subnets
aws ec2 create-vpc --cidr-block 10.0.0.0/16

# Create subnets
# Public subnet (for ALB): 10.0.1.0/24
# Private subnet 1 (for API): 10.0.2.0/24
# Private subnet 2 (for DB): 10.0.3.0/24
```

#### 1.2 Security Groups
```bash
# ALB Security Group: Allow 80, 443 from 0.0.0.0/0
# API Security Group: Allow 8000 from ALB only
# DB Security Group: Allow 5432 from API only
# Redis Security Group: Allow 6379 from API only
```

#### 1.3 RDS Setup
```bash
aws rds create-db-instance \
  --db-instance-identifier trustedcars-prod \
  --db-instance-class db.t3.medium \
  --engine postgres \
  --engine-version 15.4 \
  --master-username trustedcars_admin \
  --master-user-password <secure-password> \
  --allocated-storage 100 \
  --vpc-security-group-ids sg-xxxxx \
  --db-subnet-group-name private-subnet-group \
  --backup-retention-period 30 \
  --preferred-backup-window "03:00-04:00" \
  --preferred-maintenance-window "mon:04:00-mon:05:00" \
  --multi-az \
  --storage-encrypted \
  --enable-performance-insights
```

#### 1.4 ElastiCache Setup
```bash
aws elasticache create-replication-group \
  --replication-group-id trustedcars-redis \
  --replication-group-description "TrustedCars Redis Cluster" \
  --engine redis \
  --cache-node-type cache.t3.medium \
  --num-cache-clusters 2 \
  --automatic-failover-enabled \
  --at-rest-encryption-enabled \
  --transit-encryption-enabled \
  --auth-token <secure-token>
```

#### 1.5 S3 Setup
```bash
aws s3api create-bucket \
  --bucket trustedcars-prod-images \
  --region us-east-1

# Enable versioning
aws s3api put-bucket-versioning \
  --bucket trustedcars-prod-images \
  --versioning-configuration Status=Enabled

# Configure lifecycle policy
aws s3api put-bucket-lifecycle-configuration \
  --bucket trustedcars-prod-images \
  --lifecycle-configuration file://s3-lifecycle.json
```

#### 1.6 ECS Cluster Setup
```bash
aws ecs create-cluster --cluster-name trustedcars-prod

# Create task definition (see ecs-task-definition.json)
# Create service with ALB integration
```

### Option 2: DigitalOcean Deployment

#### 2.1 Droplet Setup
```bash
# Create 3 droplets (2 CPU, 4GB RAM each)
# - trustedcars-api-01
# - trustedcars-api-02
# - trustedcars-worker-01

# Install Docker on each
curl -fsSL https://get.docker.com | sh
```

#### 2.2 Managed Database
```bash
# Create via DigitalOcean Dashboard:
# - PostgreSQL 15 (2 vCPU, 4GB RAM, 50GB disk)
# - Enable connection pooling (PgBouncer)
# - Enable automated backups (daily)
```

#### 2.3 Managed Redis
```bash
# Create via DigitalOcean Dashboard:
# - Redis 7 (2 vCPU, 4GB RAM)
# - Enable eviction policy: allkeys-lru
```

#### 2.4 Spaces (S3-compatible)
```bash
# Create Space via Dashboard: trustedcars-images
# Enable CDN
# Generate access keys
```

#### 2.5 Load Balancer
```bash
# Create via DigitalOcean Dashboard:
# - Add API droplets to backend pool
# - Configure health checks: /health/live
# - Enable SSL (Let's Encrypt)
# - Configure sticky sessions (cookie-based)
```

### Option 3: Docker Swarm (Self-Hosted)

```bash
# Initialize swarm
docker swarm init

# Deploy stack
docker stack deploy -c docker-compose.yml -c docker-compose.prod.yml trustedcars

# Scale services
docker service scale trustedcars_api=3
docker service scale trustedcars_worker=2
```

---

## Database Setup

### 1. Create Database
```bash
# Connect to PostgreSQL
psql -h <database-host> -U postgres

# Create user and database
CREATE USER trustedcars_prod WITH PASSWORD '<secure-password>';
CREATE DATABASE trustedcars_prod OWNER trustedcars_prod;

# Grant privileges
GRANT ALL PRIVILEGES ON DATABASE trustedcars_prod TO trustedcars_prod;

# Enable extensions
\c trustedcars_prod
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";  -- For similarity searches
```

### 2. Run Migrations
```bash
# From deployment machine
cd backend

# Set DATABASE_URL
export DATABASE_URL="postgresql+asyncpg://trustedcars_prod:<password>@<host>:5432/trustedcars_prod?ssl=require"

# Run migrations
alembic upgrade head

# Verify migration
alembic current
```

### 3. Create Partitions (for audit_logs and outbox_events)
```sql
-- Create monthly partitions for audit_logs (next 6 months)
CREATE TABLE audit_logs_2024_07 PARTITION OF audit_logs
FOR VALUES FROM ('2024-07-01') TO ('2024-08-01');

CREATE TABLE audit_logs_2024_08 PARTITION OF audit_logs
FOR VALUES FROM ('2024-08-01') TO ('2024-09-01');

-- Repeat for 6 months

-- Create weekly partitions for outbox_events (next 4 weeks)
CREATE TABLE outbox_events_2024_w27 PARTITION OF outbox_events
FOR VALUES FROM ('2024-07-01') TO ('2024-07-08');

-- Repeat for 4 weeks
```

### 4. Seed Demo Users (Optional for staging)
```bash
python seed_demo_users.py
```

---

## Application Deployment

### 1. Build and Push Docker Image

```bash
# Authenticate with Docker registry
docker login <registry>

# Build image
cd backend
docker build -t trustedcars-api:${VERSION} .

# Tag for registry
docker tag trustedcars-api:${VERSION} <registry>/trustedcars-api:${VERSION}
docker tag trustedcars-api:${VERSION} <registry>/trustedcars-api:latest

# Push to registry
docker push <registry>/trustedcars-api:${VERSION}
docker push <registry>/trustedcars-api:latest
```

### 2. Configure Environment Variables

**AWS Secrets Manager:**
```bash
# Store secrets
aws secretsmanager create-secret --name trustedcars/jwt-secret --secret-string "<jwt-secret>"
aws secretsmanager create-secret --name trustedcars/database-url --secret-string "<database-url>"
aws secretsmanager create-secret --name trustedcars/redis-url --secret-string "<redis-url>"
# ... repeat for all secrets
```

**Environment File (.env.production):**
```bash
ENVIRONMENT=production
DATABASE_URL=<from-secrets-manager>
REDIS_URL=<from-secrets-manager>
SECRET_KEY=<from-secrets-manager>
JWT_SECRET_KEY=<from-secrets-manager>
MFA_ENCRYPTION_KEY=<from-secrets-manager>
RESEND_API_KEY=<from-secrets-manager>
S3_BUCKET_NAME=trustedcars-prod-images
AWS_REGION=us-east-1
CORS_ORIGINS=https://trustedcars.com,https://www.trustedcars.com
SENTRY_DSN=<sentry-dsn>
METRICS_PASSWORD=<secure-password>
DATABASE_POOL_SIZE=50
DATABASE_MAX_OVERFLOW=100
```

### 3. Deploy Application

**AWS ECS:**
```bash
# Update task definition
aws ecs register-task-definition --cli-input-json file://ecs-task-definition.json

# Update service
aws ecs update-service \
  --cluster trustedcars-prod \
  --service trustedcars-api \
  --task-definition trustedcars-api:latest \
  --force-new-deployment
```

**Docker Swarm:**
```bash
docker stack deploy -c docker-compose.yml -c docker-compose.prod.yml trustedcars
```

**Manual (Droplets):**
```bash
# On each API droplet
docker pull <registry>/trustedcars-api:latest
docker stop trustedcars-api || true
docker rm trustedcars-api || true
docker run -d \
  --name trustedcars-api \
  --restart unless-stopped \
  --env-file .env.production \
  -p 8000:8000 \
  <registry>/trustedcars-api:latest

# On worker droplet
docker pull <registry>/trustedcars-api:latest
docker stop trustedcars-worker || true
docker rm trustedcars-worker || true
docker run -d \
  --name trustedcars-worker \
  --restart unless-stopped \
  --env-file .env.production \
  <registry>/trustedcars-api:latest \
  python worker_main.py
```

### 4. Verify Deployment

```bash
# Check health endpoint
curl https://api.trustedcars.com/health/live
curl https://api.trustedcars.com/health/ready

# Check metrics (with basic auth)
curl -u admin:<metrics-password> https://api.trustedcars.com/metrics

# Check logs
docker logs trustedcars-api --tail 100 -f
```

---

## Post-Deployment

### 1. Configure CDN
```bash
# CloudFlare
# - Add DNS records (A/CNAME)
# - Enable proxy (orange cloud)
# - Configure caching rules
# - Enable HTTPS (Full Strict)
# - Enable Web Application Firewall (WAF)
```

### 2. Set Up Monitoring

**CloudWatch (AWS):**
```bash
# Create log groups
aws logs create-log-group --log-group-name /ecs/trustedcars-api
aws logs create-log-group --log-group-name /ecs/trustedcars-worker

# Create alarms
aws cloudwatch put-metric-alarm \
  --alarm-name trustedcars-high-error-rate \
  --alarm-description "API error rate > 5%" \
  --metric-name HTTPCode_Target_5XX_Count \
  --namespace AWS/ApplicationELB \
  --statistic Sum \
  --period 300 \
  --threshold 50 \
  --comparison-operator GreaterThanThreshold
```

**Datadog:**
```bash
# Install Datadog agent on each host
DD_API_KEY=<datadog-api-key> DD_SITE="datadoghq.com" bash -c "$(curl -L https://s3.amazonaws.com/dd-agent/scripts/install_script.sh)"

# Configure integration
# - Add PostgreSQL integration
# - Add Redis integration
# - Add Docker integration
```

### 3. Configure Alerts

**PagerDuty:**
- API error rate > 5%
- Response time p95 > 1s
- Database connection pool exhausted
- Redis connection failures
- Worker backlog > 1000 events
- Disk usage > 80%
- Memory usage > 85%

### 4. Set Up Backups

**Database Backups:**
```bash
# Automated (AWS RDS): Already configured (30-day retention)

# Manual backup script
#!/bin/bash
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
pg_dump $DATABASE_URL | gzip > /backups/trustedcars_$TIMESTAMP.sql.gz

# Upload to S3
aws s3 cp /backups/trustedcars_$TIMESTAMP.sql.gz s3://trustedcars-backups/database/

# Cleanup old backups (keep 30 days)
find /backups -name "trustedcars_*.sql.gz" -mtime +30 -delete
```

**Application Backups:**
- Docker images: Stored in registry (versioned)
- Configuration: Stored in Git (version controlled)
- Secrets: Stored in secrets manager (versioned)

---

## Monitoring & Maintenance

### Daily Checks
- [ ] Review error logs (Sentry dashboard)
- [ ] Check API response times (CloudWatch/Datadog)
- [ ] Review failed background jobs (outbox_events status)
- [ ] Check disk usage
- [ ] Review user-reported issues

### Weekly Tasks
- [ ] Review security alerts
- [ ] Analyze slow queries (pg_stat_statements)
- [ ] Check database growth trends
- [ ] Review autoscaling metrics
- [ ] Update dependencies (security patches)

### Monthly Tasks
- [ ] Rotate credentials (database, Redis, API keys)
- [ ] Review access logs for anomalies
- [ ] Analyze cost trends
- [ ] Performance optimization review
- [ ] Capacity planning review

### Quarterly Tasks
- [ ] Disaster recovery drill
- [ ] Security audit
- [ ] Load testing
- [ ] Review and update runbooks
- [ ] Team training on new features

---

## Rollback Procedures

### Immediate Rollback (< 5 minutes)

**AWS ECS:**
```bash
# Rollback to previous task definition
aws ecs update-service \
  --cluster trustedcars-prod \
  --service trustedcars-api \
  --task-definition trustedcars-api:<previous-version> \
  --force-new-deployment
```

**Docker Swarm:**
```bash
# Rollback service
docker service rollback trustedcars_api
```

**Manual:**
```bash
# Pull previous version
docker pull <registry>/trustedcars-api:<previous-version>

# Stop current
docker stop trustedcars-api

# Start previous
docker run -d --name trustedcars-api <registry>/trustedcars-api:<previous-version>
```

### Database Rollback

```bash
# Rollback migration (if safe)
alembic downgrade -1

# Restore from backup (if necessary)
# CAUTION: This will cause downtime
psql $DATABASE_URL < /backups/trustedcars_<timestamp>.sql.gz
```

---

## Troubleshooting

### Common Issues

#### Issue: API not responding
```bash
# Check container status
docker ps -a | grep trustedcars

# Check logs
docker logs trustedcars-api --tail 100

# Check health endpoint
curl http://localhost:8000/health/live

# Common causes:
# - Database connection failure
# - Redis connection failure
# - Out of memory
# - Port already in use
```

#### Issue: Database connection errors
```bash
# Check database status
psql $DATABASE_URL -c "SELECT 1"

# Check connection pool
# Look for: "pool size exceeded" in logs

# Check database locks
SELECT * FROM pg_stat_activity WHERE state = 'active';

# Kill long-running queries (if safe)
SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE query LIKE '%...%';
```

#### Issue: High memory usage
```bash
# Check memory usage
docker stats trustedcars-api

# Check for memory leaks
# Look for constantly increasing memory usage

# Restart container (temporary fix)
docker restart trustedcars-api

# Permanent fix: Investigate code for leaks
```

#### Issue: Worker not processing events
```bash
# Check worker logs
docker logs trustedcars-worker --tail 100

# Check pending events
psql $DATABASE_URL -c "SELECT COUNT(*) FROM outbox_events WHERE status = 'pending';"

# Restart worker
docker restart trustedcars-worker

# Check for failed events
psql $DATABASE_URL -c "SELECT * FROM outbox_events WHERE status = 'failed' ORDER BY created_at DESC LIMIT 10;"
```

---

## Emergency Contacts

- **On-Call Engineer**: <phone>
- **DevOps Lead**: <phone>
- **CTO**: <phone>
- **PagerDuty**: <link>
- **Status Page**: <link>

---

## Additional Resources

- [Security Documentation](./backend/SECURITY.md)
- [API Documentation](https://api.trustedcars.com/docs)
- [Monitoring Dashboard](https://datadog.com/trustedcars)
- [Incident Response Runbook](./INCIDENTS.md)
- [Architecture Diagram](./docs/architecture.md)
