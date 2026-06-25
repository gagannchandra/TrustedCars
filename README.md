<div align="center">

# 🚗 TrustedCars

### A production-grade car marketplace — built with modern engineering practices

[![Status](https://img.shields.io/badge/Status-In%20Active%20Development-orange?style=flat-square)](.)
[![Backend](https://img.shields.io/badge/Backend-FastAPI%20%2B%20Python%203.11-009688?style=flat-square&logo=fastapi)](.)
[![Frontend](https://img.shields.io/badge/Frontend-React%2019%20%2B%20TypeScript-3178C6?style=flat-square&logo=react)](.)
[![Database](https://img.shields.io/badge/Database-PostgreSQL%2015-4169E1?style=flat-square&logo=postgresql)](.)
[![CI](https://img.shields.io/badge/CI-GitHub%20Actions-2088FF?style=flat-square&logo=githubactions)](.)

</div>

---

> **✅ Production Ready** — This codebase is production-ready with all core features implemented, security hardened, and deployment configurations in place. See [PRODUCTION_DEPLOYMENT.md](PRODUCTION_DEPLOYMENT.md) for deployment instructions.

---

## What is TrustedCars?

TrustedCars is a full-stack vehicle marketplace where private sellers and verified dealerships list cars for sale, buyers browse and message sellers, and an admin team moderates content. Think AutoTrader or Cars.com — built from scratch with a focus on clean architecture, security, and scalability.

The project is intentionally engineered beyond what a simple CRUD app requires — it explores patterns like the **Transactional Outbox**, **event-driven service coordination**, **cursor-based pagination**, **PostgreSQL table partitioning**, and **zero-password authentication** that you'd find in a real production platform.

---

## ✨ Feature Overview

<table>
<tr><td width="33%" valign="top">

**🔐 Authentication**
- Passwordless login via email OTP
- TOTP-based MFA with encrypted secrets
- JWT in httpOnly cookies + Redis refresh token rotation
- Forgot password with expiring OTP tokens
- Per-request correlation ID tracing

</td><td width="33%" valign="top">

**🚗 Marketplace**
- Browse & search with rich filters (make, model, year, price, fuel type, transmission, body type, city)
- Multi-step listing creation with S3 photo upload
- Soft-delete with audit trail
- Content moderation pipeline (pending → approved / rejected)
- Dealer profiles and storefront pages

</td><td width="33%" valign="top">

**💬 Engagement**
- Buyer–seller inquiry threads with cursor-paginated messages
- Wishlisting with batch hydration
- Seller reviews and ratings
- Real-time admin moderation dashboard
- Prometheus metrics + structured logging

</td></tr>
</table>

---

## 🏗️ Architecture & Engineering Highlights

These are the design decisions that go beyond a standard tutorial stack:

### Transactional Outbox Pattern
Cross-service side effects (e.g. cascade-delete a seller's listings when their account is deleted) are handled through a **Transactional Outbox**. Events are written to an `outbox_events` table *inside the same database transaction* as the triggering action, then picked up by a dedicated `AsyncOutboxWorker` that fans out to registered subscribers. This guarantees no events are lost if the app crashes between the DB write and the side-effect.

```
Request → DB write + OutboxEvent (one transaction)
              ↓
         AsyncOutboxWorker polls outbox
              ↓
         Subscribers: auth/cars/inquiries services react
```

### Event-Driven Service Coordination
An in-process `EventBus` decouples modules. When a user is suspended by an admin, the auth, cars, and inquiry services each react independently — no direct service-to-service calls, no shared state.

```
admin suspends user
  → event_bus.publish("USER_SUSPENDED")
      → auth_service.handle_user_suspended()    # revokes all tokens
      → cars_service.handle_dealer_suspended()  # unpublishes listings
```

### PostgreSQL Partitioning
The two highest-write tables — `audit_logs` and `outbox_events` — are **range-partitioned by `created_at`**. This keeps table scans fast as data grows and enables cheap partition drops for data retention policies, without touching application query logic.

### Cursor-Based Pagination
Inquiry message threads use **datetime cursor pagination** instead of `OFFSET`. This avoids the classic N+1 skip problem and keeps response times consistent regardless of history depth.

### Connection Pooling via PgBouncer
All API and worker connections route through **PgBouncer in transaction-mode pooling**. Async FastAPI handlers hold a DB connection only during the actual query, not for the lifetime of the request — critical for high-concurrency async workloads.

### Partial Indexes for Search Performance
The cars search path uses **PostgreSQL partial indexes** scoped to active, approved, non-deleted listings — the only subset queries ever filter on. Index size stays small and query plans skip irrelevant rows entirely.

```sql
CREATE INDEX ix_cars_active_make ON cars (make, asking_price)
  WHERE status = 'active'
    AND moderation_status = 'approved'
    AND deleted_at IS NULL;
```

### Security-First Auth Design
- Passwords are never used for login — email OTP only
- MFA secrets are **AES-encrypted at rest** with a separate `MFA_ENCRYPTION_KEY`
- Refresh tokens are **hashed before storage** (plaintext never persisted)
- Security headers (HSTS, CSP, X-Frame-Options, X-Content-Type-Options) applied as middleware
- Rate limiting backed by Redis (SlowAPI) with IP + user-ID keying
- All admin actions written to a tamper-evident audit log with correlation IDs

---

## 🛠️ Tech Stack

| Layer | Technology | Why |
|---|---|---|
| **Frontend** | React 19 + TypeScript + Vite 7 | Type-safe, fast HMR, modern JSX transform |
| **Styling** | TailwindCSS v4 | Utility-first, zero runtime |
| **State** | Zustand 5 + TanStack Query v5 | Lightweight global state + server state cache |
| **Forms** | React Hook Form + Zod v4 | Schema-validated, uncontrolled forms |
| **Backend** | FastAPI + Python 3.11 | Async-native, automatic OpenAPI, Pydantic v2 |
| **ORM** | SQLAlchemy 2.0 async | Full async, mapped columns, typed models |
| **Database** | PostgreSQL 15 | Partitioning, partial indexes, JSONB |
| **Pool** | PgBouncer | Transaction-mode connection multiplexing |
| **Cache** | Redis 7 | Refresh tokens, rate limiting, sessions |
| **Migrations** | Alembic | Schema versioning with autogenerate |
| **Storage** | MinIO (dev) / AWS S3 (prod) | S3-compatible, presigned URLs |
| **Email** | Resend API | OTP and transactional email delivery |
| **Auth** | PyJWT + pyotp | httpOnly cookies, TOTP MFA |
| **Monitoring** | Sentry + Prometheus + structlog | Error tracking, metrics, structured logs |
| **Development** | Native services | PostgreSQL, Redis, MinIO installed locally |
| **Deployment** | Docker (optional) | Container images for production (CI/CD, Kubernetes, ECS) |
| **CI** | GitHub Actions | Lint, type-check, migration drift, tests |

---

## 📁 Project Structure

```
TrustedCars/
├── frontend/
│   └── src/
│       ├── app/                  # Router, providers, global layout
│       ├── features/             # Feature-sliced vertical modules
│       │   ├── auth/             # Login, Register, OTP, MFA, Forgot Password
│       │   ├── cars/             # Browse, search, detail page
│       │   ├── sell/             # Multi-step listing form + photo upload
│       │   ├── dashboard/        # Seller: listings, inquiries, reviews
│       │   └── admin/            # Moderation panel
│       ├── shared/
│       │   ├── api/              # Axios instance + fully typed API client
│       │   └── hooks/            # useAuth, useWishlist, useDebounce …
│       ├── store/                # Zustand auth store (persisted)
│       └── types/                # Shared TypeScript interfaces
│
└── backend/
    ├── app/
    │   ├── core/                 # Config, security, event bus, middleware, metrics
    │   ├── db/                   # Async session factory, Redis client, base model
    │   ├── bootstrap/            # Event subscriber registration at startup
    │   ├── modules/              # Vertical feature modules
    │   │   ├── auth/             # OTP, MFA, JWT, refresh tokens
    │   │   ├── cars/             # Listings, search, soft-delete
    │   │   ├── images/           # S3 upload, presigned URLs
    │   │   ├── inquiries/        # Threads, cursor-paginated messages
    │   │   ├── reviews/          # Ratings, moderation
    │   │   ├── users/            # Profile, settings
    │   │   ├── wishlist/         # Batch hydration
    │   │   └── admin/            # Moderation, stats, audit
    │   └── shared/
    │       ├── audit/            # Audit log model, service, partitioned table
    │       ├── email/            # Resend API client
    │       └── dependencies/     # Auth guards, role checks
    └── alembic/                  # 30+ migration files with full history
```

---

## 🚀 Getting Started

> **Note:** TrustedCars uses **native service installation** for local development — **Docker is NOT required**. This provides direct access to services for debugging, faster iteration, and simpler troubleshooting. Docker is kept as an **optional deployment target** for production use (CI/CD, Kubernetes, ECS, etc.).

TrustedCars uses native service installation for local development (no Docker required). This provides direct access to services for debugging and faster iteration.

See [PRODUCTION_DEPLOYMENT.md](PRODUCTION_DEPLOYMENT.md) for production deployment guide.

### Prerequisites

| Tool | Version | Purpose |
|---|---|---|
| Python | 3.11+ | Backend runtime |
| Node.js | 18+ | Frontend tooling |
| PostgreSQL | 15 | Database |
| Redis | 7 | Session storage & rate limiting |
| MinIO | Latest | S3-compatible storage (or AWS S3) |

---

## Local Development Setup

TrustedCars runs entirely with native services — no Docker required for local development. This approach provides:

- **Direct database access** for debugging and query optimization
- **Faster startup times** without container overhead
- **Native tooling** integration (psql, redis-cli, etc.)
- **Simplified development** with familiar service management

### Step 1: Install Native Services

You'll need three services running locally: PostgreSQL 15, Redis 7, and MinIO (S3-compatible storage).

**📚 Platform-Specific Instructions:**

Detailed installation guides with troubleshooting for your platform:
- [docs/NATIVE_SETUP.md](docs/NATIVE_SETUP.md) — Complete instructions for **macOS**, **Linux (Ubuntu/Debian)**, and **Windows**

**Quick Installation (macOS with Homebrew):**

```bash
# Install services
brew install postgresql@15 redis minio/stable/minio minio/stable/mc

# Start PostgreSQL and Redis services
brew services start postgresql@15
brew services start redis

# Configure PostgreSQL
createuser -s trustedcars_user
psql postgres -c "ALTER USER trustedcars_user WITH PASSWORD 'trustedcars_password';"
createdb -O trustedcars_user trustedcars_db

# Configure Redis with password authentication
echo "requirepass redis_password" >> /opt/homebrew/etc/redis.conf
brew services restart redis

# Start MinIO (in separate terminal or background)
mkdir -p ~/minio/data
minio server ~/minio/data --console-address :9001 &

# Create MinIO bucket for image storage
mc alias set local http://localhost:9000 minioadmin minioadmin
mc mb local/trustedcars-images
mc anonymous set download local/trustedcars-images
```

**Verify Installation:**

```bash
# PostgreSQL
psql -U trustedcars_user -d trustedcars_db -h localhost -c "SELECT 1;"
# Should output: 1

# Redis
redis-cli -a redis_password ping
# Should output: PONG

# MinIO
curl http://localhost:9000/minio/health/live
# Should output: 200 OK
```

For **Linux**, **Windows**, or detailed troubleshooting, see [docs/NATIVE_SETUP.md](docs/NATIVE_SETUP.md).

---

### Step 2: Configure Backend

```bash
cd backend

# Create Python virtual environment
python3.11 -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment (native localhost connections)
cat > .env << 'EOF'
ENVIRONMENT=development
DATABASE_URL=postgresql+asyncpg://trustedcars_user:trustedcars_password@localhost:5432/trustedcars_db
REDIS_URL=redis://:redis_password@localhost:6379/0
SECRET_KEY=$(openssl rand -hex 32)
JWT_SECRET_KEY=$(openssl rand -hex 32)
MFA_ENCRYPTION_KEY=$(openssl rand -hex 32)
S3_BUCKET_NAME=trustedcars-images
AWS_ACCESS_KEY_ID=minioadmin
AWS_SECRET_ACCESS_KEY=minioadmin
AWS_REGION=us-east-1
S3_ENDPOINT_URL=http://localhost:9000
RESEND_API_KEY=your_resend_api_key_here
CORS_ORIGINS=["http://localhost:5173"]
SERVE_FRONTEND=false
EOF

# Run database migrations
alembic upgrade head
```

---

### Step 3: Configure Frontend

```bash
cd frontend

# Install dependencies
npm install

# Configure environment (optional - has sensible defaults)
echo "VITE_API_URL=http://localhost:8000" > .env.development
```

---

## Development Modes

TrustedCars supports **two development workflows** to match different stages of development:

### 🔥 Mode 1: Separate Servers (Hot Module Replacement)

**Best for:** Active frontend development with instant updates

This mode runs the Vite dev server separately, giving you Hot Module Replacement (HMR) for instant feedback on code changes. The Vite dev server automatically proxies API requests to the backend.

**Start the services:**

**Terminal 1 - Backend API:**
```bash
cd backend
source .venv/bin/activate  # Windows: .venv\Scripts\activate
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

**Terminal 2 - Frontend Dev Server:**
```bash
cd frontend
npm run dev
```

**Terminal 3 - Background Worker:**
```bash
cd backend
source .venv/bin/activate  # Windows: .venv\Scripts\activate
python worker_main.py
```

**Access Points:**
- **Frontend (with HMR):** http://localhost:5173
- **Backend API:** http://localhost:8000
- **API Docs:** http://localhost:8000/docs
- **MinIO Console:** http://localhost:9001

**✅ Benefits:**
- ⚡ **Instant frontend updates** — changes appear in browser without page reload
- 🔍 **Full TypeScript type checking** — catch errors during development
- 🛠️ **React DevTools support** — inspect component state and props
- 🔄 **Automatic API proxying** — Vite forwards `/api/*` requests to backend

**When to use:** Day-to-day frontend development, UI iteration, component work

---

### 🚀 Mode 2: Integrated (Production-Like)

**Best for:** Testing production build, validating static file serving, pre-deployment checks

This mode serves the built frontend from the FastAPI backend — exactly how it runs in production. Use this to test the optimized build, verify asset paths, and ensure everything works together.

**Build and start:**

**Terminal 1 - Build Frontend:**
```bash
cd frontend
npm run build
# Creates frontend/dist with optimized assets
```

**Terminal 2 - Start Backend with Frontend:**
```bash
cd backend
export SERVE_FRONTEND=true  # Windows: set SERVE_FRONTEND=true
source .venv/bin/activate  # Windows: .venv\Scripts\activate
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

**Terminal 3 - Background Worker:**
```bash
cd backend
source .venv/bin/activate  # Windows: .venv\Scripts\activate
python worker_main.py
```

**Access Points:**
- **Integrated App:** http://localhost:8000 (serves both frontend + API)
- **API Docs:** http://localhost:8000/docs
- **MinIO Console:** http://localhost:9001

**✅ Benefits:**
- 🎯 **Production-like environment** — tests exactly how production will run
- 🔗 **Single endpoint** — frontend and API served from same origin
- ⚡ **Optimized assets** — minified JS/CSS with hashed filenames
- 📦 **Cache header validation** — ensure assets cached correctly

**⚠️ When to rebuild frontend:**
- After **any** frontend code changes (changes won't appear until rebuilt)
- Before testing in integrated mode
- Before deploying to production

**When to use:** Pre-deployment validation, testing static file serving, production simulation

---

### 📊 Mode Comparison

| Feature | Separate Servers (Mode 1) | Integrated (Mode 2) |
|---------|---------------------------|---------------------|
| **Frontend Updates** | Instant (HMR) | Manual rebuild required |
| **Setup Complexity** | 3 terminals | 3 terminals + build step |
| **TypeScript Checking** | Full dev-time checking | Build-time only |
| **API Proxying** | Vite dev server | Not needed (same origin) |
| **CORS** | Handled by Vite proxy | Not needed (same origin) |
| **Performance** | Dev build (unoptimized) | Production build (optimized) |
| **Use Case** | Daily development | Pre-deployment testing |

---

## Troubleshooting

Common issues and their solutions when setting up TrustedCars locally.

### 🔴 Services Not Running

**PostgreSQL Connection Failed:**

```bash
# Error: could not connect to server: Connection refused
# Is the server running on host "localhost" (127.0.0.1) and accepting TCP/IP connections on port 5432?

# Solution: Start PostgreSQL service
# macOS:
brew services start postgresql@15

# Linux (Ubuntu/Debian):
sudo systemctl start postgresql
sudo systemctl enable postgresql  # Start on boot

# Windows:
net start postgresql-x64-15

# Verify it's running:
psql -U trustedcars_user -d trustedcars_db -h localhost -c "SELECT 1;"
```

**Redis Connection Failed:**

```bash
# Error: Error connecting to Redis: Connection refused

# Solution: Start Redis service
# macOS:
brew services start redis

# Linux (Ubuntu/Debian):
sudo systemctl start redis-server
sudo systemctl enable redis-server  # Start on boot

# Windows:
net start Redis

# Verify it's running:
redis-cli -a redis_password ping
# Should output: PONG
```

**MinIO Not Accessible:**

```bash
# Error: Could not connect to the endpoint URL: "http://localhost:9000"

# Solution: Start MinIO server
# macOS/Linux:
minio server ~/minio/data --console-address :9001

# Windows:
cd C:\minio
.\minio.exe server C:\minio\data --console-address :9001

# Verify it's running:
curl http://localhost:9000/minio/health/live
# Should return: 200 OK

# Check MinIO Console:
# Open browser: http://localhost:9001
# Login: minioadmin / minioadmin
```

---

### 🔴 Backend Connection Errors

**Database URL Incorrect:**

```bash
# Error: asyncpg.exceptions.InvalidCatalogNameError: database "trustedcars_db" does not exist

# Solution: Create the database
createdb -O trustedcars_user trustedcars_db

# Verify database exists:
psql -U trustedcars_user -d trustedcars_db -h localhost -c "\l"
```

**Redis Password Authentication Failed:**

```bash
# Error: redis.exceptions.AuthenticationError: Authentication required

# Solution: Ensure Redis is configured with password
# Check Redis config (macOS Homebrew):
grep "requirepass" /opt/homebrew/etc/redis.conf
# Should output: requirepass redis_password

# If not set, add it:
echo "requirepass redis_password" >> /opt/homebrew/etc/redis.conf
brew services restart redis

# Verify REDIS_URL in backend/.env matches:
# REDIS_URL=redis://:redis_password@localhost:6379/0
```

**MinIO Bucket Not Found:**

```bash
# Error: botocore.exceptions.ClientError: An error occurred (NoSuchBucket) when calling the PutObject operation: The specified bucket does not exist

# Solution: Create the bucket
mc alias set local http://localhost:9000 minioadmin minioadmin
mc mb local/trustedcars-images
mc anonymous set download local/trustedcars-images

# Verify bucket exists:
mc ls local/
# Should list: trustedcars-images
```

**Environment Variables Not Set:**

```bash
# Error: FastAPI startup fails with "SECRET_KEY not set"

# Solution: Ensure backend/.env exists and has all required variables
cd backend
cat .env  # Verify file exists

# Generate missing secrets:
openssl rand -hex 32  # Copy output to SECRET_KEY, JWT_SECRET_KEY, MFA_ENCRYPTION_KEY
```

---

### 🔴 Frontend Issues

**Frontend Not Loading in Integrated Mode:**

```bash
# Error: RuntimeError: Frontend build directory not found

# Solution: Build the frontend first
cd frontend
npm run build

# Verify dist directory was created:
ls -la dist/
# Should show: index.html, assets/

# Ensure backend/.env has:
# SERVE_FRONTEND=true

# Restart backend:
cd ../backend
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

**Frontend Build Fails:**

```bash
# Error: npm ERR! Missing script: "build"

# Solution: Install frontend dependencies first
cd frontend
npm install

# Then build:
npm run build
```

**API Calls Failing from Frontend Dev Server:**

```bash
# Error: CORS policy: No 'Access-Control-Allow-Origin' header

# Solution: Ensure Vite proxy is configured
# Check frontend/vite.config.ts has proxy:
# proxy: { "/api": { target: "http://localhost:8000", changeOrigin: true } }

# Verify backend is running:
curl http://localhost:8000/health/live

# Verify backend/.env includes:
# CORS_ORIGINS=["http://localhost:5173"]
```

---

### 🔴 Port Conflicts

**Port Already in Use:**

```bash
# Error: OSError: [Errno 48] Address already in use

# Find what's using the port (macOS/Linux):
sudo lsof -i :8000  # Replace 8000 with your port

# Find what's using the port (Windows):
netstat -ano | findstr :8000

# Kill the process:
# macOS/Linux:
kill -9 <PID>

# Windows:
taskkill /PID <PID> /F

# Default ports used by TrustedCars:
# - PostgreSQL: 5432
# - Redis: 6379
# - MinIO API: 9000
# - MinIO Console: 9001
# - Backend API: 8000
# - Frontend Dev Server: 5173
```

---

### 🔴 Database Migration Issues

**Migration Failed:**

```bash
# Error: alembic.util.exc.CommandError: Can't locate revision identified by 'xxxxx'

# Solution: Reset migrations (development only!)
cd backend

# Drop and recreate database:
dropdb -U trustedcars_user trustedcars_db
createdb -O trustedcars_user trustedcars_db

# Run all migrations from scratch:
alembic upgrade head

# Verify current migration:
alembic current
```

**Schema Drift Detected:**

```bash
# Error: Target database is not up to date

# Solution: Apply pending migrations
cd backend
alembic upgrade head

# Check for drift:
alembic check
```

---

### 🔴 Worker Process Issues

**Worker Not Processing Events:**

```bash
# Error: Worker started but events remain in outbox_events table

# Verify worker is running:
# Should see: "Starting AsyncOutboxWorker... Polling interval: 5 seconds"

# Check database connection in worker:
# Verify worker uses same DATABASE_URL as backend

# Check outbox_events table:
psql -U trustedcars_user -d trustedcars_db -h localhost
SELECT id, event_type, status, created_at FROM outbox_events ORDER BY created_at DESC LIMIT 10;

# Restart worker:
# Kill worker process (Ctrl+C) and restart:
cd backend
source .venv/bin/activate
python worker_main.py
```

---

### 📚 Still Having Issues?

For more detailed troubleshooting and platform-specific solutions:

- **[docs/NATIVE_SETUP.md](docs/NATIVE_SETUP.md)** — Complete native service setup guide
- **[docs/DEVELOPMENT.md](docs/DEVELOPMENT.md)** — Development workflow and best practices
- **[PRODUCTION_DEPLOYMENT.md](PRODUCTION_DEPLOYMENT.md)** — Production configuration and deployment

**Check Service Status:**

```bash
# Quick status check script (macOS/Linux)
echo "PostgreSQL:" && psql -U trustedcars_user -d trustedcars_db -h localhost -c "SELECT 1;" 2>&1 | grep -q "1" && echo "✅ Running" || echo "❌ Not running"
echo "Redis:" && redis-cli -a redis_password ping 2>&1 | grep -q "PONG" && echo "✅ Running" || echo "❌ Not running"
echo "MinIO:" && curl -s http://localhost:9000/minio/health/live > /dev/null && echo "✅ Running" || echo "❌ Not running"
```

---

## 🐳 Docker (Optional)

**Docker is NOT required for local development.** The application is designed for native development with services installed directly on your machine.

### When Docker Is Useful

Docker configurations (`backend/Dockerfile` and `backend/docker-compose.yml`) are provided for:

1. **Production Deployments**
   - Container orchestration platforms (Kubernetes, AWS ECS, Google Cloud Run)
   - Self-hosted production infrastructure
   - Consistent deployment artifacts

2. **CI/CD Pipelines**
   - GitHub Actions, GitLab CI, Jenkins
   - Consistent test environments
   - Automated integration testing

3. **Team Preference**
   - Some developers prefer Docker for local development
   - Fully supported but not recommended for daily iteration

### Using Docker Locally (Optional)

If you prefer Docker for local development:

```bash
# Start all services
cd backend
docker-compose up -d

# View logs
docker-compose logs -f api

# Stop all services
docker-compose down
```

**Note:** Docker-based development has slower iteration cycles compared to native development (container rebuilds, volume mounting overhead). We recommend native development for day-to-day work.

### Building Production Images

The Dockerfile is primarily for production deployments:

```bash
# Build production image
docker build -t trustedcars-api:latest backend/

# Run container
docker run -p 8000:8000 --env-file backend/.env trustedcars-api:latest
```

For complete production deployment guide, see [PRODUCTION_DEPLOYMENT.md](PRODUCTION_DEPLOYMENT.md).

---

## ⚙️ Configuration

See [PRODUCTION_DEPLOYMENT.md](PRODUCTION_DEPLOYMENT.md) for complete environment configuration.

### Environment Variables

**Backend** (`.env` in backend directory):

```bash
# Core Settings
ENVIRONMENT=development  # development, staging, production
SERVE_FRONTEND=false     # true to serve built frontend from backend

# Database (native localhost)
DATABASE_URL=postgresql+asyncpg://trustedcars_user:trustedcars_password@localhost:5432/trustedcars_db

# Redis (native localhost)
REDIS_URL=redis://:redis_password@localhost:6379/0
REDIS_PASSWORD=redis_password

# Security Keys (generate with: openssl rand -hex 32)
SECRET_KEY=your_secret_key_here
JWT_SECRET_KEY=your_jwt_secret_here
MFA_ENCRYPTION_KEY=your_mfa_encryption_key_here

# S3 Storage (MinIO for development)
S3_BUCKET_NAME=trustedcars-images
AWS_ACCESS_KEY_ID=minioadmin
AWS_SECRET_ACCESS_KEY=minioadmin
AWS_REGION=us-east-1
S3_ENDPOINT_URL=http://localhost:9000  # Remove for AWS S3 in production

# Email Service
RESEND_API_KEY=your_resend_api_key_here

# CORS (allow frontend dev server)
CORS_ORIGINS=["http://localhost:5173"]
```

**Frontend** (`.env.development` in frontend directory):
```bash
VITE_API_URL=http://localhost:8000  # Backend API endpoint
```

For production AWS S3, remove `S3_ENDPOINT_URL` or set it to empty string.

---

## 🗄️ Database Migrations

```bash
# Apply all migrations
alembic upgrade head

# Generate a new migration from model changes
alembic revision --autogenerate -m "add index on cars.status"

# Roll back one step
alembic downgrade -1

# Verify no schema drift
alembic check
```

---

## 🔌 API Reference

All routes prefixed with `/api/v1`. Full interactive docs at `/docs`.

| Prefix | Feature | Auth |
|---|---|---|
| `POST /auth/register` | Register with OTP | Public |
| `POST /auth/login` | Login with OTP | Public |
| `POST /auth/verify` | Verify OTP code | Public |
| `POST /auth/refresh` | Rotate refresh token | Cookie |
| `POST /auth/mfa/enroll` | Set up TOTP MFA | Bearer |
| `GET /cars` | Search + filter listings | Public |
| `POST /cars` | Create listing | Bearer |
| `POST /cars/{id}/images` | Upload photos to S3 | Owner |
| `GET /inquiries` | List my inquiries | Bearer |
| `POST /inquiries/{id}/messages` | Send message | Bearer |
| `PATCH /inquiries/{id}/close` | Close thread | Seller |
| `GET /wishlist` | My saved cars | Bearer |
| `POST /reviews` | Submit review | Bearer |
| `GET /admin/dashboard` | Platform stats | Admin |
| `PATCH /admin/cars/{id}/moderate` | Approve / reject listing | Admin |

---

## 👥 User Roles

| Role | Capabilities |
|---|---|
| `user` | Browse, wishlist, send inquiries, leave reviews, list cars as private seller |
| `dealer` | Everything above + verified dealership profile + storefront page |
| `admin` | Full moderation, user management, platform settings, audit log access |

---

---

## 📊 Project Stats

| Metric | Count |
|---|---|
| Backend modules | 9 feature modules + shared layer |
| API endpoints | 50+ |
| Alembic migrations | 30+ |
| Frontend feature slices | 6 |
| Native services | 3 (PostgreSQL 15, Redis 7, MinIO/S3) |
| GitHub Actions workflows | 3 (CI, deploy, security) |

---

<div align="center">

Built with intent. Engineered to learn from.

</div>
