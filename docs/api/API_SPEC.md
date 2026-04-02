# API Specification

**Standard:** OpenAPI 3.0 / REST API Design Guidelines
**Base URL:** `https://zharqynbala-production.up.railway.app/api/v1`
**Development:** `http://localhost:3001/api/v1`
**Swagger UI:** `{BASE_URL}/../api/docs`
**Date:** 2026-04-02

---

## 1. General Conventions

### 1.1 Versioning

URI-based versioning: `/api/v1/...`

### 1.2 Authentication

All endpoints require JWT Bearer token unless marked `[PUBLIC]`.

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 1.3 Request Format

- Content-Type: `application/json`
- Accept: `application/json`
- Character encoding: UTF-8

### 1.4 Response Format

**Success (2xx):**
```json
{
  "data": { ... },
  "meta": {
    "total": 100,
    "page": 1,
    "limit": 20
  }
}
```

For single entities, the response is the entity object directly.

**Error (4xx/5xx):**
```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "error": "Bad Request"
}
```

### 1.5 Pagination

Query parameters for paginated endpoints:
- `page` (default: 1) — page number
- `limit` (default: 20, max: 100) — items per page

### 1.6 Rate Limiting

- Global: 100 requests per 60 seconds per IP
- PDF download: 5 requests per 60 seconds per user
- Auth endpoints: 10 requests per 60 seconds per IP

Response headers:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1712000000
```

### 1.7 HTTP Status Codes

| Code | Meaning | When Used |
|------|---------|-----------|
| 200 | OK | Successful GET/PUT/PATCH/DELETE |
| 201 | Created | Successful POST that creates resource |
| 400 | Bad Request | Validation error, malformed request |
| 401 | Unauthorized | Missing or invalid JWT token |
| 403 | Forbidden | Valid token but insufficient role/permissions |
| 404 | Not Found | Resource doesn't exist |
| 409 | Conflict | Duplicate resource (e.g., email already registered) |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Unexpected server error |

---

## 2. Authentication Endpoints

### POST /auth/register `[PUBLIC]`

Register a new user account.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "MyPassword123",
  "firstName": "Айгуль",
  "lastName": "Тестова",
  "phone": "+77001234567",
  "role": "PARENT",
  "language": "RU"
}
```

**Validation:**
- `email`: valid email, unique
- `password`: min 8 chars, at least 1 uppercase, 1 number
- `firstName`, `lastName`: required, 1-100 chars
- `phone`: optional, format +7XXXXXXXXXX
- `role`: PARENT (default) | PSYCHOLOGIST | SCHOOL
- `language`: RU (default) | KZ

**Response 201:**
```json
{
  "accessToken": "eyJhbG...",
  "refreshToken": "eyJhbG...",
  "user": {
    "id": "clx1234...",
    "email": "user@example.com",
    "firstName": "Айгуль",
    "lastName": "Тестова",
    "role": "PARENT",
    "language": "RU",
    "isVerified": false,
    "isActive": true,
    "createdAt": "2026-04-02T10:00:00.000Z"
  }
}
```

**Errors:** 400 (validation), 409 (email exists)

---

### POST /auth/login `[PUBLIC]`

**Request:**
```json
{
  "email": "user@example.com",
  "password": "MyPassword123"
}
```

**Response 200:**
```json
{
  "accessToken": "eyJhbG...",
  "refreshToken": "eyJhbG...",
  "user": { ... }
}
```

**Errors:** 401 (invalid credentials)

---

### POST /auth/refresh `[PUBLIC]`

**Request:**
```json
{
  "refreshToken": "eyJhbG..."
}
```

**Response 200:**
```json
{
  "accessToken": "eyJhbG...",
  "refreshToken": "eyJhbG..."
}
```

**Errors:** 401 (invalid/expired refresh token)

---

### POST /auth/logout `[JWT]`

**Headers:** `Authorization: Bearer {accessToken}`

**Response 200:**
```json
{
  "message": "Logged out successfully"
}
```

---

### GET /auth/me `[JWT]`

**Response 200:**
```json
{
  "id": "clx1234...",
  "email": "user@example.com",
  "phone": "+77001234567",
  "firstName": "Айгуль",
  "lastName": "Тестова",
  "role": "PARENT",
  "language": "RU",
  "isVerified": false,
  "isActive": true,
  "avatarUrl": null,
  "createdAt": "2026-04-02T10:00:00.000Z",
  "updatedAt": "2026-04-02T10:00:00.000Z"
}
```

---

## 3. Test Endpoints

### GET /tests `[PUBLIC]`

**Query parameters:**
- `category` — TestCategory enum (ANXIETY, MOTIVATION, etc.)
- `isPremium` — boolean

**Response 200:**
```json
[
  {
    "id": "test-anxiety-1",
    "titleRu": "Тест на тревожность",
    "titleKz": "Алаңдаушылық тесті",
    "descriptionRu": "Определите уровень тревожности ребёнка...",
    "descriptionKz": "Баланың алаңдаушылық деңгейін анықтаңыз...",
    "category": "ANXIETY",
    "ageMin": 10,
    "ageMax": 17,
    "durationMinutes": 15,
    "price": 0,
    "isPremium": false,
    "isActive": true,
    "order": 1,
    "_count": { "questions": 5 }
  }
]
```

---

### POST /tests/:id/start `[JWT]`

**Request:**
```json
{
  "childId": "child-uuid-here"
}
```

**Response 201:**
```json
{
  "sessionId": "session-uuid",
  "testId": "test-anxiety-1",
  "childId": "child-uuid",
  "status": "IN_PROGRESS",
  "currentQuestion": 0,
  "totalQuestions": 5,
  "startedAt": "2026-04-02T10:30:00.000Z"
}
```

**Errors:** 400 (child age out of range), 404 (test/child not found)

---

### POST /tests/sessions/:sessionId/answer `[JWT]`

**Request:**
```json
{
  "questionId": "question-uuid",
  "answerOptionId": "option-uuid"
}
```

For TEXT questions:
```json
{
  "questionId": "question-uuid",
  "textAnswer": "Free text response"
}
```

**Response 200:**
```json
{
  "answerId": "answer-uuid",
  "sessionId": "session-uuid",
  "progress": {
    "answered": 3,
    "total": 5,
    "percentage": 60
  }
}
```

---

### POST /tests/sessions/:sessionId/complete `[JWT]`

**Response 200:**
```json
{
  "sessionId": "session-uuid",
  "status": "COMPLETED",
  "completedAt": "2026-04-02T10:45:00.000Z"
}
```

---

## 4. Consultation Endpoints

### POST /consultations `[PARENT]`

**Request:**
```json
{
  "psychologistId": "psych-uuid",
  "childId": "child-uuid",
  "scheduledAt": "2026-04-05T14:00:00.000Z",
  "durationMinutes": 50,
  "notes": "Ребёнок жалуется на тревожность"
}
```

**Response 201:**
```json
{
  "id": "consult-uuid",
  "psychologistId": "psych-uuid",
  "clientId": "user-uuid",
  "childId": "child-uuid",
  "status": "PENDING",
  "scheduledAt": "2026-04-05T14:00:00.000Z",
  "price": 15000,
  "paymentStatus": "PENDING"
}
```

---

### PUT /consultations/:id/confirm `[PSYCHOLOGIST]`

**Response 200:**
```json
{
  "id": "consult-uuid",
  "status": "CONFIRMED"
}
```

---

### GET /consultations/:id/jitsi-config `[JWT]`

**Response 200:**
```json
{
  "roomName": "zb-consult-uuid-short",
  "domain": "meet.jit.si",
  "jwt": null,
  "configOverwrite": {
    "startWithAudioMuted": false,
    "startWithVideoMuted": false,
    "disableDeepLinking": true
  },
  "interfaceConfigOverwrite": {
    "SHOW_JITSI_WATERMARK": false,
    "MOBILE_APP_PROMO": false
  }
}
```

---

## 5. Payment Endpoints

### POST /payments `[JWT]`

**Request:**
```json
{
  "amount": 3500,
  "paymentType": "DIAGNOSTIC",
  "relatedId": "test-session-uuid",
  "provider": "KASPI"
}
```

**Response 201:**
```json
{
  "id": "payment-uuid",
  "amount": 3500,
  "currency": "KZT",
  "paymentType": "DIAGNOSTIC",
  "provider": "KASPI",
  "status": "PENDING",
  "paymentUrl": "https://pay.kaspi.kz/...",
  "createdAt": "2026-04-02T11:00:00.000Z"
}
```

---

### POST /payments/webhook/kaspi `[PUBLIC]`

**Request (from Kaspi):**
```json
{
  "orderId": "payment-uuid",
  "status": "completed",
  "amount": 3500,
  "signature": "hmac-sha256-hash"
}
```

**Verification:** HMAC-SHA256 signature using `KASPI_WEBHOOK_SECRET`

**Response 200:**
```json
{
  "success": true
}
```

---

## 6. Error Response Examples

### 400 — Validation Error
```json
{
  "statusCode": 400,
  "message": [
    "email must be a valid email",
    "password must be at least 8 characters"
  ],
  "error": "Bad Request"
}
```

### 401 — Unauthorized
```json
{
  "statusCode": 401,
  "message": "Invalid email or password",
  "error": "Unauthorized"
}
```

### 403 — Forbidden
```json
{
  "statusCode": 403,
  "message": "Insufficient permissions",
  "error": "Forbidden"
}
```

### 429 — Rate Limited
```json
{
  "statusCode": 429,
  "message": "Too many requests. Please try again later.",
  "error": "Too Many Requests"
}
```

---

## 7. Data Types Reference

### Enums

```typescript
UserRole:          PARENT | PSYCHOLOGIST | SCHOOL | ADMIN
Language:          RU | KZ
Gender:            MALE | FEMALE
TestCategory:      ANXIETY | MOTIVATION | ATTENTION | EMOTIONS | CAREER | SELF_ESTEEM | SOCIAL | COGNITIVE
QuestionType:      MULTIPLE_CHOICE | SCALE | YES_NO | TEXT
SessionStatus:     IN_PROGRESS | COMPLETED | ABANDONED
ConsultationStatus: PENDING | CONFIRMED | REJECTED | IN_PROGRESS | COMPLETED | CANCELLED | NO_SHOW
PaymentStatus:     PENDING | PAID | REFUNDED
TransactionStatus: PENDING | COMPLETED | FAILED | REFUNDED
PaymentType:       DIAGNOSTIC | CONSULTATION | SUBSCRIPTION
PaymentProvider:   KASPI | PAYBOX
SubscriptionPlan:  BASIC | STANDARD | PREMIUM | FAMILY
```

### Common Fields

```typescript
// All entities have:
id: string           // CUID (Prisma default)
createdAt: DateTime  // ISO 8601 format
updatedAt: DateTime  // ISO 8601 format

// Bilingual fields pattern:
titleRu: string      // Russian text
titleKz: string      // Kazakh text
```
