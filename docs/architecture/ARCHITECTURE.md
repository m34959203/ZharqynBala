# Architecture Document

**Standard:** C4 Model + ISO/IEC/IEEE 42010:2022
**Product:** ZharqynBala Platform
**Version:** 1.0
**Date:** 2026-04-02

---

## 1. Architecture Overview

### 1.1 System Context (C4 Level 1)

```
┌─────────────────────────────────────────────────────────────────┐
│                        EXTERNAL SYSTEMS                          │
│                                                                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────┐   │
│  │ Kaspi Pay│  │Jitsi Meet│  │Claude/   │  │SendGrid/     │   │
│  │(Payments)│  │(Video)   │  │Gemini(AI)│  │Mobizon(Notif)│   │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └──────┬───────┘   │
│       │              │              │               │            │
└───────┼──────────────┼──────────────┼───────────────┼────────────┘
        │              │              │               │
┌───────┼──────────────┼──────────────┼───────────────┼────────────┐
│       ▼              ▼              ▼               ▼            │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                   ZHARQYNBALA PLATFORM                    │   │
│  │                                                          │   │
│  │  ┌─────────┐  ┌──────────┐  ┌──────────┐               │   │
│  │  │Frontend │  │ Backend  │  │ Mobile   │               │   │
│  │  │(Next.js)│──│(NestJS)  │──│(Expo)    │               │   │
│  │  └─────────┘  └────┬─────┘  └──────────┘               │   │
│  │                     │                                    │   │
│  │               ┌─────┴─────┐                              │   │
│  │               │PostgreSQL │                              │   │
│  │               │   + Redis │                              │   │
│  │               └───────────┘                              │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌─────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐        │
│  │ Parent  │  │Psycho-   │  │ School   │  │ Admin    │        │
│  │ (User)  │  │logist    │  │ (User)   │  │ (User)   │        │
│  └─────────┘  └──────────┘  └──────────┘  └──────────┘        │
└─────────────────────────────────────────────────────────────────┘
```

### 1.2 Container Diagram (C4 Level 2)

```
┌────────────────────────────────────────────────────────────────┐
│                         RAILWAY.APP                             │
│                                                                 │
│  ┌──────────────────────┐    ┌──────────────────────┐         │
│  │   FRONTEND SERVICE    │    │   BACKEND SERVICE     │         │
│  │                       │    │                       │         │
│  │  Next.js 16 (SSR)    │    │  NestJS 10 (REST)    │         │
│  │  React 19             │───▶│  Prisma 5 (ORM)      │         │
│  │  NextAuth 4 (Auth)    │    │  Passport (JWT)      │         │
│  │  Tailwind CSS 4       │    │  Swagger (API docs)  │         │
│  │                       │    │                       │         │
│  │  Port: 3000           │    │  Port: 3001          │         │
│  └──────────────────────┘    └──────────┬────────────┘         │
│                                          │                      │
│                                ┌─────────┴──────────┐          │
│                                │   POSTGRESQL 15     │          │
│                                │   (Railway managed) │          │
│                                │                     │          │
│                                │   20+ tables        │          │
│                                │   Prisma migrations │          │
│                                └────────────────────┘          │
└────────────────────────────────────────────────────────────────┘
```

### 1.3 Component Diagram — Backend (C4 Level 3)

```
┌─────────────────────────────────────────────────────────────────┐
│                        BACKEND (NestJS)                          │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                     MIDDLEWARE LAYER                      │    │
│  │  Helmet │ CORS │ Compression │ CookieParser │ RateLimit │    │
│  │  SecurityMiddleware (CSP, XSS sanitizer)                 │    │
│  └─────────────────────────────────────────────────────────┘    │
│                              │                                   │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                      GUARD LAYER                         │    │
│  │  JwtAuthGuard (global) │ RolesGuard │ ThrottlerGuard    │    │
│  └─────────────────────────────────────────────────────────┘    │
│                              │                                   │
│  ┌──────────────────────────┬──────────────────────────────┐    │
│  │     CORE MODULES         │      SUPPORT MODULES          │    │
│  │                          │                               │    │
│  │  ┌─────────────────┐   │  ┌─────────────────┐          │    │
│  │  │ AuthModule       │   │  │ PdfModule        │          │    │
│  │  │ (JWT, Passport)  │   │  │ (Puppeteer)      │          │    │
│  │  ├─────────────────┤   │  ├─────────────────┤          │    │
│  │  │ UsersModule      │   │  │ AiModule         │          │    │
│  │  │ (Profiles, CRUD) │   │  │ (Claude, Gemini) │          │    │
│  │  ├─────────────────┤   │  ├─────────────────┤          │    │
│  │  │ TestsModule      │   │  │ NotificationsModule│         │    │
│  │  │ (Engine, Sessions)│   │  │ (Email,SMS,Push) │          │    │
│  │  ├─────────────────┤   │  ├─────────────────┤          │    │
│  │  │ ResultsModule    │   │  │ AnalyticsModule  │          │    │
│  │  │ (Scoring, Interp)│   │  │ (Reports, Export)│          │    │
│  │  ├─────────────────┤   │  ├─────────────────┤          │    │
│  │  │ ConsultationsModule│  │  │ CrisisModule     │          │    │
│  │  │ (Booking, Jitsi) │   │  │ (Hotlines)       │          │    │
│  │  ├─────────────────┤   │  ├─────────────────┤          │    │
│  │  │ PsychologistsModule│  │  │ HealthModule     │          │    │
│  │  │ (Profiles, Slots)│   │  │ (Probes, Metrics)│          │    │
│  │  ├─────────────────┤   │  └─────────────────┘          │    │
│  │  │ ScheduleModule   │   │                               │    │
│  │  ├─────────────────┤   │                               │    │
│  │  │ PaymentsModule   │   │                               │    │
│  │  │ (Kaspi, Webhook) │   │                               │    │
│  │  ├─────────────────┤   │                               │    │
│  │  │ SchoolsModule    │   │                               │    │
│  │  │ (Classes, Import)│   │                               │    │
│  │  ├─────────────────┤   │                               │    │
│  │  │ AdminModule      │   │                               │    │
│  │  │ (Dashboard, Mgmt)│   │                               │    │
│  │  ├─────────────────┤   │                               │    │
│  │  │ PatientNotesModule│  │                               │    │
│  │  └─────────────────┘   │                               │    │
│  └──────────────────────────┴──────────────────────────────┘    │
│                              │                                   │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                     COMMON LAYER                         │    │
│  │  PrismaService │ AuditService │ LoggerService │ Config  │    │
│  └─────────────────────────────────────────────────────────┘    │
│                              │                                   │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                     DATA LAYER                           │    │
│  │  PostgreSQL 15 (Prisma ORM) │ Redis 7 (Cache, optional) │    │
│  └─────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. Technology Decisions

### 2.1 Backend: NestJS

**Decision:** NestJS 10 with TypeScript

**Rationale:**
- Modular architecture maps cleanly to domain modules
- Built-in support for guards, interceptors, pipes (auth, validation)
- TypeScript for type safety across the entire stack
- First-class Swagger/OpenAPI integration
- Large ecosystem (Passport, Throttler, etc.)

**Alternatives considered:**
- Express.js — too low-level, requires manual structure
- FastAPI (Python) — team expertise is in TypeScript

### 2.2 Database: PostgreSQL + Prisma

**Decision:** PostgreSQL 15 with Prisma ORM 5

**Rationale:**
- PostgreSQL: mature, reliable, supports JSONB for flexible metadata
- Prisma: type-safe queries, auto-generated client, declarative schema, migration system
- No raw SQL needed for most operations (protection against SQL injection)

**Alternatives considered:**
- MongoDB — relational data (tests → questions → answers) better suited for SQL
- TypeORM — Prisma has better DX and type safety

### 2.3 Frontend: Next.js

**Decision:** Next.js 16 with React 19 and App Router

**Rationale:**
- SSR for SEO (landing page, public test listings)
- API routes for server-side proxy (token handling)
- File-based routing with layouts and route groups
- React 19 for latest features
- Large ecosystem and community

### 2.4 Authentication: JWT + NextAuth

**Decision:** JWT tokens (backend) + NextAuth.js (frontend)

**Rationale:**
- JWT: stateless, scalable, works well with API-first architecture
- NextAuth: handles OAuth providers, session management, CSRF protection
- Dual token system: short-lived access (15min) + long-lived refresh (7d)

### 2.5 Video: Jitsi Meet

**Decision:** Jitsi Meet (open-source)

**Rationale:**
- Free, no per-minute costs
- WebRTC-based, works in browsers without plugins
- Can self-host for privacy requirements
- JWT-based room access control

**Alternatives considered:**
- Agora SDK — costs per minute, better quality but expensive for MVP
- Twilio Video — similar cost concerns

### 2.6 Payments: Kaspi Pay

**Decision:** Kaspi Pay as primary payment provider

**Rationale:**
- 90%+ market share in Kazakhstan
- All target users already have Kaspi app
- Webhook-based status updates
- PayBox as fallback provider

---

## 3. Data Architecture

### 3.1 Entity Relationship Diagram

```
┌──────────┐     1:N     ┌──────────┐     1:N     ┌──────────────┐
│   User   │────────────▶│  Child   │────────────▶│ TestSession  │
│          │             │          │             │              │
│ id       │             │ id       │             │ id           │
│ email    │             │ parentId │             │ testId       │
│ role     │             │ firstName│             │ childId      │
│ password │             │ birthDate│             │ status       │
└──────┬───┘             └──────────┘             │ currentQ     │
       │                                          └──────┬───────┘
       │ 1:1                                             │ 1:N
       ▼                                                 ▼
┌──────────────┐                                  ┌──────────┐
│ Psychologist │                                  │  Answer  │
│              │                                  │          │
│ specializ[]  │                                  │ sessionId│
│ hourlyRate   │                                  │ questionId│
│ rating       │                                  │ optionId │
│ isApproved   │                                  └──────────┘
└──────┬───────┘
       │ 1:N                    ┌──────────┐  1:N  ┌────────────┐
       ▼                        │   Test   │──────▶│  Question  │
┌──────────────┐                │          │       │            │
│Consultation  │                │ titleRu  │       │ textRu     │
│              │                │ titleKz  │       │ textKz     │
│ psychologistId                │ category │       │ type       │
│ clientId     │                │ ageMin   │       └──────┬─────┘
│ childId      │                │ ageMax   │              │ 1:N
│ status       │                │ price    │              ▼
│ roomName     │                └──────────┘       ┌────────────┐
│ rating       │                                   │AnswerOption│
└──────┬───────┘                                   │            │
       │ 1:N                                       │ textRu     │
       ▼                                           │ textKz     │
┌──────────────┐     ┌──────────┐  1:1             │ score      │
│ PatientNote  │     │  Result  │◀────────TestSession            │
│              │     │          │                   └────────────┘
│ title        │     │ totalScore│
│ content      │     │ maxScore │
│ diagnosis    │     │ interpret│
└──────────────┘     │ pdfUrl   │
                     └──────────┘
```

### 3.2 Database Indexing Strategy

| Table | Index | Type | Purpose |
|-------|-------|------|---------|
| users | email | UNIQUE | Login lookup |
| users | phone | UNIQUE | Phone lookup |
| children | parentId | FK INDEX | Parent's children list |
| test_sessions | childId, testId | COMPOSITE | Session lookup |
| test_sessions | status | INDEX | Active sessions filter |
| consultations | psychologistId, status | COMPOSITE | Psychologist dashboard |
| consultations | clientId, status | COMPOSITE | Client dashboard |
| schedule_slots | psychologistId, date, hour | UNIQUE | Slot booking |
| payments | userId, status | COMPOSITE | Payment history |
| security_logs | userId, createdAt | COMPOSITE | Audit queries |

---

## 4. Security Architecture

### 4.1 Authentication Flow

```
Client                    Frontend (NextAuth)              Backend (NestJS)
  │                              │                              │
  │──── Login Form ─────────────▶│                              │
  │                              │── POST /api/v1/auth/login ──▶│
  │                              │                              │── Validate credentials
  │                              │                              │── Generate JWT pair
  │                              │◀── { accessToken, refresh } ─│── Store refresh hash
  │                              │── Set session cookie         │
  │◀── Session established ──────│                              │
  │                              │                              │
  │──── API Request ────────────▶│                              │
  │                              │── Bearer {accessToken} ─────▶│
  │                              │                              │── JwtAuthGuard
  │                              │                              │── RolesGuard
  │                              │◀── Response ─────────────────│
  │◀── Data ─────────────────────│                              │
  │                              │                              │
  │──── (Token expired) ────────▶│                              │
  │                              │── 401 Unauthorized ─────────▶│
  │                              │── POST /auth/refresh ───────▶│
  │                              │                              │── Validate refresh
  │                              │◀── New token pair ───────────│
  │                              │── Retry original request ───▶│
  │◀── Data ─────────────────────│                              │
```

### 4.2 Authorization Matrix

```
                  Public    JWT      PARENT   PSYCHOLOGIST   SCHOOL    ADMIN
GET  /tests         ✓
GET  /tests/:id     ✓
POST /tests/:id/start        ✓        ✓
GET  /results                 ✓        ✓
POST /consultations           ✓        ✓
GET  /consult/psych           ✓                   ✓
POST /schedule                ✓                   ✓
GET  /schools                 ✓                              ✓
GET  /admin/*                 ✓                                         ✓
POST /admin/tests             ✓                                         ✓
```

### 4.3 Data Protection Layers

```
┌─────────────────────────────────────────────┐
│ Layer 1: Transport Security                  │
│ - TLS 1.2+ (HTTPS everywhere)              │
│ - HSTS headers (production)                 │
├─────────────────────────────────────────────┤
│ Layer 2: Application Security                │
│ - Helmet (security headers)                 │
│ - CORS whitelist                            │
│ - Rate limiting (100 req/min)               │
│ - XSS sanitizer middleware                  │
│ - Input validation (class-validator)         │
├─────────────────────────────────────────────┤
│ Layer 3: Authentication                      │
│ - JWT with short TTL (15min)                │
│ - bcrypt password hashing (factor 12)       │
│ - Refresh token rotation                    │
├─────────────────────────────────────────────┤
│ Layer 4: Authorization                       │
│ - RBAC (4 roles)                            │
│ - Resource ownership checks                 │
│ - Guard decorators on every endpoint        │
├─────────────────────────────────────────────┤
│ Layer 5: Data Layer                          │
│ - Prisma ORM (parameterized queries)        │
│ - No raw SQL in application code            │
│ - PostgreSQL role-based access              │
│ - Audit logging (SecurityLog table)         │
└─────────────────────────────────────────────┘
```

---

## 5. Deployment Architecture

### 5.1 Production (Railway.app)

```
┌────────────────────────────────────────────────┐
│                  RAILWAY.APP                     │
│                                                  │
│  ┌──────────────┐     ┌──────────────┐         │
│  │   Frontend    │     │   Backend    │         │
│  │   Service     │────▶│   Service    │         │
│  │               │     │              │         │
│  │ Next.js SSR   │     │ NestJS API   │         │
│  │ Port 3000     │     │ Port 3001    │         │
│  │               │     │              │         │
│  │ Health: /     │     │ Health: /health│        │
│  └──────────────┘     └──────┬───────┘         │
│                               │                  │
│                        ┌──────┴───────┐         │
│                        │  PostgreSQL   │         │
│                        │  (managed)    │         │
│                        │  Auto-backup  │         │
│                        └──────────────┘         │
│                                                  │
│  Restart: ON_FAILURE (max 10)                   │
│  Healthcheck timeout: 100s                      │
└────────────────────────────────────────────────┘
```

### 5.2 Development (Local Docker)

```
┌────────────────────────────────────────────────┐
│              DOCKER COMPOSE (DEV)                │
│                                                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐     │
│  │PostgreSQL│  │  Redis   │  │ MailHog  │     │
│  │  :5432   │  │  :6379   │  │:1025/:8025│    │
│  └──────────┘  └──────────┘  └──────────┘     │
│                                                  │
│  + npm run start:dev (backend :3001)            │
│  + npm run dev (frontend :3000)                  │
└────────────────────────────────────────────────┘
```

### 5.3 Docker Build (Production)

```dockerfile
# Multi-stage build
Stage 1 (builder): node:20-alpine
  → npm ci
  → prisma generate
  → npm run build

Stage 2 (production): node:20-alpine
  → dumb-init (PID 1 signal handling)
  → Non-root user (nodejs:1001)
  → npm ci --omit=dev
  → prisma generate
  → CMD: migrate deploy → seed → node dist/main.js
```

---

## 6. Integration Patterns

### 6.1 Payment Webhook Flow

```
Kaspi Pay                    Backend                     Database
    │                           │                           │
    │── POST /payments/webhook/kaspi ──▶│                   │
    │   { orderId, status, signature }  │                   │
    │                           │── Verify HMAC signature   │
    │                           │── Find payment by orderId │
    │                           │── Update payment status ──▶│
    │                           │── Trigger downstream:      │
    │                           │   - Unlock test session    │
    │                           │   - Confirm consultation   │
    │◀── 200 OK ────────────────│                           │
```

### 6.2 AI Interpretation Flow

```
Client                  Backend                 Anthropic/Gemini
  │                        │                         │
  │── POST /ai/interpret ─▶│                         │
  │   { resultId }         │── Load result + test    │
  │                        │── Build prompt           │
  │                        │── POST /v1/messages ────▶│
  │                        │                         │── Generate
  │                        │◀── AI response ─────────│
  │                        │── Parse & structure      │
  │◀── { summary,         │                         │
  │      strengths[],      │                         │
  │      areas[],          │                         │
  │      recommendations[],│                         │
  │      needSpecialist }  │                         │
```

---

## 7. Cross-Cutting Concerns

### 7.1 Logging

- **Backend:** NestJS Logger service (structured JSON in production)
- **Frontend:** Browser console (development only)
- **Audit:** SecurityLog table for auth events and data access
- **Monitoring:** Sentry for error tracking (planned)

### 7.2 Error Handling

- **Backend:** NestJS exception filters → standardized JSON error responses
- **Frontend:** Axios interceptors → toast notifications
- **API Error Format:**
```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "error": "Bad Request"
}
```

### 7.3 Internationalization

- **Content:** All test questions/answers stored in RU + KZ
- **UI:** i18n keys with Russian/Kazakh translations
- **User preference:** `language` field on User model (RU/KZ)
- **Default:** Russian (RU)

### 7.4 Caching Strategy

| Data | Cache | TTL | Invalidation |
|------|-------|-----|-------------|
| Test catalog | Redis (planned) | 5min | On test update |
| Psychologist list | Redis (planned) | 2min | On profile update |
| Crisis resources | In-memory | 1hr | Static data |
| User session | JWT (stateless) | 15min | Token expiry |
