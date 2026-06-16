# TrustedCars Backend

Production-oriented Node.js API for TrustedCars. It supports the core marketplace loop: seller listing, inspection certification, buyer search, secure checkout, RC handover workflows, dashboards, admin operations, support tickets, and chat.

## Run Locally

Install dependencies from the project root first. They are already installed in this workspace.

```bash
cp backend/.env.example .env
node backend/src/server.js
```

If `DATABASE_URL` is set, the API connects to PostgreSQL. If it is blank, it runs with the built-in in-memory demo data so the backend is usable immediately.

## Demo Accounts

| Phone | Password | Role |
|---|---|---|
| +919876543210 | demo1234 | Buyer |
| +919876543211 | demo1234 | Seller |
| +919876543212 | demo1234 | Admin |

OTP demo code is `123456`.

## API Surface

Base URL: `/api/v1`

| Module | Endpoints |
|---|---|
| Auth | `POST /auth/register`, `/auth/login`, `/auth/otp/send`, `/auth/otp/verify`, `/auth/google`, `/auth/refresh`, `/auth/logout`, `GET /auth/me` |
| Cities | `GET /cities`, `GET /cities/:slug`, `PATCH /cities/:slug` |
| Cars | `GET /cars`, `/cars/featured`, `/cars/recent`, `/cars/compare`, `GET /cars/:id`, `POST /cars`, `POST /cars/:id/images`, `POST /cars/:id/wishlist`, `PATCH /cars/:id/moderate` |
| Inspections | `POST /inspections/bookings`, `GET /inspections/bookings/:id/tracking`, `GET /inspections/reports/:inspectionId`, `GET /inspections/reports/:inspectionId/pdf`, `PATCH /inspections/:id/checklist` |
| Checkout | `POST /checkout/documents`, `/checkout/token`, `/checkout/full-payment`, `/checkout/confirm`, `GET /checkout/orders/:id` |
| Dashboard | `GET /dashboard`, `POST /dashboard/saved-searches`, `PATCH /dashboard/notifications/:id/read` |
| Admin | `GET /admin/metrics`, `/admin/moderation/listings`, `/admin/kyc`, `/admin/fraud`, `/admin/inspectors`, `/admin/cities` |
| Support | `GET /support/faqs`, `POST /support/tickets`, `GET /support/tickets`, `PATCH /support/tickets/:id`, `POST /support/callback` |
| Chat | `GET /chat/rooms`, `POST /chat/rooms`, `GET /chat/rooms/:id/messages`, `POST /chat/rooms/:id/messages` |

## Integrations

This backend contains production-ready integration seams and safe mock implementations for:

- Phone OTP provider
- Google OAuth callback exchange
- Cloudinary image upload URL generation
- Razorpay order/payment flow
- Email and SMS reminders
- Fraud risk scoring

Replace the mock service internals with provider SDK calls when credentials are available.

## Database

Use `backend/db/schema.sql` for PostgreSQL schema creation. `backend/db/seed.sql` contains a small seed dataset.

## Security Notes

- Access and refresh tokens are set as HTTP-only cookies.
- Role-based access control is enforced with `authenticate` and `requireRole` middleware.
- KYC, moderation, city controls, and fraud queues are admin-only.
- The checkout flow creates escrow-held payment records.