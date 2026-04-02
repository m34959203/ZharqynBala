# Security Policy

**Standard:** OWASP Application Security Verification Standard (ASVS) 4.0 + Kazakhstan PDPL
**Product:** ZharqynBala Platform
**Version:** 1.0
**Date:** 2026-04-02
**Classification:** Internal

---

## 1. Security Overview

ZharqynBala processes sensitive data including children's personal information, psychological test results, and payment data. This document defines security requirements, current state, and remediation plan.

**Data sensitivity levels:**
- **CRITICAL:** Children's psychological results, patient notes, payment data
- **HIGH:** User credentials, personal information (email, phone, name)
- **MEDIUM:** Test content, psychologist profiles, school data
- **LOW:** Public test catalog, crisis resources

---

## 2. OWASP Top 10 Compliance

### A01:2021 — Broken Access Control

| Control | Status | Implementation |
|---------|--------|---------------|
| RBAC enforcement | DONE | JwtAuthGuard + RolesGuard on all endpoints |
| Resource ownership checks | DONE | Service-level validation (e.g., parent can only see own children) |
| Admin-only endpoints | DONE | @Roles(UserRole.ADMIN) decorator |
| Public endpoint whitelist | DONE | @Public() decorator (11 endpoints) |
| Directory traversal prevention | DONE | No file path parameters in API |
| CORS restrictions | DONE | Whitelist-based CORS origins |

**Known issue:** Admin role auto-assigned to hardcoded emails (`auth.service.ts:51-54`). Must move to database/ENV.

### A02:2021 — Cryptographic Failures

| Control | Status | Implementation |
|---------|--------|---------------|
| HTTPS enforcement | DONE | Railway.app TLS termination |
| Password hashing | DONE | bcrypt (cost factor 12) |
| JWT signing | DONE | HMAC-SHA256 with server secret |
| Sensitive data in logs | ISSUE | console.log in auth flow leaks email/token presence |
| Database encryption | PARTIAL | Railway managed PostgreSQL (encryption at rest) |

**Action required:** Remove all console.log from auth service; use structured logger.

### A03:2021 — Injection

| Control | Status | Implementation |
|---------|--------|---------------|
| SQL injection | DONE | Prisma ORM (parameterized queries throughout) |
| XSS prevention | DONE | RequestSanitizerMiddleware strips `<script>`, `javascript:`, event handlers |
| Command injection | DONE | No shell exec in application code |
| NoSQL injection | N/A | Not using NoSQL |

### A04:2021 — Insecure Design

| Control | Status | Implementation |
|---------|--------|---------------|
| Rate limiting | DONE | ThrottlerModule (100 req/60s global, 5/min for PDF) |
| Input validation | DONE | class-validator with global ValidationPipe (whitelist: true) |
| Business logic abuse | PARTIAL | Need session timeout for abandoned tests |

### A05:2021 — Security Misconfiguration

| Control | Status | Implementation |
|---------|--------|---------------|
| Security headers | DONE | Helmet middleware |
| CSP policy | ISSUE | `unsafe-eval` and `unsafe-inline` in script-src |
| HSTS | DONE | Production only (max-age: 31536000) |
| X-Frame-Options | DONE | DENY |
| X-Content-Type-Options | DONE | nosniff |

**CRITICAL ACTION:** Remove `unsafe-eval` from CSP. Remove `unsafe-inline` from script-src (use nonces instead).

### A06:2021 — Vulnerable Components

| Control | Status | Implementation |
|---------|--------|---------------|
| Dependency audit | TODO | Need `npm audit` in CI/CD |
| Outdated packages | PARTIAL | Manual updates; no automated checks |
| Lock files | DONE | package-lock.json committed |

### A07:2021 — Authentication Failures

| Control | Status | Implementation |
|---------|--------|---------------|
| Brute force protection | DONE | Rate limiting on auth endpoints |
| Password policy | DONE | Min 8 chars, 1 uppercase, 1 number (registration DTO) |
| Token expiration | DONE | Access: 15min, Refresh: 7d |
| Secure token storage | ISSUE | Frontend stores tokens with `httpOnly: false` in 11 API routes |

**HIGH ACTION:** Set `httpOnly: true` on all auth cookie settings.

### A08:2021 — Software and Data Integrity

| Control | Status | Implementation |
|---------|--------|---------------|
| Kaspi webhook signature | DONE | HMAC verification (`kaspi.service.ts:151`) |
| CI/CD pipeline security | TODO | No CI/CD pipeline yet |
| Code signing | N/A | Not applicable for web app |

### A09:2021 — Logging & Monitoring

| Control | Status | Implementation |
|---------|--------|---------------|
| Security event logging | DONE | SecurityLog table (login, logout, failed login, data access) |
| Error monitoring | TODO | Sentry DSN configured but not active |
| Audit trail | DONE | SecurityLog with IP, user agent, metadata |
| Log protection | PARTIAL | Logs in Railway; no centralized log management |

### A10:2021 — SSRF

| Control | Status | Implementation |
|---------|--------|---------------|
| External URL validation | DONE | No user-supplied URLs used for server-side requests |
| AI API calls | DONE | Fixed base URLs (Anthropic, Google) |

---

## 3. Children's Data Protection

### 3.1 Kazakhstan PDPL Compliance

| Requirement | Status | Implementation |
|-------------|--------|---------------|
| Consent for data collection | TODO | No consent flow implemented |
| Parental consent for minors | TODO | No age verification / parental consent mechanism |
| Right to deletion | DONE | DELETE /users/me cascades to children and data |
| Data minimization | DONE | Only essential fields collected |
| Purpose limitation | DONE | Data used only for diagnostics and consultations |
| Cross-border transfer | TODO | Need data residency assessment (Railway.app location) |

### 3.2 Enhanced Protections for Minors

| Control | Requirement | Status |
|---------|------------|--------|
| Data isolation | Children's data accessible only to parent and authorized psychologist | DONE |
| Result visibility | Results visible only to parent who owns the child profile | DONE |
| Psychologist access | Only through active consultation relationship | DONE |
| Admin access | Admin can see aggregated stats but not individual results | PARTIAL |
| Data export | Parent can request export of child's data | TODO |
| Anonymous analytics | Aggregate analytics must not identify individual children | TODO |

---

## 4. Known Vulnerabilities & Remediation Plan

### 4.1 Critical (Fix Immediately)

| ID | Vulnerability | File | Lines | Fix |
|----|-------------|------|-------|-----|
| SEC-001 | CSP allows `unsafe-eval` | `backend/src/common/security/security.middleware.ts` | 20-21 | Remove `unsafe-eval` and `unsafe-inline` from script-src; use CSP nonces |
| SEC-002 | Hardcoded admin emails grant ADMIN role | `backend/src/modules/auth/auth.service.ts` | 51-54 | Move to ENV variable or database table |

### 4.2 High (Fix Before Production)

| ID | Vulnerability | File | Fix |
|----|-------------|------|-----|
| SEC-003 | `httpOnly: false` for auth cookies (11 locations) | `frontend/app/api/*/route.ts` | Set `httpOnly: true` |
| SEC-004 | Debug console.log in auth flow (token/email exposure) | `backend/src/modules/auth/auth.service.ts` | Replace with NestJS Logger, remove sensitive data |
| SEC-005 | `simulate-complete` payment endpoint in production | `backend/src/modules/payments/payments.controller.ts` | Guard with `NODE_ENV !== 'production'` or remove |

### 4.3 Medium (Fix in Next Sprint)

| ID | Vulnerability | Fix |
|----|-------------|-----|
| SEC-006 | No parental consent flow for minors | Implement consent UI + backend validation |
| SEC-007 | Push notification subscriptions in-memory | Move to database persistence |
| SEC-008 | No `npm audit` in CI/CD | Add to pipeline when CI/CD is set up |
| SEC-009 | No PDPL consent tracking | Add consent records to database |
| SEC-010 | Migration workaround in Dockerfile (inline SQL) | Fix migration properly |

---

## 5. Security Headers Configuration

### Current (with issues)

```
Content-Security-Policy:
  default-src 'self';
  script-src 'self' 'unsafe-inline' 'unsafe-eval';    ← REMOVE
  style-src 'self' 'unsafe-inline';                     ← REMOVE
  img-src 'self' data: https:;
  font-src 'self' https://fonts.gstatic.com;
  connect-src 'self' https://*.zharqynbala.kz;

X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Strict-Transport-Security: max-age=31536000; includeSubDomains (production only)
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=()
```

### Target (fixed)

```
Content-Security-Policy:
  default-src 'self';
  script-src 'self' 'nonce-{random}';
  style-src 'self' 'nonce-{random}' https://fonts.googleapis.com;
  img-src 'self' data: https:;
  font-src 'self' https://fonts.gstatic.com;
  connect-src 'self' https://*.zharqynbala.kz wss://*.jitsi.net;
  frame-src https://*.jitsi.net;
```

---

## 6. Incident Response

### 6.1 Security Event Classification

| Level | Examples | Response Time |
|-------|---------|--------------|
| P0 (Critical) | Data breach, unauthorized admin access, payment fraud | 1 hour |
| P1 (High) | Successful brute force, XSS exploitation, credential leak | 4 hours |
| P2 (Medium) | Suspicious login patterns, failed payment manipulation | 24 hours |
| P3 (Low) | Rate limit triggers, failed login attempts | Next business day |

### 6.2 Response Steps

1. **Detect:** SecurityLog alerts, error monitoring, user reports
2. **Contain:** Disable affected accounts, rotate compromised keys
3. **Investigate:** Review SecurityLog, server logs, git history
4. **Remediate:** Deploy fix, update configurations
5. **Notify:** Affected users within 72 hours (PDPL requirement)
6. **Document:** Post-incident report, update security policy

---

## 7. Reporting Security Issues

If you discover a security vulnerability, please report it responsibly:

- **Email:** security@zharqynbala.kz
- **Do NOT** create public GitHub issues for security vulnerabilities
- Include: description, reproduction steps, impact assessment
- Expected response time: 48 hours
