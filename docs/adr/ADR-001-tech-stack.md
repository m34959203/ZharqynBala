# ADR-001: Technology Stack Selection

**Status:** Accepted
**Date:** 2025-12-05
**Decision makers:** ZharqynBala Team

## Context

We need to select a technology stack for a psychological diagnostics platform targeting Kazakhstan market. Requirements:
- Bilingual (Russian/Kazakh)
- Web + future mobile
- Video consultations
- Payment integration (Kaspi Pay)
- AI-powered interpretations
- Small team (1-3 developers)

## Decision

| Layer | Choice | Runner-up |
|-------|--------|-----------|
| Backend | NestJS 10 + TypeScript | FastAPI (Python) |
| Database | PostgreSQL 15 + Prisma | MongoDB + Mongoose |
| Frontend | Next.js + React + TypeScript | Nuxt.js (Vue) |
| Styling | Tailwind CSS | Material UI |
| Auth | JWT + Passport + NextAuth | Session-based (express-session) |
| Video | Jitsi Meet (open-source) | Agora SDK |
| Payments | Kaspi Pay | Stripe (not available in KZ) |
| AI | Anthropic Claude + Google Gemini | OpenAI GPT |
| Mobile | React Native + Expo | Flutter |
| Hosting | Railway.app | Vercel + standalone backend |

## Rationale

- **NestJS over Express:** Provides modular architecture, built-in DI, guards, interceptors — better for a team project than raw Express
- **PostgreSQL over MongoDB:** Relational data model (tests → questions → answers → results) maps naturally to SQL; JSONB available for flexible fields
- **Prisma over TypeORM:** Better type safety, cleaner migration system, auto-generated client
- **Next.js over Nuxt:** Larger ecosystem, better TypeScript support, team expertise in React
- **Jitsi over Agora:** Zero cost (open-source) vs per-minute pricing; sufficient for 1:1 consultations
- **Kaspi Pay:** 90%+ market share in Kazakhstan; must-have for local market
- **Railway over Vercel:** Supports Docker (needed for Puppeteer/PDF), managed PostgreSQL, simpler monorepo deploy

## Consequences

**Positive:**
- Full TypeScript across stack (shared types possible)
- Strong ecosystem for each component
- Cost-effective (Jitsi free, Railway affordable)
- Good developer experience (Prisma Studio, Swagger, Hot Reload)

**Negative:**
- NestJS has steeper learning curve than Express
- Puppeteer requires Chromium in Docker (large image size, ~1GB)
- NextAuth adds complexity vs custom auth
- Railway.app has less flexibility than Kubernetes (for scaling)

## Alternatives Rejected

- **MongoDB:** Poor fit for relational test data; JOIN-heavy queries for results/analytics
- **Flutter:** Would require maintaining Dart codebase alongside TypeScript; team has no Dart experience
- **Agora SDK:** $0.99/1000 minutes — cost concern for early-stage startup
- **Stripe:** Not available in Kazakhstan market
