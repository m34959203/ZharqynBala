# Product Requirements Document (PRD)

**Product:** ZharqynBala
**Version:** 1.0
**Date:** 2026-04-02
**Status:** In Development
**Owner:** ZharqynBala Team

---

## 1. Overview

### 1.1 Problem Statement

In Kazakhstan, there is a critical shortage of school psychologists, especially in rural regions. According to the Ministry of Education, over 60% of schools lack a full-time psychologist. Parents have no accessible tools to assess the psychological state of their children (ages 10-17), leading to undetected anxiety, low self-esteem, motivational problems, and career uncertainty.

### 1.2 Product Vision

ZharqynBala ("Bright Child") is the first comprehensive online platform in Kazakhstan for psychological diagnostics and support of school-age children, providing bilingual (Russian/Kazakh) psychological testing, AI-powered interpretations, and video consultations with licensed psychologists.

### 1.3 Target Market

- **TAM (Total Addressable Market):** 3+ million school-age children (10-17) in Kazakhstan
- **SAM (Serviceable Addressable Market):** ~800K families with internet access and smartphones
- **SOM (Serviceable Obtainable Market):** 10K users in year 1

---

## 2. User Personas

### 2.1 Parent (Primary User)

| Attribute | Details |
|-----------|---------|
| **Name** | Aigul, 38 |
| **Location** | Karaganda, Kazakhstan |
| **Tech Savvy** | Medium (uses WhatsApp, Instagram, Kaspi) |
| **Pain Points** | Notices behavioral changes in 14-year-old son; nearest psychologist is 80km away; doesn't know if it's normal adolescent behavior |
| **Goal** | Quick, affordable way to understand child's psychological state and get professional advice if needed |
| **Language** | Russian (primary), Kazakh (secondary) |

### 2.2 Psychologist

| Attribute | Details |
|-----------|---------|
| **Name** | Aliya, 32 |
| **Location** | Almaty, Kazakhstan |
| **Specialization** | Child psychology, family therapy |
| **Pain Points** | Limited client base, high rent for office, clients only from Almaty |
| **Goal** | Expand reach to regions, earn additional income through online consultations |
| **Language** | Russian, Kazakh |

### 2.3 School Administrator

| Attribute | Details |
|-----------|---------|
| **Name** | Marat, 45 |
| **Location** | Zhezkazgan, Kazakhstan |
| **Role** | Deputy Director, responsible for psychological screening |
| **Pain Points** | Annual psychological screening is manual (paper forms), takes weeks to process, reports are primitive |
| **Goal** | Automate mass psychological diagnostics, get instant analytics per class/grade |
| **Language** | Russian |

### 2.4 Platform Administrator

| Attribute | Details |
|-----------|---------|
| **Role** | Technical admin |
| **Goal** | Manage users, tests, payments, psychologist verification, platform analytics |

---

## 3. User Roles & Permissions

| Permission | PARENT | PSYCHOLOGIST | SCHOOL | ADMIN |
|------------|--------|-------------|--------|-------|
| Register/Login | Yes | Yes | Yes | Yes |
| Manage child profiles | Yes | - | - | - |
| Browse/take tests | Yes | - | - | - |
| View own results | Yes | - | - | - |
| Book consultations | Yes | - | - | - |
| Make payments | Yes | - | - | - |
| Manage schedule | - | Yes | - | - |
| Accept/reject consultations | - | Yes | - | - |
| Conduct video sessions | - | Yes | - | - |
| Write patient notes | - | Yes | - | - |
| View earnings | - | Yes | - | - |
| Manage classes/students | - | - | Yes | - |
| Run group testing | - | - | Yes | - |
| View school reports | - | - | Yes | - |
| Manage all users | - | - | - | Yes |
| Verify psychologists | - | - | - | Yes |
| Manage tests (CRUD) | - | - | - | Yes |
| View payments/refunds | - | - | - | Yes |
| View platform analytics | - | - | - | Yes |
| System settings | - | - | - | Yes |

---

## 4. Functional Requirements

### 4.1 Authentication & Authorization (FR-AUTH)

| ID | Requirement | Priority | Status |
|----|------------|----------|--------|
| FR-AUTH-001 | User registration with email, password, name, phone, role | P0 | Done |
| FR-AUTH-002 | Email/password login with JWT access + refresh tokens | P0 | Done |
| FR-AUTH-003 | Token refresh mechanism (15min access / 7d refresh) | P0 | Done |
| FR-AUTH-004 | Role-based access control (PARENT, PSYCHOLOGIST, SCHOOL, ADMIN) | P0 | Done |
| FR-AUTH-005 | OAuth login (Google) | P1 | Frontend only |
| FR-AUTH-006 | OAuth login (Mail.ru) | P2 | Frontend only |
| FR-AUTH-007 | Email verification | P1 | Not done |
| FR-AUTH-008 | SMS phone verification | P1 | Not done |
| FR-AUTH-009 | Password reset via email | P1 | Not done |
| FR-AUTH-010 | Rate limiting on auth endpoints | P0 | Done |

### 4.2 User Management (FR-USER)

| ID | Requirement | Priority | Status |
|----|------------|----------|--------|
| FR-USER-001 | View/edit user profile | P0 | Done |
| FR-USER-002 | Add/edit/delete child profiles (Parent) | P0 | Done |
| FR-USER-003 | Child profiles: name, DOB, gender, school, grade | P0 | Done |
| FR-USER-004 | Avatar upload (S3) | P2 | Not done |
| FR-USER-005 | Language preference (RU/KZ) | P1 | Done |
| FR-USER-006 | Account deletion | P1 | Done |

### 4.3 Psychological Testing (FR-TEST)

| ID | Requirement | Priority | Status |
|----|------------|----------|--------|
| FR-TEST-001 | Browse test catalog with filters (category, premium) | P0 | Done |
| FR-TEST-002 | View test details (description, age range, duration, price) | P0 | Done |
| FR-TEST-003 | Start test session for a child | P0 | Done |
| FR-TEST-004 | Answer questions (multiple choice, scale, yes/no, text) | P0 | Done |
| FR-TEST-005 | Track progress within session | P0 | Done |
| FR-TEST-006 | Complete test and calculate results | P0 | Done |
| FR-TEST-007 | Bilingual questions and answers (RU/KZ) | P0 | Done |
| FR-TEST-008 | Age validation (child age vs test age range) | P1 | Done |
| FR-TEST-009 | Session auto-abandonment on timeout | P2 | Not done |
| FR-TEST-010 | Minimum 8 validated tests in seed data | P0 | Done |

### 4.4 Results & Interpretation (FR-RESULT)

| ID | Requirement | Priority | Status |
|----|------------|----------|--------|
| FR-RESULT-001 | Calculate scores based on test configuration | P0 | Done |
| FR-RESULT-002 | Generate text interpretation based on score ranges | P0 | Done |
| FR-RESULT-003 | AI-powered detailed interpretation (Claude/Gemini) | P1 | Done |
| FR-RESULT-004 | View result history per child | P0 | Done |
| FR-RESULT-005 | Download result as PDF report | P1 | Partial (Puppeteer disabled in Docker) |
| FR-RESULT-006 | Recalculate results with updated scoring | P2 | Done |

### 4.5 Consultations (FR-CONSULT)

| ID | Requirement | Priority | Status |
|----|------------|----------|--------|
| FR-CONSULT-001 | Browse available psychologists (public) | P0 | Done |
| FR-CONSULT-002 | View psychologist profile and available slots | P0 | Done |
| FR-CONSULT-003 | Book consultation for a date/time | P0 | Done |
| FR-CONSULT-004 | Psychologist confirms/rejects booking | P0 | Done |
| FR-CONSULT-005 | Video consultation via Jitsi Meet | P0 | Done |
| FR-CONSULT-006 | Complete consultation and leave review | P0 | Done |
| FR-CONSULT-007 | Cancel consultation (client or psychologist) | P0 | Done |
| FR-CONSULT-008 | Mark no-show | P1 | Done |
| FR-CONSULT-009 | Psychologist clinical notes (PatientNote) | P1 | Done |

### 4.6 Payments (FR-PAY)

| ID | Requirement | Priority | Status |
|----|------------|----------|--------|
| FR-PAY-001 | Create payment for test/consultation/subscription | P0 | Done (mock) |
| FR-PAY-002 | Kaspi Pay integration | P0 | Mock URL only |
| FR-PAY-003 | Kaspi webhook processing | P0 | Structure done |
| FR-PAY-004 | Payment history | P0 | Done |
| FR-PAY-005 | Admin refund | P1 | DB only (no provider API) |
| FR-PAY-006 | Free tests (price=0) auto-complete | P0 | Done |
| FR-PAY-007 | Subscription plans (BASIC/STANDARD/PREMIUM/FAMILY) | P2 | Schema only |

### 4.7 School Portal (FR-SCHOOL)

| ID | Requirement | Priority | Status |
|----|------------|----------|--------|
| FR-SCHOOL-001 | Create/manage school profile | P1 | Done |
| FR-SCHOOL-002 | Manage classes (grade + letter + year) | P1 | Done |
| FR-SCHOOL-003 | Add/import students | P1 | Done |
| FR-SCHOOL-004 | Assign group tests to classes | P1 | Done |
| FR-SCHOOL-005 | View school statistics | P1 | Done |
| FR-SCHOOL-006 | Generate school reports | P1 | Done |

### 4.8 Admin Panel (FR-ADMIN)

| ID | Requirement | Priority | Status |
|----|------------|----------|--------|
| FR-ADMIN-001 | Dashboard with key metrics | P0 | Done |
| FR-ADMIN-002 | User management (list, edit, ban/unban, delete) | P0 | Done |
| FR-ADMIN-003 | Test management (CRUD, toggle active) | P0 | Done |
| FR-ADMIN-004 | Psychologist verification | P0 | Done |
| FR-ADMIN-005 | Payment oversight and refunds | P1 | Done (partial) |
| FR-ADMIN-006 | Analytics (users, tests, revenue, children) | P1 | Done |
| FR-ADMIN-007 | Analytics export (JSON/CSV) | P2 | Done |
| FR-ADMIN-008 | System settings persistence | P2 | Not done (mock) |

### 4.9 Notifications (FR-NOTIF)

| ID | Requirement | Priority | Status |
|----|------------|----------|--------|
| FR-NOTIF-001 | Email notifications (SendGrid) | P1 | Service exists, not integrated |
| FR-NOTIF-002 | SMS notifications (Mobizon) | P1 | Service exists, not integrated |
| FR-NOTIF-003 | Push notifications (Web Push) | P2 | In-memory, not persistent |
| FR-NOTIF-004 | Crisis alerts to parents | P0 | Logged only, not sent |

---

## 5. Non-Functional Requirements

### 5.1 Performance (NFR-PERF)

| ID | Requirement | Target |
|----|------------|--------|
| NFR-PERF-001 | API response time (95th percentile) | < 500ms |
| NFR-PERF-002 | Page load time (LCP) | < 2.5s |
| NFR-PERF-003 | Concurrent users | 500+ |
| NFR-PERF-004 | Database query time | < 100ms |

### 5.2 Security (NFR-SEC)

| ID | Requirement | Target |
|----|------------|--------|
| NFR-SEC-001 | HTTPS everywhere | TLS 1.2+ |
| NFR-SEC-002 | Password hashing | bcrypt (12 rounds) |
| NFR-SEC-003 | JWT token expiration | 15min access / 7d refresh |
| NFR-SEC-004 | Rate limiting | 100 req/min per IP |
| NFR-SEC-005 | Input sanitization | XSS protection middleware |
| NFR-SEC-006 | CORS policy | Whitelist origins |
| NFR-SEC-007 | PDPL compliance (Kazakhstan) | Personal data protection |
| NFR-SEC-008 | Children's data protection | Enhanced privacy for minors |

### 5.3 Reliability (NFR-REL)

| ID | Requirement | Target |
|----|------------|--------|
| NFR-REL-001 | Uptime SLA | 99.5% |
| NFR-REL-002 | Automatic restart on failure | Max 10 retries |
| NFR-REL-003 | Database backup | Daily |
| NFR-REL-004 | Health checks | Every 30s |

### 5.4 Accessibility & Localization (NFR-A11Y)

| ID | Requirement | Target |
|----|------------|--------|
| NFR-A11Y-001 | Languages supported | Russian, Kazakh |
| NFR-A11Y-002 | Mobile responsive | All screen sizes |
| NFR-A11Y-003 | PWA support | Offline page, installable |
| NFR-A11Y-004 | Touch targets | Minimum 44px |

---

## 6. Business Model

### 6.1 Revenue Streams

| Stream | Model | Price |
|--------|-------|-------|
| Individual tests | Per-test purchase | 3,000 - 5,000 KZT |
| Free tests | Lead generation | 0 KZT |
| Consultations | Commission from psychologists | 15-20% |
| Family subscriptions | Monthly recurring | 5,000 KZT/month |
| School packages | Annual B2B contract | 180,000 KZT/year |
| Premium courses | Content purchase | TBD |

### 6.2 Key Metrics (KPIs)

| Metric | 3 months | 6 months | 12 months |
|--------|----------|----------|-----------|
| MAU | 500 | 2,000 | 10,000 |
| Paid conversion | 3% | 5% | 7% |
| Revenue (KZT/month) | 210,000 | 800,000 | 2,790,000 |
| School contracts | 2 | 8 | 20 |
| Active psychologists | 5 | 15 | 40 |

### 6.3 Break-even

- **Timeline:** 6-8 months
- **ROI at 12 months:** 300-500%

---

## 7. Success Criteria

### MVP Launch (v1.0)

- [ ] 8+ validated psychological tests (bilingual)
- [ ] Working payment flow (Kaspi Pay)
- [ ] At least 5 verified psychologists onboarded
- [ ] Video consultations functional
- [ ] PDF report generation working
- [ ] 100+ registered users in first month

### Product-Market Fit (v2.0)

- [ ] NPS > 50
- [ ] 30-day retention > 40%
- [ ] 2+ school contracts signed
- [ ] Revenue covers operational costs

---

## 8. Risks & Mitigations

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| Test methodology not certified | High | High | Partner with certified psychologists; add disclaimers |
| Low user acquisition | Medium | High | Free tests as lead magnets; school partnerships |
| Psychologist supply shortage | Medium | Medium | Competitive commission; ease of use |
| Data breach (children's data) | Low | Critical | PDPL compliance; encryption; security audits |
| Kaspi Pay integration delays | Medium | High | Mock mode for testing; alternative PayBox |
| Competitor entry | Low | Medium | First-mover advantage; localization depth |

---

## 9. Glossary

| Term | Definition |
|------|-----------|
| **Test** | A psychological diagnostic instrument with scored questions |
| **TestSession** | An instance of a user taking a specific test |
| **Result** | Calculated scores and interpretation from a completed session |
| **Consultation** | A scheduled video session between psychologist and client |
| **PDPL** | Personal Data Protection Law of the Republic of Kazakhstan |
| **Kaspi Pay** | Dominant payment system in Kazakhstan (90%+ market share) |
| **Jitsi Meet** | Open-source video conferencing platform |
