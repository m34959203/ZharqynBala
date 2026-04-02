# ADR-002: Authentication & Authorization Strategy

**Status:** Accepted
**Date:** 2025-12-05
**Decision makers:** ZharqynBala Team

## Context

The platform has 4 user roles (Parent, Psychologist, School, Admin) with distinct permissions. We need authentication that works across web and future mobile clients, supports OAuth providers, and is secure enough for children's data.

## Decision

**Dual-layer JWT authentication:**

1. **Backend (NestJS):** Passport.js with JWT strategy
   - Access token: 15min TTL, signed with `JWT_SECRET`
   - Refresh token: 7 days TTL, signed with `JWT_REFRESH_SECRET`, stored as bcrypt hash in DB
   - Guards: JwtAuthGuard (global) + RolesGuard (per-endpoint)

2. **Frontend (Next.js):** NextAuth.js v4
   - JWT session strategy (not database sessions)
   - Providers: Credentials (always) + Google OAuth + Mail.ru OAuth
   - Token storage: NextAuth session cookie + accessToken cookie

3. **Authorization:** RBAC with decorators
   - `@Public()` — skip auth
   - `@Roles(UserRole.ADMIN)` — require specific role
   - Resource ownership validated in service layer

## Rationale

- **JWT over sessions:** Stateless, works with multiple clients (web + mobile), no session store needed
- **Short access token (15min):** Limits damage from token theft
- **Refresh in DB:** Allows server-side revocation (logout invalidates refresh token)
- **NextAuth:** Handles OAuth complexity, CSRF protection, cookie management
- **RBAC over ABAC:** 4 clear roles with non-overlapping permissions; ABAC would be over-engineered

## Consequences

**Positive:**
- Stateless API (horizontal scaling)
- OAuth support with minimal code
- Mobile-ready (same JWT flow)

**Negative:**
- Dual token storage (NextAuth cookie + custom accessToken cookie) adds complexity
- NextAuth v4 has quirks with custom backend auth
- Cannot revoke access tokens (must wait for expiry)

## Known Issues (To Fix)

1. `httpOnly: false` on token cookies in 11 frontend API routes
2. Hardcoded admin emails in auth.service.ts
3. console.log statements in auth flow leak sensitive info
