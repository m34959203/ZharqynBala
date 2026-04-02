# Database Design Document

**Standard:** Data Dictionary + ER Documentation
**DBMS:** PostgreSQL 15
**ORM:** Prisma 5.8
**Schema:** `backend/prisma/schema.prisma` (712 lines)
**Date:** 2026-04-02

---

## 1. Schema Overview

**Total tables:** 22
**Total enums:** 12
**Migrations:** 9

```
Core:          User, RefreshToken, Child
Tests:         Test, Question, AnswerOption, TestSession, Answer, Result
Consultations: Consultation, PatientNote
Psychologists: Psychologist, PsychologistAvailability, ScheduleSlot
Schools:       School, SchoolClass, Student, GroupTest
Payments:      Payment, Subscription
Content:       Course, Lesson
Security:      SecurityLog
```

---

## 2. Enums

### UserRole
```sql
PARENT | PSYCHOLOGIST | SCHOOL | ADMIN
```

### Language
```sql
RU | KZ
```

### Gender
```sql
MALE | FEMALE
```

### TestCategory
```sql
ANXIETY | MOTIVATION | ATTENTION | EMOTIONS | CAREER | SELF_ESTEEM | SOCIAL | COGNITIVE
```

### QuestionType
```sql
MULTIPLE_CHOICE | SCALE | YES_NO | TEXT
```

### SessionStatus
```sql
IN_PROGRESS | COMPLETED | ABANDONED
```

### ConsultationStatus
```sql
PENDING | CONFIRMED | REJECTED | IN_PROGRESS | COMPLETED | CANCELLED | NO_SHOW
```

### PaymentStatus
```sql
PENDING | PAID | REFUNDED
```

### TransactionStatus
```sql
PENDING | COMPLETED | FAILED | REFUNDED
```

### PaymentType
```sql
DIAGNOSTIC | CONSULTATION | SUBSCRIPTION
```

### PaymentProvider
```sql
KASPI | PAYBOX
```

### SubscriptionPlan
```sql
BASIC | STANDARD | PREMIUM | FAMILY
```

### SecurityEventType
```sql
LOGIN | LOGOUT | FAILED_LOGIN | DATA_ACCESS | PERMISSION_CHANGE | MFA_DISABLED | PASSWORD_CHANGE
```

---

## 3. Data Dictionary

### 3.1 users

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | String (CUID) | No | cuid() | Primary key |
| email | String | No | - | Unique, login identifier |
| phone | String | Yes | - | Unique, +7XXXXXXXXXX format |
| password_hash | String | No | - | bcrypt hash (factor 12) |
| role | UserRole | No | PARENT | User role for RBAC |
| first_name | String | No | - | First name |
| last_name | String | No | - | Last name |
| avatar_url | String | Yes | - | S3 URL to avatar image |
| language | Language | No | RU | Preferred language |
| is_verified | Boolean | No | false | Email/phone verified |
| is_active | Boolean | No | true | Account active |
| refresh_token | String | Yes | - | Hashed refresh token |
| last_login_at | DateTime | Yes | - | Last successful login |
| created_at | DateTime | No | now() | Registration date |
| updated_at | DateTime | No | updatedAt | Last update |

**Indexes:** email (UNIQUE), phone (UNIQUE)
**Relations:** children (1:N), psychologist (1:1), school (1:1), securityLogs (1:N)

---

### 3.2 children

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | String (CUID) | No | cuid() | Primary key |
| parent_id | String (FK) | No | - | FK → users.id (CASCADE) |
| first_name | String | No | - | Child's first name |
| last_name | String | No | - | Child's last name |
| birth_date | DateTime | No | - | Date of birth |
| gender | Gender | No | - | MALE / FEMALE |
| school_name | String | Yes | - | School name (text) |
| grade | Int | Yes | - | School grade (1-12) |
| created_at | DateTime | No | now() | Created date |
| updated_at | DateTime | No | updatedAt | Last update |

**Indexes:** parent_id (FK)
**ON DELETE parent:** CASCADE (deletes all children)

---

### 3.3 tests

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | String (CUID) | No | cuid() | Primary key |
| title_ru | String | No | - | Russian title |
| title_kz | String | No | - | Kazakh title |
| description_ru | String | No | - | Russian description |
| description_kz | String | No | - | Kazakh description |
| category | TestCategory | No | - | Test category |
| age_min | Int | No | - | Minimum child age |
| age_max | Int | No | - | Maximum child age |
| duration_minutes | Int | No | - | Estimated duration |
| price | Float | No | 0 | Price in KZT (0 = free) |
| is_active | Boolean | No | true | Available to users |
| is_premium | Boolean | No | false | Requires payment |
| order | Int | No | 0 | Sort order |
| scoring_type | String | No | "percentage" | Score calculation method |
| interpretation_config | Json | Yes | - | Score ranges → interpretation text |
| created_at | DateTime | No | now() | Created date |
| updated_at | DateTime | No | updatedAt | Last update |

---

### 3.4 questions

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | String (CUID) | No | cuid() | Primary key |
| test_id | String (FK) | No | - | FK → tests.id (CASCADE) |
| question_text_ru | String | No | - | Russian question text |
| question_text_kz | String | No | - | Kazakh question text |
| question_type | QuestionType | No | - | Question format |
| order | Int | No | - | Display order |
| is_required | Boolean | No | true | Must be answered |

---

### 3.5 answer_options

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | String (CUID) | No | cuid() | Primary key |
| question_id | String (FK) | No | - | FK → questions.id (CASCADE) |
| option_text_ru | String | No | - | Russian option text |
| option_text_kz | String | No | - | Kazakh option text |
| score | Int | No | - | Points for selecting this option |
| metadata | Json | Yes | - | Extra data (used by scoring) |
| order | Int | No | - | Display order |

---

### 3.6 test_sessions

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | String (CUID) | No | cuid() | Primary key |
| test_id | String (FK) | No | - | FK → tests.id |
| child_id | String (FK) | No | - | FK → children.id (CASCADE) |
| status | SessionStatus | No | IN_PROGRESS | Current state |
| current_question | Int | Yes | - | Last answered question index |
| started_at | DateTime | No | now() | Session start time |
| completed_at | DateTime | Yes | - | Completion time |

---

### 3.7 answers

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | String (CUID) | No | cuid() | Primary key |
| session_id | String (FK) | No | - | FK → test_sessions.id (CASCADE) |
| question_id | String (FK) | No | - | FK → questions.id |
| answer_option_id | String (FK) | Yes | - | FK → answer_options.id |
| text_answer | String | Yes | - | Free-text answer (TEXT type) |
| answered_at | DateTime | No | now() | When answered |

---

### 3.8 results

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | String (CUID) | No | cuid() | Primary key |
| session_id | String (FK) | No | - | FK → test_sessions.id (CASCADE), UNIQUE |
| total_score | Float | No | - | Calculated total score |
| max_score | Float | No | - | Maximum possible score |
| interpretation | String | No | - | Text interpretation of score |
| recommendations | String | No | - | Recommendations text |
| pdf_url | String | Yes | - | S3 URL to generated PDF |
| created_at | DateTime | No | now() | Calculation time |

---

### 3.9 consultations

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | String (CUID) | No | cuid() | Primary key |
| psychologist_id | String (FK) | No | - | FK → psychologists.id |
| client_id | String (FK) | No | - | FK → users.id (the parent) |
| child_id | String (FK) | Yes | - | FK → children.id |
| scheduled_at | DateTime | No | - | Appointment date/time |
| duration_minutes | Int | No | 50 | Session length |
| status | ConsultationStatus | No | PENDING | Current state |
| room_name | String | Yes | - | Jitsi room identifier |
| room_url | String | Yes | - | Full Jitsi URL |
| price | Float | Yes | - | Price in KZT |
| payment_status | PaymentStatus | No | PENDING | Payment state |
| payment_id | String | Yes | - | FK to payment record |
| notes | String | Yes | - | Client's notes |
| cancel_reason | String | Yes | - | Reason for cancellation |
| rating | Int | Yes | - | Client rating (1-5) |
| review | String | Yes | - | Client review text |
| created_at | DateTime | No | now() | Booking time |
| updated_at | DateTime | No | updatedAt | Last update |
| completed_at | DateTime | Yes | - | Completion time |

---

### 3.10 psychologists

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | String (CUID) | No | cuid() | Primary key |
| user_id | String (FK) | No | - | FK → users.id (CASCADE), UNIQUE |
| specialization | String[] | No | - | Array of specializations |
| experience_years | Int | No | - | Years of experience |
| education | String | No | - | Education background |
| certificate_url | String | Yes | - | Certificate document URL |
| hourly_rate | Float | No | - | Rate in KZT per hour |
| bio | String | Yes | - | Biography text |
| languages | String[] | No | ["Русский"] | Languages spoken |
| is_approved | Boolean | No | false | Admin-verified |
| is_available | Boolean | No | true | Accepting clients |
| rating | Float | No | 0 | Average rating |
| total_consultations | Int | No | 0 | Completed sessions count |
| created_at | DateTime | No | now() | Registration date |
| updated_at | DateTime | No | updatedAt | Last update |

---

### 3.11 schedule_slots

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | String (CUID) | No | cuid() | Primary key |
| psychologist_id | String (FK) | No | - | FK → psychologists.id (CASCADE) |
| date | DateTime | No | - | Date (DATE type) |
| hour | Int | No | - | Hour (0-23) |
| is_available | Boolean | No | true | Slot open for booking |
| created_at | DateTime | No | now() | Created date |
| updated_at | DateTime | No | updatedAt | Last update |

**Unique constraint:** (psychologist_id, date, hour)

---

### 3.12 payments

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | String (CUID) | No | cuid() | Primary key |
| user_id | String | No | - | FK → users.id |
| amount | Float | No | - | Amount in KZT |
| currency | String | No | "KZT" | Currency code |
| payment_type | PaymentType | No | - | DIAGNOSTIC / CONSULTATION / SUBSCRIPTION |
| related_id | String | Yes | - | Reference to test/consultation/subscription |
| provider | PaymentProvider | No | - | KASPI / PAYBOX |
| external_id | String | Yes | - | Provider's transaction ID |
| status | TransactionStatus | No | PENDING | Payment state |
| created_at | DateTime | No | now() | Created date |
| completed_at | DateTime | Yes | - | Completion date |

---

### 3.13 patient_notes

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | String (CUID) | No | cuid() | Primary key |
| psychologist_id | String (FK) | No | - | FK → psychologists.id |
| client_id | String (FK) | No | - | FK → users.id |
| child_id | String (FK) | Yes | - | FK → children.id |
| consultation_id | String (FK) | Yes | - | FK → consultations.id |
| title | String | No | - | Note title |
| content | Text | No | - | Main content |
| chief_complaint | Text | Yes | - | Primary concern |
| history_of_illness | Text | Yes | - | Background history |
| mental_status | Text | Yes | - | Mental status exam |
| diagnosis | Text | Yes | - | Diagnosis |
| recommendations | Text | Yes | - | Clinical recommendations |
| treatment_plan | Text | Yes | - | Treatment plan |
| additional_data | Jsonb | Yes | - | Structured extra data |
| is_private | Boolean | No | true | Only visible to author |
| created_at | DateTime | No | now() | Created date |
| updated_at | DateTime | No | updatedAt | Last update |

---

## 4. Migration History

| # | Migration | Date | Description |
|---|----------|------|-------------|
| 1 | `20251205000000_init` | 2025-12-05 | Initial schema (all core tables) |
| 2 | `20260106000000_add_test_categories` | 2026-01-06 | Added SOCIAL, COGNITIVE categories |
| 3 | `20260106000001_add_answer_option_metadata` | 2026-01-06 | JSONB metadata on answer_options |
| 4 | `20260107000000_add_test_scoring_config` | 2026-01-07 | scoring_type + interpretation_config on tests |
| 5 | `20260109000000_add_schedule_slots` | 2026-01-09 | Schedule slots table |
| 6 | `20260109000001_approve_existing_psychologists` | 2026-01-09 | Data migration: approve all |
| 7 | `20260109000002_add_languages_to_psychologists` | 2026-01-09 | languages[] array field |
| 8 | `20260109000003_update_consultations` | 2026-01-09 | ConsultationStatus enum update (KNOWN ISSUE) |
| 9 | `20260110000000_add_patient_notes` | 2026-01-10 | Patient notes table |

**Known issue:** Migration #8 (`update_consultations`) has a stuck/failed state in production. Workaround exists in `Dockerfile` and `fix-migration.js`.

---

## 5. Seed Data Summary

Source: `backend/prisma/seed.ts` (605 lines)

| Entity | Count | Details |
|--------|-------|---------|
| Users | 4 | 1 Admin, 1 Parent, 2 Psychologists |
| Children | 1 | Linked to Parent user |
| Psychologists | 2 | With specializations, rates, availability |
| Tests | 8 | 4 free + 4 premium, all bilingual (RU/KZ) |
| Questions | ~30 | Distributed across 8 tests |
| Answer Options | ~90 | With scores for each question |

Seed uses `upsert` — safe to run multiple times.
