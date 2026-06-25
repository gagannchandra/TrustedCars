# Development Workflow Guide

This guide documents the development workflows for the TrustedCars application. The application supports two distinct development modes, each optimized for different scenarios.

## Table of Contents

- [Quick Reference](#quick-reference)
- [Mode 1: Development with Hot Reload](#mode-1-development-with-hot-reload)
- [Mode 2: Integrated Mode](#mode-2-integrated-mode)
- [When to Use Each Mode](#when-to-use-each-mode)
- [Common Development Tasks](#common-development-tasks)
- [Performance Tips](#performance-tips)
- [Debugging Guide](#debugging-guide)
- [Port Reference](#port-reference)

---

## Quick Reference

### Mode 1: Development with Hot Reload (Separate Servers)
```bash
# Terminal 1 - Backend
cd backend
source .venv/bin/activate  # or .venv\Scripts\activate on Windows
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Terminal 2 - Frontend
cd frontend
npm run dev

# Terminal 3 - Background Worker
cd backend
source .venv/bin/activate
python worker_main.py
```
**Access**: Frontend at http://localhost:5173 | Backend API at http://localhost:8000

### Mode 2: Integrated Mode (Backend Serves Frontend)
```bash
# Terminal 1 - Build Frontend
cd frontend
npm run build

# Terminal 2 - Start Backend with Frontend
cd backend
export SERVE_FRONTEND=true  # or set SERVE_FRONTEND=true on Windows
source .venv/bin/activate
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Terminal 3 - Background Worker
cd backend
source .venv/bin/activate
python worker_main.py
```
**Access**: Integrated app at http://localhost:8000

---

## Mode 1: Development with Hot Reload

### Overview

Development mode runs the frontend and backend as separate processes. This is the **recommended mode for active development** as it provides:
- **Hot Module Replacement (HMR)**: Frontend changes appear instantly without page refresh
- **Fast iteration**: No build step needed for frontend changes
- **Full debugging**: React DevTools and browser debugger work seamlessly
- **TypeScript checking**: Real-time type errors in your IDE

### Architecture

```
Browser → Vite Dev Server (localhost:5173) → Proxy → FastAPI Backend (localhost:8000)
                                                              ↓
                                                    PostgreSQL, Redis, MinIO
```

### Starting Development Mode

#### Step 1: Start the Backend

```bash
cd backend
source .venv/bin/activate  # Linux/macOS
# OR
.venv\Scripts\activate     # Windows

uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

**What this does**:
- Starts FastAPI with auto-reload on code changes
- Exposes API at http://localhost:8000/api/v1
- Provides Swagger docs at http://localhost:8000/docs

**Verify it's working**:
```bash
curl http://localhost:8000/health/live
# Should return: {"status":"ok"}
```

#### Step 2: Start the Frontend

```bash
cd frontend
npm run dev
```

**What this does**:
- Starts Vite dev server at http://localhost:5173
- Enables Hot Module Replacement (HMR)
- Proxies API requests to backend (configured in `vite.config.ts`)

**Verify it's working**:
- Open http://localhost:5173 in your browser
- Frontend should load with no console errors

#### Step 3: Start the Background Worker

```bash
cd backend
source .venv/bin/activate  # Linux/macOS
# OR
.venv\Scripts\activate     # Windows

python worker_main.py
```

**What this does**:
- Processes outbox events (emails, notifications)
- Handles async tasks
- Monitors PostgreSQL for new events

**Verify it's working**:
- Check console output for "Worker started successfully"
- No connection errors to PostgreSQL, Redis, or MinIO

### How API Requests Work

The Vite dev server **proxies** API requests to the backend. This is configured in `frontend/vite.config.ts`:

```typescript
server: {
  proxy: {
    "/api": {
      target: "http://localhost:8000",
      changeOrigin: true,
    },
  },
}
```

**Request flow**:
1. Frontend makes request to `/api/v1/cars`
2. Vite dev server intercepts and proxies to `http://localhost:8000/api/v1/cars`
3. Backend processes and returns JSON
4. Vite forwards response back to frontend
5. JWT cookies work across the proxy (credentials included)

### Hot Module Replacement (HMR)

**How it works**:
- Change any React component, TypeScript file, or CSS
- Save the file
- Vite detects the change and updates the browser **instantly**
- No page refresh, state is preserved when possible

**Example**:
```tsx
// Before: src/components/CarCard.tsx
<h2 className="text-xl">Car Title</h2>

// After: Save this change
<h2 className="text-2xl font-bold">Car Title</h2>

// Browser updates immediately without refresh
```

### Backend Auto-Reload

The `--reload` flag makes FastAPI restart when you change Python files:

```python
# Change: backend/app/modules/cars/service.py
def get_car(car_id: int):
    # Add logging
    logger.info(f"Fetching car {car_id}")
    return db.query(Car).filter(Car.id == car_id).first()

# Save → Backend restarts automatically
```

**Note**: Database connections are re-established, state is reset on restart.

### Development Environment Variables

Create `frontend/.env.development` (already configured):
```bash
VITE_API_URL=http://localhost:8000
```

**Purpose**: Tells the frontend where the backend is running. The proxy handles routing automatically.

---

## Mode 2: Integrated Mode

### Overview

Integrated mode runs a single server where the FastAPI backend serves both the API **and** the built frontend static files. This is **production-like** and useful for:
- Testing the production deployment locally
- Verifying static file serving and caching
- Testing without cross-origin (CORS) complexity
- Final validation before deployment

### Architecture

```
Browser → FastAPI Backend (localhost:8000)
              ├── /api/v1/* → API Endpoints
              ├── /assets/* → Static Files (JS, CSS, images)
              └── /* → index.html (SPA routing)
```

### Starting Integrated Mode

#### Step 1: Build the Frontend

```bash
cd frontend
npm run build
```

**What this does**:
- Compiles TypeScript to JavaScript
- Bundles all React components
- Optimizes and minifies code
- Generates hashed filenames for cache busting
- Creates `frontend/dist/` directory with:
  ```
  dist/
  ├── index.html
  ├── assets/
  │   ├── index-[hash].js
  │   ├── index-[hash].css
  │   └── vendor-[hash].js
  └── .vite/manifest.json
  ```

**Build time**: ~10-30 seconds depending on your machine.

**Verify the build**:
```bash
ls frontend/dist
# Should show: index.html  assets/
```

#### Step 2: Start Backend with Frontend Serving

```bash
cd backend
export SERVE_FRONTEND=true  # Linux/macOS
# OR
set SERVE_FRONTEND=true     # Windows CMD
# OR
$env:SERVE_FRONTEND="true"  # Windows PowerShell

source .venv/bin/activate  # Linux/macOS
# OR
.venv\Scripts\activate     # Windows

uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

**What this does**:
- Starts FastAPI on port 8000
- Mounts `/assets` directory to serve JS/CSS/images
- Configures SPA fallback (serves `index.html` for frontend routes)
- API routes take priority over static files

**Verify it's working**:
- Open http://localhost:8000 in your browser
- Frontend loads (you see the UI, not API docs)
- Check browser console: no errors
- Visit http://localhost:8000/docs to see API documentation

#### Step 3: Start Background Worker

```bash
cd backend
source .venv/bin/activate  # Linux/macOS
# OR
.venv\Scripts\activate     # Windows

python worker_main.py
```

Same as in Mode 1 - handles background tasks.

### How Request Routing Works

FastAPI uses priority-based routing:

1. **API routes** (highest priority)
   - `/api/v1/cars` → API handler
   - `/api/v1/users` → API handler
   - `/health`, `/metrics` → API handlers

2. **Static assets**
   - `/assets/index-abc123.js` → Serve from `frontend/dist/assets/`
   - `/assets/vendor-xyz789.js` → Serve from `frontend/dist/assets/`
   - Cache headers: `Cache-Control: public, max-age=31536000, immutable`

3. **SPA fallback** (lowest priority)
   - `/`, `/cars`, `/login`, `/dashboard` → Serve `index.html`
   - React Router handles client-side routing
   - Cache headers: `Cache-Control: no-cache, no-store, must-revalidate`

### API Client Configuration

In integrated mode, the frontend uses **relative URLs** (same origin):

```typescript
// frontend/src/shared/api/axiosInstance.ts
baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1'
```

Since `VITE_API_URL` is not set in integrated mode, it falls back to `http://localhost:8000/api/v1`, which becomes relative at runtime.

### When to Rebuild Frontend

You **must rebuild** the frontend when:
- ✅ You change any React component
- ✅ You change any TypeScript file
- ✅ You change any CSS or styling
- ✅ You add/remove dependencies
- ✅ You change Vite configuration

The backend does **not** hot-reload frontend changes in integrated mode.

**Quick rebuild workflow**:
```bash
cd frontend
npm run build && echo "✓ Frontend rebuilt"
# Backend auto-reloads and serves new files
```

---

## When to Use Each Mode

### Use Mode 1 (Development) when:

✅ **Actively developing frontend**
- You're writing React components
- You're debugging TypeScript issues
- You need instant feedback from HMR
- You're iterating on UI/UX

✅ **Frontend-focused work**
- Writing new pages or components
- Styling and layout changes
- Adding new features to the UI
- Testing responsive design

✅ **Debugging frontend issues**
- React DevTools needed
- Browser console debugging
- Testing user interactions

### Use Mode 2 (Integrated) when:

✅ **Testing production-like setup**
- Validating static file serving
- Testing cache headers
- Verifying build output is correct
- Testing SPA routing with backend

✅ **Backend-focused work**
- Writing API endpoints
- Database changes
- Backend logic changes
- No frontend changes needed

✅ **Final validation**
- Before deploying to production
- Testing the complete application
- Verifying no CORS issues
- Performance testing

✅ **Demonstrating to stakeholders**
- Single URL to share
- Production-like experience
- No need to explain two servers

---

## Common Development Tasks

### Adding a New API Endpoint

**Mode 1** (preferred):
1. Start backend and frontend in Mode 1
2. Add your endpoint in `backend/app/modules/*/router.py`
3. Backend auto-reloads when you save
4. Test endpoint in browser or with curl
5. Update frontend to call the endpoint
6. Frontend HMR updates instantly

**Example**:
```python
# backend/app/modules/cars/router.py
@router.get("/featured")
async def get_featured_cars():
    return {"cars": [...]}
```

```typescript
// frontend/src/api/cars.ts
export const getFeaturedCars = () =>
  axiosInstance.get('/cars/featured');
```

### Adding a New Frontend Page

**Mode 1** (preferred):
1. Start both servers
2. Create new component in `frontend/src/pages/NewPage.tsx`
3. Add route in `frontend/src/App.tsx` or router config
4. HMR updates browser instantly
5. Test navigation and functionality

### Changing Database Schema

1. **Use either mode** (backend-only task)
2. Create Alembic migration:
   ```bash
   cd backend
   alembic revision --autogenerate -m "Add new column"
   ```
3. Review generated migration in `alembic/versions/`
4. Apply migration:
   ```bash
   alembic upgrade head
   ```
5. Update SQLAlchemy models
6. Update API endpoints to use new schema
7. Update frontend if needed

### Testing a Full User Flow

**Mode 2** (recommended):
1. Build frontend: `cd frontend && npm run build`
2. Start backend with `SERVE_FRONTEND=true`
3. Start worker
4. Open http://localhost:8000
5. Test complete flow (register → login → use app)
6. Verify everything works as in production

### Running Tests

**Backend tests**:
```bash
cd backend
source .venv/bin/activate
pytest tests/ -v
```

**Frontend tests** (if configured):
```bash
cd frontend
npm test
```

---

## Performance Tips

### Frontend Development (Mode 1)

**Fast HMR**:
- Keep components small and focused
- Use code splitting for large dependencies
- Avoid importing large libraries at module level
- Use dynamic imports for heavy components

**Reducing rebuild time**:
```typescript
// Good: Dynamic import
const HeavyChart = lazy(() => import('./HeavyChart'));

// Avoid: Always imported
import HeavyChart from './HeavyChart';
```

### Backend Development (Both Modes)

**Faster auto-reload**:
- Only edit files in `app/` directory (reload watches this)
- Avoid editing files outside backend/ during development
- Use `--reload-dir app` to limit watched directories:
  ```bash
  uvicorn app.main:app --reload --reload-dir app
  ```

**Database query optimization**:
- Use `select_in_load` for relationships to avoid N+1 queries
- Add indexes for frequently queried columns
- Use connection pooling (already configured)

### Integrated Mode (Mode 2)

**Faster builds**:
```bash
# Development build (faster, larger)
npm run build -- --mode development

# Production build (slower, optimized)
npm run build
```

**Cache static assets**:
- Hashed filenames enable aggressive caching
- Browser caches assets until content changes
- Only `index.html` is re-fetched on refresh

---

## Debugging Guide

### Frontend Debugging (Mode 1)

**React DevTools**:
1. Install React DevTools browser extension
2. Open browser DevTools → React tab
3. Inspect component props and state
4. Profile render performance

**Browser Console**:
- Check for JavaScript errors
- Monitor network requests (Network tab)
- Inspect API responses
- Check for CORS errors (should be none)

**Common issues**:

**"Network Error" when calling API**:
```bash
# Check backend is running
curl http://localhost:8000/health/live

# Check Vite proxy is configured
cat frontend/vite.config.ts | grep proxy
```

**HMR not working**:
```bash
# Restart Vite dev server
# Press Ctrl+C, then:
npm run dev
```

### Backend Debugging

**Enable debug logging**:
```python
# backend/app/core/config.py
LOG_LEVEL="DEBUG"  # Add to .env
```

**Database query logging**:
```python
# backend/app/db/session.py
engine = create_async_engine(
    settings.DATABASE_URL,
    echo=True,  # Logs all SQL queries
)
```

**Redis debugging**:
```bash
# Connect to Redis CLI
redis-cli -a redis_password

# Monitor all commands
MONITOR

# Check keys
KEYS *
```

**PostgreSQL debugging**:
```bash
# Connect to database
psql -U trustedcars_user -d trustedcars_db -h localhost

# Check active queries
SELECT * FROM pg_stat_activity;

# Check table counts
SELECT COUNT(*) FROM users;
```

### Integrated Mode Debugging (Mode 2)

**Static files not loading**:
```bash
# Check build exists
ls frontend/dist

# Check backend logs for errors
# Look for "Frontend build directory not found"

# Rebuild frontend
cd frontend
npm run build
```

**"Cannot GET /api/v1/cars"**:
```bash
# API routes should work
# Check backend logs for routing errors
# Verify API router is registered BEFORE static files
```

**Frontend route returns 404**:
```bash
# All frontend routes should return index.html
# Check backend SPA fallback is configured
# Verify SERVE_FRONTEND=true
```

### Worker Debugging

**Worker not processing events**:
```bash
# Check worker logs
# Look for "Worker started successfully"

# Check database connection
# Look for "Connected to PostgreSQL"

# Manually check outbox table
psql -U trustedcars_user -d trustedcars_db -h localhost
SELECT * FROM outbox_events WHERE processed_at IS NULL;
```

---

## Port Reference

| Service | Port | URL | Purpose |
|---------|------|-----|---------|
| **Frontend (Mode 1)** | 5173 | http://localhost:5173 | Vite dev server with HMR |
| **Backend** | 8000 | http://localhost:8000 | FastAPI application |
| **PostgreSQL** | 5432 | localhost:5432 | Database |
| **Redis** | 6379 | localhost:6379 | Cache and sessions |
| **MinIO** | 9000 | http://localhost:9000 | S3-compatible storage |
| **MinIO Console** | 9001 | http://localhost:9001 | MinIO web interface |

### Port Conflicts

If you get "Port already in use" errors:

**Find process using port**:
```bash
# Linux/macOS
lsof -i :5173
lsof -i :8000

# Windows
netstat -ano | findstr :5173
netstat -ano | findstr :8000
```

**Kill process**:
```bash
# Linux/macOS
kill -9 <PID>

# Windows
taskkill /PID <PID> /F
```

**Change port**:
```bash
# Frontend (temporary)
npm run dev -- --port 5174

# Backend (temporary)
uvicorn app.main:app --port 8001
```

---

## Environment Variables Reference

### Backend (`.env`)

Required for both modes:
```bash
# Database
DATABASE_URL=postgresql+asyncpg://trustedcars_user:trustedcars_password@localhost:5432/trustedcars_db

# Redis
REDIS_URL=redis://:redis_password@localhost:6379/0

# Storage
S3_ENDPOINT_URL=http://localhost:9000
S3_BUCKET_NAME=trustedcars-images
AWS_ACCESS_KEY_ID=minioadmin
AWS_SECRET_ACCESS_KEY=minioadmin

# Integrated mode flag
SERVE_FRONTEND=false  # Mode 1
# SERVE_FRONTEND=true  # Mode 2
```

### Frontend (`.env.development`)

Only used in Mode 1:
```bash
VITE_API_URL=http://localhost:8000
```

---

## Next Steps

- **New to the project?** Follow [NATIVE_SETUP.md](./NATIVE_SETUP.md) to install services
- **Migrating from Docker?** See [MIGRATION.md](./MIGRATION.md) for migration guide
- **Having issues?** Check [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) for solutions
- **Deploying to production?** See [README.md](../README.md) for deployment docs

---

## Summary

| Feature | Mode 1: Development | Mode 2: Integrated |
|---------|-------------------|-------------------|
| **Frontend** | Vite dev server (5173) | Built static files |
| **Backend** | FastAPI (8000) | FastAPI (8000) |
| **HMR** | ✅ Yes | ❌ No |
| **Build step** | ❌ Not needed | ✅ Required |
| **Use case** | Active development | Production testing |
| **Reload** | Instant | Manual rebuild |
| **CORS** | Proxied | Same origin |
| **Speed** | Fast iteration | Slower iteration |

**Recommendation**: Use **Mode 1** for daily development, **Mode 2** for final testing before deployment.

---

## Docker (Optional)

**Docker is NOT required for local development** with TrustedCars. The workflow described above uses native services (PostgreSQL, Redis, MinIO) installed directly on your machine.

### Why Native Development?

The native approach provides:
- ✅ **Direct access** to services (psql, redis-cli, MinIO console)
- ✅ **Faster iteration** (no container rebuilds)
- ✅ **Easier debugging** (native tools work seamlessly)
- ✅ **Lower resource usage** (no Docker daemon overhead)

### When to Use Docker

Docker configurations are available in `backend/docker-compose.yml` and `backend/Dockerfile` for:

1. **CI/CD Pipelines** — Consistent test environments in GitHub Actions, GitLab CI
2. **Production Deployments** — Container images for Kubernetes, AWS ECS, Google Cloud Run
3. **Team Preference** — Some developers prefer Docker for local development (fully supported)

### Docker Local Development (Optional)

If you prefer Docker for local development:

```bash
# Start all services with Docker
cd backend
docker-compose up -d

# View logs
docker-compose logs -f api

# Stop services
docker-compose down
```

**Note**: Docker-based development has slower iteration compared to native:
- Container rebuilds after code changes
- Volume mounting overhead
- No direct access to service CLIs

**Recommendation**: Use native development for daily work, Docker for production deployments.

For Docker deployment documentation, see `backend/docker-compose.yml` comments and [README.md](../README.md) Docker section.


