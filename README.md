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

> **🚧 Active Development** — Core architecture and infrastructure are fully implemented. A number of features are actively being wired up and tested. The engineering patterns, system design, and backend services reflect production-quality thinking throughout. Contributions and feedback welcome.

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
| **Containers** | Docker + Docker Compose | Reproducible local stack |
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

### Prerequisites

| Tool | Version |
|---|---|
| Python | 3.11 |
| Node.js | 18+ |
| Docker + Docker Compose | Latest stable |

---

### 1 — Start infrastructure with Docker

```bash
cd backend

# Spin up Postgres, Redis, MinIO and auto-create the S3 bucket
docker compose up db redis minio minio-init -d
```

---

### 2 — Backend

```bash
cd backend

python -m venv .venv && source .venv/bin/activate

pip install -r requirements.txt

# Set up environment (see section below)
cp .env.production.example .env
# Edit .env with your values

# Run all migrations
alembic upgrade head

# Start the API with hot reload
uvicorn app.main:app --reload --port 8000
```

API → `http://localhost:8000`
Interactive docs → `http://localhost:8000/docs`

---

### 3 — Frontend

```bash
cd frontend

npm install

# Create env file
echo "VITE_API_URL=http://localhost:8000" > .env

npm run dev
```

App → `http://localhost:5173`

---

### Full stack via Docker Compose

```bash
cd backend

docker compose up --build

# Apply migrations once running
docker compose exec api alembic upgrade head
```

| Service | URL / Port |
|---|---|
| API | `http://localhost:8000` |
| API Docs | `http://localhost:8000/docs` |
| PostgreSQL | `localhost:5432` |
| PgBouncer | `localhost:6432` |
| Redis | `localhost:6380` |
| MinIO Storage | `http://localhost:9000` |
| MinIO Console | `http://localhost:9001` |

> MinIO dev credentials: `minioadmin` / `minioadmin`

---

## ⚙️ Environment Variables

### Backend — `.env`

```env
# Database
DATABASE_URL=postgresql+asyncpg://trustedcars_user:trustedcars_password@localhost:5432/trustedcars_db

# Redis
REDIS_URL=redis://localhost:6379/0

# Secrets (generate with: openssl rand -hex 32)
SECRET_KEY=
JWT_SECRET_KEY=
MFA_ENCRYPTION_KEY=

# Storage — MinIO for dev, AWS S3 for prod
S3_BUCKET_NAME=trustedcars-images
AWS_ACCESS_KEY_ID=minioadmin
AWS_SECRET_ACCESS_KEY=minioadmin
AWS_REGION=us-east-1
S3_ENDPOINT_URL=http://localhost:9000    # Remove this line for AWS S3

# Email
RESEND_API_KEY=re_xxxxxxxxxxxx

# Observability (optional in dev)
SENTRY_DSN=
METRICS_PASSWORD=

# CORS
CORS_ORIGINS=["http://localhost:5173"]

# App
ENVIRONMENT=development
```

### Frontend — `.env`

```env
VITE_API_URL=http://localhost:8000
VITE_SENTRY_DSN=
```

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

## 🧪 Code Quality & CI

Every pull request to `main` runs:

```
✔ black     — Python code formatting
✔ ruff      — Python linting
✔ mypy      — Python type checking
✔ alembic check — Migration drift detection
✔ pytest    — Backend test suite
```

Frontend type checking:
```bash
cd frontend && npx tsc --noEmit
```

---

## 🗺️ Roadmap

The following is actively being worked on:

- [ ] **Fix 7 critical bugs** identified in full audit (see `FULL_PROJECT_AUDIT.md`)
  - Backend startup crash (missing `audit_logs.py` stub)
  - Registration OTP flow navigation fix
  - Car listing photo upload fix (`newCar.id` assignment)
  - Inquiry/Review `/me` endpoints on backend
  - Inquiry close URL correction
  - Dealer role access to dashboard
- [ ] `POST /auth/resend` endpoint + resend OTP on frontend
- [ ] Conversation drawer UI in Inquiries tab
- [ ] Dealer registration form fields
- [ ] Frontend type generation from OpenAPI spec
- [ ] `vitest` unit + integration tests for frontend
- [ ] `pytest` integration tests for auth and listing flows
- [ ] Redis healthcheck in Docker Compose
- [ ] CI secrets scanning (Gitleaks / TruffleHog)

---

## 📊 Project Stats

| Metric | Count |
|---|---|
| Backend modules | 9 feature modules + shared layer |
| API endpoints | 50+ |
| Alembic migrations | 30+ |
| Frontend feature slices | 6 |
| Docker services | 7 (api, worker, db, pgbouncer, redis, minio, minio-init) |
| GitHub Actions workflows | 3 (CI, deploy, security) |

---

<div align="center">

Built with intent. Engineered to learn from.

</div>
