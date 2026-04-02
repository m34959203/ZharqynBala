# Software Requirements Specification (SRS)

**Standard:** IEEE 830-1998 / ISO/IEC/IEEE 29148:2018
**Product:** ZharqynBala Platform
**Version:** 1.0
**Date:** 2026-04-02

---

## 1. Introduction

### 1.1 Purpose

This document specifies the software requirements for the ZharqynBala platform — an online psychological diagnostics and support system for school-age children (10-17 years) in Kazakhstan. It is intended for developers, testers, and stakeholders involved in the project.

### 1.2 Scope

The system consists of:
- **Backend API** (NestJS) — business logic, data persistence, integrations
- **Frontend Web Application** (Next.js) — user interface for all roles
- **Mobile Application** (React Native/Expo) — planned, currently API client only
- **Infrastructure** — Docker, PostgreSQL, Redis, Railway.app

### 1.3 Definitions & Abbreviations

| Abbreviation | Definition |
|-------------|-----------|
| JWT | JSON Web Token |
| RBAC | Role-Based Access Control |
| PDPL | Personal Data Protection Law (Kazakhstan) |
| KZT | Kazakhstani Tenge (currency) |
| SPA | Single Page Application |
| SSR | Server-Side Rendering |
| PWA | Progressive Web Application |
| CRUD | Create, Read, Update, Delete |
| DTO | Data Transfer Object |
| ORM | Object-Relational Mapping |

### 1.4 References

- PRD: `docs/product/PRD.md`
- API Reference: `docs/api/API_SPEC.md`
- Architecture: `docs/architecture/ARCHITECTURE.md`
- Security Policy: `docs/security/SECURITY_POLICY.md`

---

## 2. Overall Description

### 2.1 Product Perspective

ZharqynBala is a standalone web-based platform. It interfaces with:
- **Kaspi Pay** — payment processing (Kazakhstan market)
- **Jitsi Meet** — video conferencing (open-source, self-hosted or public)
- **Anthropic Claude / Google Gemini** — AI interpretation of test results
- **SendGrid** — transactional email
- **Mobizon** — SMS notifications (Kazakhstan)

### 2.2 Product Functions (High-Level)

```
F1. User Authentication & Authorization
F2. Child Profile Management
F3. Psychological Test Engine
F4. Result Calculation & AI Interpretation
F5. Psychologist Marketplace
F6. Consultation Booking & Video Sessions
F7. Payment Processing
F8. School Mass Diagnostics
F9. Administrative Management
F10. Notification System
F11. PDF Report Generation
F12. Analytics & Reporting
```

### 2.3 User Classes

| Class | Description | Access Level |
|-------|-----------|-------------|
| **Anonymous** | Unregistered visitor | Public endpoints only |
| **Parent** | Registered parent with child profiles | Standard user features |
| **Psychologist** | Verified mental health professional | Consultation, schedule, notes |
| **School** | School administrator account | Mass testing, class management |
| **Admin** | Platform administrator | Full system access |

### 2.4 Operating Environment

| Component | Requirement |
|-----------|------------|
| Server OS | Linux (Ubuntu 24.04 / Alpine) |
| Runtime | Node.js 20 LTS |
| Database | PostgreSQL 15+ |
| Cache | Redis 7+ (optional) |
| Client | Modern browsers (Chrome 90+, Firefox 90+, Safari 15+, Edge 90+) |
| Mobile | iOS 15+ / Android 10+ (future) |

### 2.5 Constraints

- All user-facing content must be available in Russian and Kazakh
- Payment integration must support Kaspi Pay (dominant in Kazakhstan)
- Children's personal data must comply with Kazakhstan PDPL
- Platform must function on low-bandwidth connections (regions)
- Video consultations require WebRTC-capable browser

### 2.6 Assumptions & Dependencies

- Users have email and phone number
- Kaspi Pay API is available and documented
- Jitsi Meet public servers or self-hosted instance available
- AI API keys (Anthropic or Google) provisioned
- Railway.app or equivalent PaaS for hosting

---

## 3. System Features

### 3.1 Authentication System (F1)

**Priority:** P0 (Critical)

#### 3.1.1 Description

Multi-strategy authentication supporting email/password and OAuth providers, with JWT-based session management and role-based access control.

#### 3.1.2 Functional Requirements

| ID | Requirement | Input | Output | Validation |
|----|------------|-------|--------|------------|
| SRS-AUTH-001 | Register new user | email, password, firstName, lastName, phone, role, language | JWT tokens + user object | Email unique; password min 8 chars, 1 upper, 1 number; phone format +7XXXXXXXXXX |
| SRS-AUTH-002 | Login with credentials | email, password | JWT access token (15min) + refresh token (7d) | Email exists; password matches bcrypt hash |
| SRS-AUTH-003 | Refresh access token | refreshToken | New access token + new refresh token | Refresh token valid and not expired; matches DB record |
| SRS-AUTH-004 | Logout | Authorization header | 200 OK | Clears refresh token from DB |
| SRS-AUTH-005 | Get current user | Authorization header | User object with role | Valid JWT in header |
| SRS-AUTH-006 | Rate limit auth endpoints | IP address | 429 Too Many Requests | Max 10 attempts per minute per IP |

#### 3.1.3 Security Requirements

- Passwords hashed with bcrypt (cost factor 12)
- JWT signed with HS256 using server-side secret
- Refresh tokens stored as bcrypt hashes in database
- Access tokens are stateless (not stored)
- CORS restricted to configured origins
- Helmet security headers on all responses

### 3.2 Psychological Testing Engine (F3)

**Priority:** P0 (Critical)

#### 3.2.1 Description

A bilingual test-taking system that presents questions, collects answers, tracks progress, and triggers result calculation upon completion.

#### 3.2.2 Functional Requirements

| ID | Requirement | Details |
|----|------------|---------|
| SRS-TEST-001 | List available tests | Filter by category (8 types), isPremium; sort by order; include question count |
| SRS-TEST-002 | Get test details | Return test metadata + all questions with answer options (RU & KZ) |
| SRS-TEST-003 | Start test session | Create TestSession record; validate child's age against test ageMin/ageMax; set status=IN_PROGRESS |
| SRS-TEST-004 | Submit answer | Record answer in Answer table; validate questionId belongs to test; validate answerOptionId belongs to question |
| SRS-TEST-005 | Complete session | Set status=COMPLETED; set completedAt timestamp; trigger result calculation |
| SRS-TEST-006 | Resume session | Return current progress (answered questions count / total) |

#### 3.2.3 Question Types

| Type | Description | Score Calculation |
|------|-----------|-------------------|
| MULTIPLE_CHOICE | Select one option from list | Score of selected AnswerOption |
| SCALE | Numeric scale (e.g., 1-5, 1-10) | Score of selected AnswerOption |
| YES_NO | Binary choice | Score of selected AnswerOption |
| TEXT | Free-text response | Manual scoring (0 by default) |

#### 3.2.4 Scoring Types

| Type | Formula | Interpretation |
|------|---------|---------------|
| percentage | (totalScore / maxPossibleScore) * 100 | Mapped to interpretation ranges |
| absolute | Sum of all answer scores | Mapped to interpretation ranges |

### 3.3 Consultation System (F6)

**Priority:** P0 (Critical)

#### 3.3.1 State Machine

```
                    ┌──── REJECTED
                    │
PENDING ──── CONFIRMED ──── IN_PROGRESS ──── COMPLETED
   │              │              │
   │              │              └──── NO_SHOW
   │              │
   └──── CANCELLED (by client)
                  └──── CANCELLED (by psychologist)
```

#### 3.3.2 Functional Requirements

| ID | Requirement | Pre-condition | Post-condition |
|----|------------|---------------|----------------|
| SRS-CONSULT-001 | Book consultation | Parent authenticated; psychologist has available slot; payment created | Consultation status=PENDING; slot marked unavailable |
| SRS-CONSULT-002 | Confirm consultation | Psychologist authenticated; status=PENDING | Status=CONFIRMED; notification sent to parent |
| SRS-CONSULT-003 | Start video session | Status=CONFIRMED; both parties authenticated | Status=IN_PROGRESS; Jitsi room created |
| SRS-CONSULT-004 | Complete consultation | Psychologist authenticated; status=IN_PROGRESS | Status=COMPLETED; completedAt set |
| SRS-CONSULT-005 | Cancel consultation | Status in [PENDING, CONFIRMED]; authorized party | Status=CANCELLED; cancelReason stored |
| SRS-CONSULT-006 | Rate consultation | Status=COMPLETED; client authenticated | Rating (1-5) and review stored |

### 3.4 Payment Processing (F7)

**Priority:** P0 (Critical)

#### 3.4.1 Functional Requirements

| ID | Requirement | Details |
|----|------------|---------|
| SRS-PAY-001 | Create payment | Types: DIAGNOSTIC, CONSULTATION, SUBSCRIPTION; Providers: KASPI, PAYBOX; Amount in KZT |
| SRS-PAY-002 | Process webhook | Verify signature (HMAC); update payment status; trigger downstream actions |
| SRS-PAY-003 | Free items | Amount=0 auto-complete with status=COMPLETED |
| SRS-PAY-004 | Payment history | List user's payments with pagination and status filter |
| SRS-PAY-005 | Admin refund | Change status to REFUNDED; trigger provider API refund |

---

## 4. Data Requirements

### 4.1 Data Model Overview

The system uses 20+ PostgreSQL tables managed through Prisma ORM. Full schema: `backend/prisma/schema.prisma` (712 lines).

**Core Entities:**
- User (authentication, profile)
- Child (linked to Parent)
- Psychologist (linked to User, 1:1)
- School (linked to User, 1:1)
- Test → Question → AnswerOption
- TestSession → Answer → Result
- Consultation → PatientNote
- Payment, Subscription
- ScheduleSlot, PsychologistAvailability
- SchoolClass → Student → GroupTest
- SecurityLog
- Course → Lesson

### 4.2 Data Retention

| Data Type | Retention | Rationale |
|-----------|----------|-----------|
| User accounts | Until deletion requested | PDPL compliance |
| Test results | 5 years | Clinical record standard |
| Consultation records | 5 years | Clinical record standard |
| Patient notes | 5 years | Clinical record standard |
| Payment records | 7 years | Tax/accounting requirements |
| Security logs | 1 year | Audit trail |
| Refresh tokens | 7 days (auto-expire) | Security |

### 4.3 Backup Requirements

- Database: Daily automated backups
- File storage (S3): Versioning enabled
- Recovery Point Objective (RPO): 24 hours
- Recovery Time Objective (RTO): 4 hours

---

## 5. External Interface Requirements

### 5.1 API Interface

- **Protocol:** HTTPS REST
- **Format:** JSON
- **Versioning:** URI-based (`/api/v1/`)
- **Authentication:** Bearer JWT in `Authorization` header
- **Documentation:** Swagger/OpenAPI at `/api/docs`
- **Rate Limiting:** 100 requests/minute per IP (configurable)

### 5.2 Third-Party Integrations

| Service | Purpose | Protocol | Authentication |
|---------|---------|----------|----------------|
| Kaspi Pay | Payments | HTTPS REST + Webhooks | API Key + HMAC signature |
| Jitsi Meet | Video calls | WebRTC + XMPP | JWT token per room |
| Anthropic Claude | AI interpretation | HTTPS REST | API Key |
| Google Gemini | AI interpretation (fallback) | HTTPS REST | API Key |
| SendGrid | Email | HTTPS REST | API Key |
| Mobizon | SMS | HTTPS REST | API Key |

### 5.3 User Interfaces

- **Web:** Responsive SPA (Next.js), supports desktop and mobile browsers
- **Mobile:** React Native / Expo (planned)
- **Admin:** Integrated within web application (role-gated routes)

---

## 6. Quality Attributes

### 6.1 Performance

| Metric | Requirement | Measurement |
|--------|------------|-------------|
| API Response Time | p95 < 500ms | Application metrics |
| Page Load (LCP) | < 2.5s | Lighthouse |
| Time to Interactive | < 3.5s | Lighthouse |
| Test session start | < 1s | User-perceived latency |
| PDF generation | < 10s | Server-side timing |

### 6.2 Scalability

| Tier | Users | Infrastructure |
|------|-------|---------------|
| Launch | 0-500 | Single Railway instance |
| Growth | 500-5,000 | Railway Pro + managed PostgreSQL |
| Scale | 5,000-50,000 | Kubernetes + read replicas + CDN |

### 6.3 Availability

- **Target SLA:** 99.5% uptime (monthly)
- **Planned maintenance window:** Sundays 02:00-04:00 UTC+5
- **Health monitoring:** `/health` endpoint, 30s interval
- **Auto-restart:** On failure, max 10 retries

### 6.4 Security

See `docs/security/SECURITY_POLICY.md` for full security requirements.

Key requirements:
- OWASP Top 10 compliance
- PDPL (Kazakhstan Personal Data Protection Law) compliance
- Children's data enhanced protection
- Encryption at rest and in transit
- Security audit logging

### 6.5 Maintainability

- TypeScript for type safety (backend + frontend)
- Prisma ORM for database abstraction
- Modular NestJS architecture (one module per domain)
- ESLint + Prettier for code consistency
- Automated testing (unit + e2e)

---

## 7. Acceptance Criteria

### 7.1 MVP Release

| Criterion | Metric |
|-----------|--------|
| All P0 features implemented and tested | 100% |
| API endpoint coverage by tests | > 60% |
| No CRITICAL security issues | 0 open |
| Lighthouse performance score | > 70 |
| Bilingual content coverage | 100% for tests, > 80% for UI |
| Successful payment flow (Kaspi Pay) | End-to-end tested |
| Video consultation working | Tested with 2+ participants |

### 7.2 Production Release

| Criterion | Metric |
|-----------|--------|
| All P0 + P1 features | 100% |
| API test coverage | > 80% |
| Zero known CRITICAL/HIGH bugs | 0 open |
| Load test passed | 500 concurrent users |
| Security audit completed | No HIGH findings |
| PDPL compliance verified | Legal review done |
