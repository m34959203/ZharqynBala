# Contributing Guide

**Project:** ZharqynBala
**Date:** 2026-04-02

---

## 1. Getting Started

### 1.1 Prerequisites

- Node.js 20 LTS
- Docker & Docker Compose
- Git
- VS Code (recommended) with extensions: ESLint, Prettier, Prisma

### 1.2 Setup

See `docs/deployment/DEPLOYMENT.md` Section 2 for full local setup.

```bash
git clone https://github.com/m34959203/ZharqynBala.git
cd ZharqynBala
docker compose -f infrastructure/docker-compose.dev.yml up -d
cd backend && cp .env.example .env && npm install && npx prisma migrate dev && npx prisma db seed && npm run start:dev
cd ../frontend && cp .env.example .env.local && npm install && npm run dev
```

---

## 2. Development Workflow

### 2.1 Branch Strategy

```
main ────────────────────────────── production
  └── feature/ZB-123-description ── feature branch
  └── fix/ZB-456-bug-description ── bug fix
  └── hotfix/critical-fix ────────── emergency fix
```

**Branch naming:** `{type}/{ticket}-{short-description}`
- `feature/` — new functionality
- `fix/` — bug fix
- `refactor/` — code refactoring
- `docs/` — documentation only
- `hotfix/` — critical production fix

### 2.2 Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <description>

[optional body]
[optional footer]
```

**Types:**
- `feat` — new feature
- `fix` — bug fix
- `refactor` — code refactoring (no feature change)
- `docs` — documentation
- `test` — adding/updating tests
- `chore` — build, CI, dependencies
- `style` — formatting (no code change)

**Examples:**
```
feat(tests): add school motivation test with scoring
fix(auth): prevent token refresh race condition
refactor(payments): extract webhook verification to separate service
docs(api): update consultation endpoint examples
test(results): add unit tests for scoring service
chore(deps): update prisma to 5.9.0
```

### 2.3 Pull Request Process

1. Create feature branch from `main`
2. Make changes with commits following convention
3. Ensure all tests pass locally
4. Push branch and create PR
5. Fill PR template (description, test plan, screenshots)
6. Request review
7. Address review comments
8. Squash merge to `main`

**PR Title:** Same format as commit messages

**PR Description Template:**
```markdown
## Summary
Brief description of changes.

## Changes
- Added X
- Fixed Y
- Updated Z

## Test Plan
- [ ] Unit tests added/updated
- [ ] E2E tests pass
- [ ] Manual testing done

## Screenshots (if UI changes)
```

---

## 3. Code Standards

### 3.1 TypeScript

- Strict mode enabled
- No `any` types (use proper types or `unknown`)
- Interfaces for data shapes, types for unions
- Async/await over Promises

### 3.2 Backend (NestJS)

- One module per domain (e.g., `modules/tests/`)
- Each module: `*.module.ts`, `*.controller.ts`, `*.service.ts`, `dto/`
- Use DTOs with `class-validator` decorators for all inputs
- Use `@ApiTags`, `@ApiOperation`, `@ApiResponse` for Swagger
- Use NestJS `Logger` (not `console.log`)
- Guard all endpoints (default JWT + explicit `@Public()` or `@Roles()`)

**Module structure:**
```
modules/feature-name/
├── feature-name.module.ts       # Module definition
├── feature-name.controller.ts   # HTTP endpoints
├── feature-name.service.ts      # Business logic
└── dto/
    ├── create-feature.dto.ts    # Input validation
    └── feature-response.dto.ts  # Response shape
```

### 3.3 Frontend (Next.js)

- App Router (not Pages Router)
- Server components by default, `'use client'` only when needed
- Tailwind CSS for styling (no inline styles, no CSS modules)
- Components in `components/` (reusable) or co-located with pages
- API calls through `lib/api.ts` (centralized Axios client)
- Forms with `react-hook-form` + `zod` validation

### 3.4 Database

- Prisma schema is source of truth
- Never write raw SQL in application code
- Create migration for every schema change
- Seed data must be idempotent (use `upsert`)
- Bilingual fields: `fieldRu` + `fieldKz` pattern

### 3.5 Formatting

- **ESLint:** `npm run lint` (must pass, no warnings)
- **Prettier:** `npm run format` (auto-format)
- Settings: 2-space indent, single quotes, trailing commas, 100 char line width

```bash
# Check
cd backend && npm run lint
cd frontend && npm run lint

# Auto-fix
cd backend && npm run lint -- --fix
cd backend && npm run format
```

---

## 4. Testing Requirements

### 4.1 When to Write Tests

| Change | Required Tests |
|--------|---------------|
| New API endpoint | Unit test for service + E2E test |
| Bug fix | Regression test that reproduces the bug |
| New scoring logic | Unit test with known inputs/outputs |
| New UI page | Playwright E2E test for happy path |
| Refactor | Existing tests must still pass |

### 4.2 Running Tests

```bash
# Backend unit tests
cd backend && npm run test

# Backend E2E tests
cd backend && npm run test:e2e

# Frontend E2E tests
cd frontend && npx playwright test
```

---

## 5. Adding a Psychological Test

See `docs/ADDING_TESTS.md` for detailed guide.

Quick checklist:
1. Define test data (title RU/KZ, questions, options, scores)
2. Add to seed: `backend/prisma/seed.ts`
3. Add scoring logic: `backend/src/modules/results/scoring.service.ts`
4. Run seed: `npx prisma db seed`
5. Verify in Swagger / frontend

---

## 6. Project Structure Reference

| Path | Description |
|------|------------|
| `docs/product/PRD.md` | Product requirements |
| `docs/product/SRS.md` | Software requirements (IEEE 830) |
| `docs/architecture/ARCHITECTURE.md` | System architecture (C4 model) |
| `docs/architecture/DATABASE.md` | Database schema & data dictionary |
| `docs/api/API_SPEC.md` | API specification (OpenAPI) |
| `docs/security/SECURITY_POLICY.md` | Security policy (OWASP) |
| `docs/testing/TEST_STRATEGY.md` | Test strategy (IEEE 829) |
| `docs/deployment/DEPLOYMENT.md` | Deployment & operations |
| `docs/adr/ADR-*.md` | Architecture Decision Records |
| `DEVELOPER_GUIDE.md` | Quick reference for developers |
| `CHANGELOG.md` | Version history |

---

## 7. Getting Help

- **Documentation:** `docs/` directory
- **API docs:** `http://localhost:3001/api/docs` (Swagger)
- **Database GUI:** `npx prisma studio`
- **Email tests:** `http://localhost:8025` (MailHog)
