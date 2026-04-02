# Test Strategy

**Standard:** IEEE 829 / ISTQB Foundation
**Product:** ZharqynBala Platform
**Version:** 1.0
**Date:** 2026-04-02

---

## 1. Test Scope

### 1.1 In Scope

| Component | Test Types |
|-----------|-----------|
| Backend API (NestJS) | Unit, Integration, E2E |
| Frontend (Next.js) | Component, E2E |
| Database (Prisma) | Migration, Seed validation |
| Authentication | Security, Functional |
| Payment flow | Integration (mock), E2E |
| API contracts | Contract testing |

### 1.2 Out of Scope

- Mobile app (no UI implemented yet)
- Third-party service internals (Kaspi Pay, Jitsi Meet)
- Performance/load testing (Phase 3)
- Penetration testing (separate engagement)

---

## 2. Test Levels

### 2.1 Unit Tests

**Tool:** Jest
**Location:** `backend/src/**/*.spec.ts`
**Coverage target:** 70% (lines)

**What to test:**
- Service methods (business logic)
- DTO validation rules
- Scoring algorithms (ScoringService)
- AI prompt construction
- Utility functions

**Existing tests:**
| File | Coverage |
|------|----------|
| `auth.service.spec.ts` | Auth logic (register, login, token generation) |
| `auth.controller.spec.ts` | Controller method contracts |
| `users.service.spec.ts` | User CRUD operations |
| `tests.service.spec.ts` | Test listing, session management |

**Priority additions needed:**
| File | Reason |
|------|--------|
| `results/scoring.service.spec.ts` | Core business logic — score calculation |
| `consultations/consultations.service.spec.ts` | Complex state machine |
| `payments/payments.service.spec.ts` | Financial transactions |
| `payments/kaspi.service.spec.ts` | Webhook signature verification |

```bash
# Run unit tests
cd backend && npm run test

# Run with coverage
cd backend && npm run test:cov

# Run specific test
cd backend && npx jest --testPathPattern=auth.service
```

### 2.2 Integration Tests

**Tool:** Jest + Supertest
**Location:** `backend/test/*.e2e-spec.ts`
**Database:** Test PostgreSQL instance (isolated)

**What to test:**
- Full request/response cycle through controllers
- Database state changes
- Authentication guard enforcement
- Role-based access control
- Error response formats

**Existing tests:**
| File | Coverage |
|------|----------|
| `auth.e2e-spec.ts` | Register → Login → Refresh → Logout flow |
| `tests.e2e-spec.ts` | List tests → Start session → Answer → Complete |
| `children.e2e-spec.ts` | CRUD child profiles |
| `results.e2e-spec.ts` | Result retrieval, PDF generation |

**Priority additions needed:**
| File | Reason |
|------|--------|
| `consultations.e2e-spec.ts` | Full booking → confirm → complete flow |
| `payments.e2e-spec.ts` | Payment creation, webhook processing |
| `admin.e2e-spec.ts` | Admin operations, RBAC enforcement |
| `psychologists.e2e-spec.ts` | Profile management, schedule CRUD |

```bash
# Run E2E tests
cd backend && npm run test:e2e

# Run specific E2E test
cd backend && npx jest --config ./test/jest-e2e.json --testPathPattern=auth
```

### 2.3 Frontend E2E Tests

**Tool:** Playwright
**Location:** `frontend/e2e/*.spec.ts`
**Config:** `frontend/playwright.config.ts`

**What to test:**
- User registration and login flows
- Navigation and routing (role-based)
- Test catalog browsing and test-taking
- Result viewing
- Consultation booking
- Admin panel operations

**Existing tests:**
| File | Scenarios |
|------|----------|
| `auth.spec.ts` | Login form, registration, logout |
| `landing.spec.ts` | Landing page elements |
| `tests.spec.ts` | Test browsing |
| `results.spec.ts` | Result viewing |
| `consultations.spec.ts` | Consultation list |
| `children.spec.ts` | Child profile management |

```bash
# Run Playwright tests
cd frontend && npx playwright test

# Run with UI
cd frontend && npx playwright test --ui

# Run specific test
cd frontend && npx playwright test auth.spec.ts
```

---

## 3. Test Data Strategy

### 3.1 Seed Data

The project uses Prisma seed (`backend/prisma/seed.ts`) for consistent test data:

| Entity | Test Data |
|--------|----------|
| Admin | admin@zharqynbala.kz / Admin123! |
| Parent | parent@test.kz / Parent123! (with 1 child) |
| Psychologist 1 | psychologist@test.kz / Psychologist123! (8yr experience) |
| Psychologist 2 | psychologist2@test.kz / Psychologist123! (12yr experience) |
| Tests | 8 bilingual tests (4 free, 4 premium) |

### 3.2 Test Data Isolation

- Each E2E test suite should create its own data and clean up after
- Use `beforeAll` / `afterAll` for setup/teardown
- Never depend on data from other test suites
- `DELETE /admin/cleanup-demo` available for full reset

---

## 4. Critical Test Scenarios

### 4.1 Authentication (Priority: P0)

| # | Scenario | Expected Result |
|---|---------|----------------|
| T-AUTH-01 | Register with valid data | 201, tokens returned |
| T-AUTH-02 | Register with duplicate email | 409 Conflict |
| T-AUTH-03 | Login with valid credentials | 200, tokens returned |
| T-AUTH-04 | Login with wrong password | 401 Unauthorized |
| T-AUTH-05 | Access protected endpoint without token | 401 |
| T-AUTH-06 | Access admin endpoint as PARENT | 403 |
| T-AUTH-07 | Refresh token flow | New token pair returned |
| T-AUTH-08 | Use expired refresh token | 401 |
| T-AUTH-09 | Rate limit on login (>10 attempts/min) | 429 |

### 4.2 Testing Flow (Priority: P0)

| # | Scenario | Expected Result |
|---|---------|----------------|
| T-TEST-01 | List all active tests | Array of tests with question counts |
| T-TEST-02 | Start test for child within age range | Session created, status=IN_PROGRESS |
| T-TEST-03 | Start test for child outside age range | 400 Bad Request |
| T-TEST-04 | Submit answer for valid question | Answer recorded, progress updated |
| T-TEST-05 | Submit answer for wrong test's question | 400 Bad Request |
| T-TEST-06 | Complete test session | Status=COMPLETED, result calculated |
| T-TEST-07 | Access other user's session | 403 Forbidden |

### 4.3 Consultation Flow (Priority: P0)

| # | Scenario | Expected Result |
|---|---------|----------------|
| T-CONS-01 | Book consultation with available psychologist | Status=PENDING |
| T-CONS-02 | Psychologist confirms | Status=CONFIRMED |
| T-CONS-03 | Psychologist rejects | Status=REJECTED |
| T-CONS-04 | Client cancels PENDING | Status=CANCELLED |
| T-CONS-05 | Start video session (CONFIRMED) | Status=IN_PROGRESS, Jitsi config returned |
| T-CONS-06 | Complete consultation | Status=COMPLETED |
| T-CONS-07 | Rate completed consultation | Rating stored (1-5) |
| T-CONS-08 | Book for unavailable slot | 400 Bad Request |

### 4.4 Payment Flow (Priority: P0)

| # | Scenario | Expected Result |
|---|---------|----------------|
| T-PAY-01 | Create payment (KASPI) | Payment created, URL returned |
| T-PAY-02 | Free test (price=0) | Auto-completed |
| T-PAY-03 | Kaspi webhook with valid signature | Payment status updated |
| T-PAY-04 | Kaspi webhook with invalid signature | 401, payment unchanged |
| T-PAY-05 | Admin refund | Status=REFUNDED |

---

## 5. Quality Gates

### 5.1 Pre-Commit

- ESLint passes (no errors)
- Prettier formatting applied
- TypeScript compilation (no errors)

### 5.2 Pre-Merge (CI/CD — planned)

- All unit tests pass
- All E2E tests pass
- Code coverage >= 70%
- No new CRITICAL/HIGH security findings
- `npm audit` — no critical vulnerabilities

### 5.3 Pre-Release

- All test levels pass
- Manual smoke test on staging
- Security checklist reviewed
- Performance baseline met (p95 < 500ms)
- Bilingual content complete for new features

---

## 6. Test Environment

| Environment | Purpose | Database | External Services |
|------------|---------|----------|-------------------|
| **Local** | Developer testing | Docker PostgreSQL | Mocked |
| **CI** | Automated pipeline | Ephemeral PostgreSQL | Mocked |
| **Staging** | Pre-production validation | Railway PostgreSQL (staging) | Sandbox APIs |
| **Production** | Smoke tests only | Production DB (read-only tests) | Live APIs |

---

## 7. Bug Severity Classification

| Severity | Definition | SLA |
|----------|-----------|-----|
| **S1 — Critical** | System down, data loss, security breach | Fix within 4 hours |
| **S2 — High** | Major feature broken, no workaround | Fix within 24 hours |
| **S3 — Medium** | Feature impaired, workaround exists | Fix within 1 week |
| **S4 — Low** | Cosmetic, minor inconvenience | Fix in next release |
