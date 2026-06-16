# TrustedCars

> Buy & sell pre-owned cars — transparently.

A production-grade marketplace for certified pre-owned cars. Every car is
200-point inspected, comes with a 6-month warranty, and a 7-day money-back
guarantee. Built around a trust layer: **list → inspect → browse → checkout →
handover**.

| Layer | Stack |
|---|---|
| Frontend | React 19, Vite 7, TypeScript, Tailwind CSS v4, React Router |
| Backend | Node.js, Express 5, Zod, JWT (httpOnly cookies), Multer |
| Database | PostgreSQL 16 (with an in-memory fallback for instant local runs) |
| Infra | Docker, Docker Compose, Nginx |

---

## Quick start

### Frontend only (demo mode, no backend)

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # outputs dist/index.html (single-file bundle)
```

The SPA ships with realistic demo data (cars, cities, users) so it works
fully without a running backend.

### Full stack with Docker Compose

```bash
cp backend/.env.example backend/.env   # then edit secrets
docker compose up --build
```

This brings up **PostgreSQL** (auto-loads schema + seed), the **API** on
`http://localhost:4000`, and the **web** app on `http://localhost:5173`.

### Backend without Docker

```bash
cp backend/.env.example .env           # set DATABASE_URL or leave blank for in-memory
node backend/src/server.js
```

If `DATABASE_URL` is empty the API runs against an in-memory store seeded with
demo data. Set it to use PostgreSQL (apply `backend/db/schema.sql` first).

---

## Demo accounts

| Phone | Password | OTP | Role |
|---|---|---|---|
| +919876543210 | demo1234 | 123456 | Buyer |
| +919876543211 | demo1234 | 123456 | Seller |
| +919876543212 | demo1234 | 123456 | Admin |

---

## Architecture

```
.
├── src/                      # React SPA
│   ├── components/           # Header, Footer, CarCard, ScoreRing, ErrorBoundary, Skeletons, Toast
│   ├── pages/                # Home, Cars, CarDetail, Sell, Checkout, Dashboard, Admin, Chat, Auth, Support, City, Inspection, NotFound
│   ├── context/              # AuthContext (session, roles)
│   ├── lib/                  # api.ts (typed client), config.ts
│   └── data/                 # demo cars & cities
├── backend/
│   ├── src/
│   │   ├── routes/           # auth, cars, cities, inspections, checkout, dashboard, admin, support, chat
│   │   ├── services/         # auth, car, payment, fraud, notification
│   │   ├── middleware/       # auth (JWT/RBAC), validate, requestLogger
│   │   ├── config.js, db.js, errors.js, logger.js, server.js, app.js
│   └── db/                   # schema.sql, seed.sql
├── Dockerfile                # frontend (build → nginx)
├── nginx.conf                # SPA fallback + gzip + cache + security headers
├── backend/Dockerfile        # API container
└── docker-compose.yml        # db + api + web
```

---

## Production readiness

**Frontend**
- `ErrorBoundary` catches render crashes with a recoverable fallback.
- Centralised typed API client (`src/lib/api.ts`) with timeouts, envelope
  unwrapping, and uniform `ApiError`s.
- Proper 404 route, loading skeletons, toast notifications, and a no-JS
  fallback (`<noscript>`).
- Branded favicon, Open Graph / Twitter cards, JSON-LD, preconnect hints.
- Role-based protected routes (`buyer`, `seller`, `admin`).

**Backend**
- Helmet (security headers), CORS, cookie parsing, JSON body limits.
- Global rate limiting + per-request id propagated on every response.
- Structured logging (pretty in dev, JSON in prod) and graceful shutdown
  (`SIGTERM`/`SIGINT`) that drains the HTTP server and DB pool.
- Zod request validation, centralised error envelope, JWT access/refresh
  tokens in httpOnly cookies, RBAC middleware.
- Health check at `GET /health`.

**Ops**
- Multi-stage Dockerfiles (slim runtime images).
- Nginx with SPA history fallback, asset fingerprinting cache, gzip and
  security headers.
- Compose with a Postgres healthcheck and DB auto-initialisation.

---

## API overview

Base URL: `/api/v1`. Auth uses httpOnly cookies (`tc_access`, `tc_refresh`).

| Module | Endpoints |
|---|---|
| Auth | register, login, otp/send, otp/verify, google, refresh, logout, me |
| Cars | search (faceted), featured, recent, compare, detail, create, images, wishlist, moderate |
| Cities | list, detail, update |
| Inspections | book, tracking, report, report/pdf, checklist |
| Checkout | documents, token, full-payment, confirm, order |
| Dashboard | overview, saved-searches, notifications |
| Admin | metrics, moderation, kyc, fraud, inspectors, cities |
| Support | faqs, tickets, callback |
| Chat | rooms, messages |

See `backend/README.md` for the full endpoint reference.

---

## Integrations (stubs, ready to swap)

The backend ships clean seams for production providers — replace the mock
service internals with provider SDK calls:

- **Phone OTP** — `notification.service.js#sendSms`
- **Email** — `notification.service.js#sendEmail`
- **Cloudinary** image URLs — `car.service.js#addCarImage`
- **Razorpay** orders/payments — `payment.service.js`
- **Google OAuth** token exchange — `auth.service.js#googleOAuth`
- **Fraud scoring** rules engine — `fraud.service.js`

---

## Environment variables

Frontend (`.env`): `VITE_API_URL`, `VITE_DEMO_MODE`
Backend (`backend/.env`): see `backend/.env.example` — `DATABASE_URL`,
`JWT_SECRET`, `CORS_ORIGIN`, `COOKIE_SECURE`, `RAZORPAY_*`, `CLOUDINARY_*`.

---

## Scripts

```bash
npm run dev        # Vite dev server
npm run build      # Production build (single-file dist/index.html)
npm run preview    # Preview the production build
node backend/src/server.js   # Run the API
```

## License

Proprietary © TrustedCars Mobility Pvt. Ltd.
