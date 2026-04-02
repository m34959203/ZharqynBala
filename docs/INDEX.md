# ZharqynBala — Documentation Index

**Last updated:** 2026-04-02

---

## Documentation Structure

```
docs/
├── product/                    # Product & Business
│   ├── PRD.md                  # Product Requirements Document
│   └── SRS.md                  # Software Requirements Specification (IEEE 830)
│
├── architecture/               # Technical Architecture
│   ├── ARCHITECTURE.md         # System Architecture (C4 Model)
│   └── DATABASE.md             # Database Design & Data Dictionary
│
├── api/                        # API Documentation
│   └── API_SPEC.md             # REST API Specification (OpenAPI style)
│
├── security/                   # Security & Compliance
│   └── SECURITY_POLICY.md      # Security Policy (OWASP ASVS + PDPL)
│
├── testing/                    # Quality Assurance
│   └── TEST_STRATEGY.md        # Test Strategy (IEEE 829)
│
├── deployment/                 # Operations
│   └── DEPLOYMENT.md           # Deployment & Operations Guide
│
├── development/                # Developer Experience
│   ├── CONTRIBUTING.md         # Contributing Guide
│   └── CODE_STYLE.md           # Code Style Guide
│
├── adr/                        # Architecture Decision Records
│   ├── ADR-001-tech-stack.md   # Technology Stack Selection
│   ├── ADR-002-authentication.md # Auth & Authorization Strategy
│   └── ADR-003-payments.md     # Payment Integration Strategy
│
└── INDEX.md                    # This file
```

---

## Quick Links by Role

### For Product Managers / Stakeholders
- [Product Requirements (PRD)](product/PRD.md) — features, personas, business model
- [Changelog](../CHANGELOG.md) — version history

### For New Developers
- [Developer Guide](../DEVELOPER_GUIDE.md) — quick start, full reference
- [Contributing Guide](development/CONTRIBUTING.md) — workflow, standards
- [Code Style](development/CODE_STYLE.md) — patterns, naming, rules
- [Deployment Guide](deployment/DEPLOYMENT.md) — local setup, production

### For Architects / Tech Leads
- [Software Requirements (SRS)](product/SRS.md) — IEEE 830 specification
- [Architecture (C4)](architecture/ARCHITECTURE.md) — system design, components, integrations
- [Database Design](architecture/DATABASE.md) — schema, data dictionary, migrations
- [ADRs](adr/) — architectural decisions with rationale

### For QA / Testers
- [Test Strategy](testing/TEST_STRATEGY.md) — test levels, scenarios, quality gates
- [API Specification](api/API_SPEC.md) — endpoints, request/response formats

### For Security / Compliance
- [Security Policy](security/SECURITY_POLICY.md) — OWASP, PDPL, known vulnerabilities

---

## Standards Applied

| Standard | Applied To |
|----------|-----------|
| IEEE 830 / ISO/IEC/IEEE 29148 | Software Requirements Specification |
| IEEE 829 | Test Strategy & Planning |
| ISO/IEC/IEEE 42010 | Architecture Description |
| C4 Model | Architecture Diagrams |
| OWASP ASVS 4.0 | Security Verification |
| OWASP Top 10 (2021) | Security Policy |
| Keep a Changelog 1.1.0 | Changelog format |
| Semantic Versioning 2.0.0 | Version numbering |
| Conventional Commits | Commit messages |
| ADR (M. Nygard) | Architecture Decision Records |
| OpenAPI 3.0 | API Specification |
| Kazakhstan PDPL | Data Protection Compliance |
