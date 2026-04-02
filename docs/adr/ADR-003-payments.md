# ADR-003: Payment Integration Strategy

**Status:** Accepted (partially implemented)
**Date:** 2025-12-05
**Decision makers:** ZharqynBala Team

## Context

The platform needs to accept payments in KZT (Kazakhstani Tenge) for psychological tests, consultations, and subscriptions. Kazakhstan has a unique payment landscape dominated by Kaspi Pay.

## Decision

- **Primary provider:** Kaspi Pay (90%+ market penetration in KZ)
- **Fallback provider:** PayBox (for users without Kaspi)
- **Webhook-based:** Payment status updates via signed webhooks
- **Free tier:** Tests with price=0 auto-complete without payment
- **Subscription model:** 4 tiers (BASIC, STANDARD, PREMIUM, FAMILY)

## Payment Flow

```
1. Client selects test/consultation
2. Backend creates Payment record (status: PENDING)
3. Backend generates payment URL (redirect to Kaspi app)
4. User completes payment in Kaspi
5. Kaspi sends webhook to /payments/webhook/kaspi
6. Backend verifies HMAC signature
7. Backend updates Payment status → COMPLETED
8. Backend unlocks test session / confirms consultation
```

## Webhook Security

- HMAC-SHA256 signature verification on all webhooks
- Signature computed over orderId + amount + status
- Secret: `KASPI_WEBHOOK_SECRET` env variable
- Non-production: signature verification skipped for testing

## Rationale

- Kaspi Pay is essential for Kazakhstan market (no Stripe/PayPal availability)
- Webhook approach is standard for async payment confirmation
- PayBox as fallback covers edge cases (tourists, corporate cards)

## Current Status

- Payment creation: **Mock** (generates fake URL, not real Kaspi integration)
- Webhook processing: **Structure done** (signature verification implemented)
- Refunds: **DB-only** (no provider API call)
- Subscriptions: **Schema only** (no business logic)

## Action Items

1. Obtain Kaspi Pay merchant credentials
2. Implement real payment URL generation (Kaspi API)
3. Test webhook flow with Kaspi sandbox
4. Implement refund API integration
5. Build subscription lifecycle management
