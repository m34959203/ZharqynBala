# Deployment & Operations Guide

**Product:** ZharqynBala Platform
**Version:** 1.0
**Date:** 2026-04-02

---

## 1. Environment Overview

| Environment | Purpose | URL | Branch |
|------------|---------|-----|--------|
| **Local** | Development | localhost:3000 / :3001 | any |
| **Staging** | Pre-production testing | TBD | staging |
| **Production** | Live users | zharqynbala-production.up.railway.app | main |

---

## 2. Local Development Setup

### 2.1 Prerequisites

- Node.js 20 LTS (`node -v`)
- npm 10+ (`npm -v`)
- Docker & Docker Compose (`docker --version`)
- Git (`git --version`)
- PostgreSQL client (optional, for `psql`)

### 2.2 Quick Start

```bash
# 1. Clone repository
git clone https://github.com/m34959203/ZharqynBala.git
cd ZharqynBala

# 2. Start infrastructure (PostgreSQL, Redis, MailHog)
docker compose -f infrastructure/docker-compose.dev.yml up -d

# 3. Setup backend
cd backend
cp .env.example .env
npm install
npx prisma migrate dev
npx prisma db seed
npm run start:dev
# Backend running at http://localhost:3001
# Swagger at http://localhost:3001/api/docs

# 4. Setup frontend (new terminal)
cd frontend
cp .env.example .env.local
# Edit .env.local: NEXT_PUBLIC_API_URL=http://localhost:3001
npm install
npm run dev
# Frontend running at http://localhost:3000
```

### 2.3 Infrastructure Services

| Service | Port | Credentials | Purpose |
|---------|------|-------------|---------|
| PostgreSQL | 5432 | postgres / postgres | Database |
| Redis | 6379 | (none) | Cache (optional) |
| MailHog SMTP | 1025 | (none) | Email capture |
| MailHog Web | 8025 | (none) | Email viewer |

### 2.4 Useful Commands

```bash
# Reset database completely
cd backend && npx prisma migrate reset

# Open database GUI
cd backend && npx prisma studio

# View captured emails
open http://localhost:8025

# Stop infrastructure
docker compose -f infrastructure/docker-compose.dev.yml down

# Stop + delete data
docker compose -f infrastructure/docker-compose.dev.yml down -v
```

---

## 3. Production Deployment (Railway.app)

### 3.1 Architecture

```
Railway Project
├── Backend Service (Dockerfile)
│   ├── Port: 3001 (internal: 8080)
│   ├── Health: /health
│   └── Auto-deploy from main branch
├── Frontend Service (Next.js)
│   ├── Port: 3000
│   └── Auto-deploy from main branch
└── PostgreSQL (managed)
    ├── Auto-backups
    └── Connection via DATABASE_URL
```

### 3.2 Backend Environment Variables (Railway)

```bash
# Required
NODE_ENV=production
PORT=8080
DATABASE_URL=postgresql://...  # Auto-provided by Railway PostgreSQL
JWT_SECRET=<strong-random-string-64-chars>
JWT_REFRESH_SECRET=<different-strong-random-string-64-chars>
CORS_ORIGIN=https://your-frontend.up.railway.app

# Optional (enable features)
ANTHROPIC_API_KEY=sk-ant-...
GEMINI_API_KEY=...
KASPI_MERCHANT_ID=...
KASPI_API_KEY=...
KASPI_WEBHOOK_SECRET=...
SENDGRID_API_KEY=...
EMAIL_FROM=noreply@zharqynbala.kz
SENTRY_DSN=...
```

### 3.3 Frontend Environment Variables (Railway)

```bash
NEXT_PUBLIC_API_URL=https://your-backend.up.railway.app
NEXTAUTH_SECRET=<strong-random-string>
NEXTAUTH_URL=https://your-frontend.up.railway.app

# Optional (OAuth)
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
```

### 3.4 Deployment Process

```
1. Push to main branch
         │
2. Railway detects changes
         │
3. Build (Dockerfile multi-stage)
   ├── Stage 1: npm ci → prisma generate → npm run build
   └── Stage 2: npm ci --omit=dev → copy dist/
         │
4. Startup sequence
   ├── prisma migrate deploy (apply pending migrations)
   ├── prisma db seed (ensure seed data)
   └── node dist/main.js
         │
5. Health check: GET /health
   ├── Pass → deployment complete
   └── Fail → retry (max 10 times) → rollback
```

### 3.5 Rollback

```bash
# Railway UI: click "Rollback" on previous successful deployment
# Or redeploy specific commit:
git revert HEAD
git push origin main
```

---

## 4. Docker Build

### 4.1 Build Image

```bash
# Build production image
docker build -t zharqynbala-backend:latest .

# Run locally (with external PostgreSQL)
docker run -d \
  --name zb-backend \
  -p 3001:8080 \
  -e DATABASE_URL="postgresql://..." \
  -e JWT_SECRET="..." \
  -e JWT_REFRESH_SECRET="..." \
  zharqynbala-backend:latest
```

### 4.2 Docker Compose (Full Stack)

```yaml
# Example production-like docker-compose.yml
version: '3.8'
services:
  backend:
    build: .
    ports:
      - "3001:8080"
    environment:
      - DATABASE_URL=postgresql://postgres:postgres@db:5432/zharqynbala
      - JWT_SECRET=your-secret
      - JWT_REFRESH_SECRET=your-refresh-secret
    depends_on:
      db:
        condition: service_healthy

  db:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: zharqynbala
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  pgdata:
```

---

## 5. Database Operations

### 5.1 Migrations

```bash
# Development: create new migration
cd backend && npx prisma migrate dev --name add_feature_xyz

# Production: apply pending migrations
cd backend && npx prisma migrate deploy

# Check migration status
cd backend && npx prisma migrate status
```

### 5.2 Backups

**Railway (managed):**
- Automatic daily backups
- Point-in-time recovery available
- Manual backup via Railway dashboard

**Self-hosted:**
```bash
# Backup
pg_dump -h localhost -U postgres -d zharqynbala > backup_$(date +%Y%m%d).sql

# Restore
psql -h localhost -U postgres -d zharqynbala < backup_20260402.sql
```

### 5.3 Seed Data

```bash
# Run seed (idempotent — uses upsert)
cd backend && npx prisma db seed

# Reset everything (DROP + migrate + seed)
cd backend && npx prisma migrate reset
```

---

## 6. Monitoring & Health Checks

### 6.1 Health Endpoints

| Endpoint | Purpose | Expected Response |
|----------|---------|-------------------|
| `GET /health` | Railway healthcheck (no /api prefix) | `{ status: "ok", timestamp: "..." }` |
| `GET /api/v1/health` | Detailed health | Database connectivity + metrics |
| `GET /api/v1/health/ready` | Readiness probe | 200 when ready to accept traffic |
| `GET /api/v1/health/live` | Liveness probe | 200 when process is alive |

### 6.2 Monitoring Checklist

| Check | Tool | Interval |
|-------|------|----------|
| Service uptime | Railway dashboard | Continuous |
| API response time | Sentry (planned) | Per request |
| Error rate | Sentry (planned) | Per request |
| Database connections | PostgreSQL metrics | 5 min |
| Disk usage | Railway metrics | 15 min |
| SSL certificate | External monitor | Daily |

### 6.3 Alerting (Planned)

| Alert | Condition | Action |
|-------|----------|--------|
| Service down | Health check fails 3x | Restart + notify |
| High error rate | > 5% 5xx in 5 min | Investigate |
| Database connection failure | Connection pool exhausted | Scale + investigate |
| Disk space low | > 80% usage | Clean up / scale |

---

## 7. Troubleshooting

### 7.1 Common Issues

**Backend won't start:**
```bash
# Check DATABASE_URL is correct
echo $DATABASE_URL

# Check database is accessible
npx prisma db pull

# Check for pending migrations
npx prisma migrate status

# Check port is free
lsof -i :3001
```

**Migration fails:**
```bash
# Check current migration state
npx prisma migrate status

# If stuck migration, reset (DEV ONLY)
npx prisma migrate reset

# For production: see fix-migration.js
node fix-migration.js
```

**Frontend can't connect to backend:**
```bash
# Verify NEXT_PUBLIC_API_URL
echo $NEXT_PUBLIC_API_URL

# Test backend directly
curl http://localhost:3001/health

# Check CORS origins in backend .env
echo $CORS_ORIGIN
```

**Token/auth issues:**
```bash
# Clear browser cookies and localStorage
# Check JWT_SECRET matches between restarts
# Verify token expiration times
```

### 7.2 Logs

```bash
# Backend logs (local)
cd backend && npm run start:dev  # stdout

# Railway logs
railway logs --service backend

# Database logs
docker logs zharqyn_postgres
```

---

## 8. Security Checklist (Pre-Deploy)

- [ ] `NODE_ENV=production` set
- [ ] `JWT_SECRET` is strong (64+ random chars)
- [ ] `JWT_REFRESH_SECRET` is different from JWT_SECRET
- [ ] `CORS_ORIGIN` lists only allowed domains
- [ ] No `.env` files in repository
- [ ] No console.log with sensitive data
- [ ] `NEXTAUTH_SECRET` set in frontend
- [ ] HTTPS enforced (Railway handles this)
- [ ] Database credentials are not defaults
- [ ] Payment webhooks verify signatures
- [ ] Rate limiting is configured
