# Changelog

All notable changes to the ZharqynBala project are documented in this file.

Format based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).
This project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### To Do
- Real Kaspi Pay integration (currently mock)
- Password reset flow (forgot-password)
- Email/SMS notification integration
- PDF generation fix (Puppeteer/Chromium in Docker)
- Mobile app UI (React Native screens)
- CI/CD pipeline (GitHub Actions)
- Parental consent flow (PDPL compliance)

### Known Issues
- CSP allows `unsafe-eval` (security.middleware.ts)
- Auth cookies set with `httpOnly: false` (11 API routes)
- Hardcoded admin emails in auth.service.ts
- Migration #8 (update_consultations) has stuck state in production
- Push notification subscriptions stored in-memory (lost on restart)

---

## [0.9.0] - 2026-01-10

### Added
- Patient notes system for psychologist consultations
  - CRUD endpoints (POST/GET/PUT/DELETE /patient-notes)
  - Clinical fields: chief complaint, diagnosis, treatment plan
  - Role-restricted to PSYCHOLOGIST

### Changed
- Consultation status enum updated with new states

---

## [0.8.0] - 2026-01-09

### Added
- Psychologist schedule management
  - ScheduleSlot model (date + hour granularity)
  - CRUD endpoints for psychologists
  - Public endpoint for viewing availability
- Languages array field on psychologist profiles

### Changed
- All existing psychologists auto-approved (data migration)

---

## [0.7.0] - 2026-01-07

### Added
- Test scoring configuration
  - `scoring_type` field (percentage / absolute)
  - `interpretation_config` JSON field for score ranges
  - ScoringService for flexible result calculation
- Answer option metadata (JSONB) for advanced scoring

---

## [0.6.0] - 2026-01-06

### Added
- New test categories: SOCIAL, COGNITIVE
- Extended TestCategory enum

---

## [0.5.0] - 2025-12-24

### Added
- AI module (Claude + Gemini integration)
  - Test result interpretation
  - Chat assistant
  - Methodology parsing (admin)
  - Test creation from parsed methodology
- Admin module with full dashboard
  - User management (CRUD, ban/unban)
  - Test management (CRUD, toggle)
  - Payment oversight and refunds
  - Psychologist verification
  - Analytics and reports
  - Demo data cleanup
- Analytics module (users, tests, revenue, export)
- Crisis module (hotline resources for Kazakhstan)
- PDF generation module (Puppeteer)
  - Result PDFs
  - Child progress reports
  - School reports
- Notification services (email, SMS, push)
- School module (classes, students, import, group testing, reports)
- Security middleware (CSP, XSS sanitizer, request sanitizer)
- Audit logging (SecurityLog table)

### Changed
- Comprehensive seed data (8 tests, 4 users, 2 psychologists)
- Bilingual content for all tests (Russian + Kazakh)

---

## [0.4.0] - 2025-12-15

### Added
- Consultation system
  - Booking, confirmation, rejection, completion flow
  - Jitsi Meet integration for video calls
  - Rating and review system
- Psychologist profiles and marketplace
  - Public listing with filters
  - Availability management
  - Client list and earnings tracking
- Payment module
  - Kaspi Pay structure (webhook endpoint)
  - Payment creation and history
  - Free item auto-completion

---

## [0.3.0] - 2025-12-10

### Added
- Psychological testing engine
  - Test catalog with categories and filters
  - Test session management (start, answer, complete)
  - Question types: MULTIPLE_CHOICE, SCALE, YES_NO, TEXT
  - Bilingual questions and answers
- Results module
  - Score calculation
  - Interpretation generation
  - Result history per child

---

## [0.2.0] - 2025-12-08

### Added
- Frontend application (Next.js 16)
  - Landing page
  - Login and registration pages
  - Protected route layout with role-based navigation
  - Dashboard pages (Parent, Psychologist, School, Admin)
  - Test catalog and test-taking interface
  - Result viewing with charts
  - Consultation management
  - Admin panel (users, tests, payments, analytics)
  - PWA support (service worker, offline page)
- NextAuth.js integration (Credentials + Google + Mail.ru)
- Axios API client with token refresh interceptor

---

## [0.1.0] - 2025-12-05

### Added
- Initial project setup
- Backend (NestJS 10)
  - Authentication module (register, login, refresh, logout)
  - Users module (profile CRUD, child profiles)
  - JWT + Passport authentication
  - Role-based access control (4 roles)
  - Prisma ORM with PostgreSQL
  - Swagger API documentation
  - Health check endpoint
  - Rate limiting (Throttler)
  - Helmet security headers
  - Docker infrastructure (PostgreSQL, Redis, MailHog)
  - Dockerfile for production deployment
  - Railway.app configuration
- Database schema (20+ tables)
- E2E tests (auth, tests, children, results)
- Unit tests (auth, users, tests)

---

## Version History

| Version | Date | Highlights |
|---------|------|-----------|
| 0.9.0 | 2026-01-10 | Patient notes system |
| 0.8.0 | 2026-01-09 | Psychologist scheduling |
| 0.7.0 | 2026-01-07 | Flexible scoring system |
| 0.6.0 | 2026-01-06 | New test categories |
| 0.5.0 | 2025-12-24 | AI, Admin, Analytics, PDF, Schools, Security |
| 0.4.0 | 2025-12-15 | Consultations, Psychologists, Payments |
| 0.3.0 | 2025-12-10 | Testing engine, Results |
| 0.2.0 | 2025-12-08 | Frontend, NextAuth, PWA |
| 0.1.0 | 2025-12-05 | Initial backend, Auth, Users, Database |
