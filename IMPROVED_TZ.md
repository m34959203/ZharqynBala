# УЛУЧШЕННОЕ ТЕХНИЧЕСКОЕ ЗАДАНИЕ
## Проект: Zharqyn Bala v2.0

**Дата:** 24.12.2025
**Статус:** Сопоставление ТЗ с реализацией + Улучшения

---

## РАЗДЕЛ 1: GAP-АНАЛИЗ (ТЗ vs РЕАЛИЗАЦИЯ)

### 1.1 Сводная матрица соответствия

| Модуль по ТЗ | Статус | Реализовано | Gap | Приоритет |
|--------------|--------|-------------|-----|-----------|
| **Auth Module** | ✅ 95% | Регистрация, логин, JWT, refresh | OAuth (только frontend) | Low |
| **Users Module** | ✅ 90% | CRUD профилей, дети | Нет верификации email/SMS | Medium |
| **Tests Module** | ❌ 0% | Только схема БД | Весь модуль | **Critical** |
| **Results Module** | ❌ 0% | Только схема БД | Весь модуль + PDF | **Critical** |
| **Consultations** | ❌ 0% | Только схема БД | Весь модуль + видео | High |
| **Payments Module** | ❌ 0% | Только схема БД | Kaspi + PayBox | **Critical** |
| **Schools Module** | ❌ 0% | Только схема БД | Импорт, отчёты | Medium |
| **Admin Panel** | ❌ 0% | Не реализовано | Весь модуль | Medium |
| **Frontend Pages** | ⚠️ 20% | Login, Register, Dashboard | 80% страниц | **Critical** |
| **AI Integration** | ❌ 0% | Не реализовано | Новое требование | High |

### 1.2 Детальный анализ по модулям

#### A. Auth Module (95% готово)

```
РЕАЛИЗОВАНО:                          ОТСУТСТВУЕТ:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ POST /auth/register                 ❌ POST /auth/verify-email
✅ POST /auth/login                    ❌ POST /auth/verify-phone (SMS)
✅ POST /auth/refresh                  ❌ POST /auth/forgot-password
✅ POST /auth/logout                   ❌ POST /auth/reset-password
✅ GET  /auth/me                       ❌ OAuth server-side (Google)
✅ JWT + Refresh tokens
✅ bcrypt password hashing
✅ Rate limiting
```

**Требуемые доработки:**
1. Верификация email (SendGrid интеграция)
2. SMS верификация (Twilio)
3. Восстановление пароля

---

#### B. Users Module (90% готово)

```
РЕАЛИЗОВАНО:                          ОТСУТСТВУЕТ:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ GET    /users/me                   ❌ Загрузка аватаров (S3)
✅ PATCH  /users/me                   ❌ История активности
✅ DELETE /users/me
✅ GET    /users/me/children
✅ POST   /users/me/children
✅ PATCH  /users/me/children/:id
✅ DELETE /users/me/children/:id
```

---

#### C. Tests Module (0% - КРИТИЧНО)

**Требуется реализовать полностью:**

```typescript
// Backend endpoints (NestJS)
GET    /tests                    // Список тестов с фильтрами
GET    /tests/:id                // Детали теста
POST   /tests/:id/start          // Начать тест (создаёт session)
GET    /tests/sessions/:id       // Текущее состояние сессии
POST   /tests/sessions/:id/answer    // Отправить ответ
POST   /tests/sessions/:id/complete  // Завершить тест

// Бизнес-логика
- Валидация возраста ребёнка
- Подсчёт баллов по формулам
- Сохранение прогресса
- Автозавершение по таймауту
```

**Приоритет:** P0 (Critical)
**Effort:** 2-3 недели

---

#### D. Results Module (0% - КРИТИЧНО)

**Требуется реализовать:**

```typescript
// Endpoints
GET    /results                  // История результатов
GET    /results/:id              // Детальный результат
GET    /results/:id/pdf          // Скачать PDF

// Бизнес-логика
- Генерация интерпретаций (AI-powered)
- Создание рекомендаций
- PDF генерация (Puppeteer)
- Хранение в S3
```

**Приоритет:** P0 (Critical)
**Effort:** 2 недели

---

#### E. Payments Module (0% - КРИТИЧНО)

**Требуется реализовать:**

```typescript
// Endpoints
POST   /payments/create          // Создать платёж
POST   /payments/kaspi/webhook   // Webhook от Kaspi
POST   /payments/paybox/webhook  // Webhook от PayBox
GET    /payments/history         // История платежей
POST   /payments/:id/refund      // Возврат (admin)

// Интеграции
- Kaspi Pay API
- PayBox API
- Webhook security (signature verification)
```

**Приоритет:** P0 (Critical)
**Effort:** 2-3 недели

---

#### F. Frontend Pages (20% - КРИТИЧНО)

**Текущее состояние:**
```
/                    ❌ Пустая страница (нужен Landing)
/login               ✅ Готово
/register            ✅ Готово
/dashboard           ⚠️ Базовая версия
```

**Требуется реализовать:**
```
/                    Landing page (Hero + Features + Pricing)
/tests               Каталог тестов
/tests/:id           Детали теста
/tests/:id/session   Прохождение теста
/results             История результатов
/results/:id         Детальный результат
/consultations       Список консультаций
/psychologists       Каталог психологов
/psychologists/:id   Профиль психолога
/profile             Настройки профиля
/children            Управление детьми
/payments            История платежей
```

---

## РАЗДЕЛ 2: УЛУЧШЕННЫЕ ТРЕБОВАНИЯ

### 2.1 Новые функциональные требования (не было в ТЗ)

#### FR-NEW-001: AI-интерпретация результатов

**Описание:** Использование Claude API для генерации персонализированных интерпретаций тестов

**Технические требования:**
```typescript
// /backend/src/modules/ai/ai.service.ts
interface AIInterpretation {
  summary: string;           // 2-3 предложения
  strengths: string[];       // Сильные стороны
  areasForDevelopment: string[]; // Области развития
  recommendations: Recommendation[];
  needSpecialist: boolean;
  specialistReason?: string;
}

async function interpretTestResults(
  session: TestSession,
  child: Child
): Promise<AIInterpretation>
```

**Промпт-шаблон:**
```
Ты — детский психолог-эксперт. Проанализируй результаты теста:

Ребёнок: {age} лет, {grade} класс, {gender}
Тест: {testName}
Категория: {category}
Результат: {score}/{maxScore} ({percentage}%)

Ответы:
{answers}

Дай интерпретацию в JSON формате:
{schema}

Правила:
1. Никогда не ставь диагнозы
2. При score < 30% рекомендуй консультацию специалиста
3. Используй позитивные формулировки
4. Учитывай культурный контекст Казахстана
```

**Приоритет:** P1 (High)
**Effort:** 1-2 недели

---

#### FR-NEW-002: Chatbot для родителей

**Описание:** AI-ассистент для ответов на вопросы

**Функционал:**
- Объяснение результатов тестов
- FAQ автоответы
- Рекомендации упражнений
- Эскалация к психологу

**API:**
```typescript
POST /chat/message
Body: { message: string, sessionId?: string }
Response: {
  response: string,
  suggestions: string[],
  needsEscalation: boolean
}
```

**Приоритет:** P2 (Medium)
**Effort:** 2-3 недели

---

#### FR-NEW-003: Onboarding Wizard

**Описание:** Пошаговый мастер для новых пользователей

**Шаги:**
1. Добавление первого ребёнка
2. Выбор бесплатного теста
3. Прохождение теста
4. Просмотр результатов
5. Upsell на Premium

**UI/UX:**
- Progress bar
- Skip option
- Сохранение прогресса
- Анимированные подсказки

**Приоритет:** P1 (High)
**Effort:** 1 неделя

---

#### FR-NEW-004: Push-уведомления

**Описание:** Уведомления о событиях

**Типы:**
- Напоминание о тесте
- Консультация через 1 час
- Новые результаты
- Рекомендации на основе результатов

**Технологии:**
- Firebase Cloud Messaging (web push)
- Service Worker

**Приоритет:** P2 (Medium)
**Effort:** 1 неделя

---

### 2.2 Улучшенные нефункциональные требования

#### NFR-001: Производительность (улучшено)

| Метрика | Старое требование | Новое требование |
|---------|------------------|------------------|
| API response time | < 500ms | < 200ms (p95) |
| Page load time | < 3s | < 2s (LCP) |
| Time to Interactive | не указано | < 3s |
| First Contentful Paint | не указано | < 1.5s |
| Concurrent users | 100 | 500 |

**Реализация:**
- Redis caching для частых запросов
- CDN для статики (Cloudflare)
- Image optimization (Next.js Image)
- Code splitting
- Database indexing (уже есть)

---

#### NFR-002: Безопасность (улучшено)

| Требование | Статус | Улучшение |
|------------|--------|-----------|
| JWT tokens | ✅ Есть | Добавить JTI для revocation |
| Rate limiting | ✅ Есть | Per-endpoint limits |
| Input validation | ✅ Есть | Добавить sanitization |
| SQL injection | ✅ Prisma | — |
| XSS | ✅ React | CSP headers |
| CSRF | ⚠️ Частично | CSRF tokens для форм |
| Encryption at rest | ❌ Нет | AES-256 для PII |
| Audit logging | ⚠️ Частично | Полный audit trail |

**Новые требования:**
```typescript
// Content Security Policy
const csp = {
  'default-src': ["'self'"],
  'script-src': ["'self'", "'unsafe-inline'", 'https://cdn.jsdelivr.net'],
  'style-src': ["'self'", "'unsafe-inline'"],
  'img-src': ["'self'", 'data:', 'https:'],
  'connect-src': ["'self'", 'https://api.anthropic.com'],
};

// Encryption for sensitive data
interface EncryptedField {
  encryptOnSave: true;
  algorithm: 'aes-256-gcm';
  fields: ['phone', 'birthDate', 'address'];
}
```

---

#### NFR-003: Мониторинг (новое)

**Требования:**
```yaml
Logging:
  - Winston/Pino structured logging
  - Log levels: debug, info, warn, error
  - Request ID tracking
  - Sensitive data masking

Metrics:
  - Prometheus metrics endpoint
  - Custom metrics:
    - tests_completed_total
    - consultations_booked_total
    - payments_processed_total
    - api_response_time_seconds

Alerting:
  - Error rate > 5% → PagerDuty
  - Response time p95 > 500ms → Slack
  - Payment failures > 3 in 5min → SMS

APM:
  - Sentry for error tracking
  - Request tracing
  - Performance monitoring
```

---

#### NFR-004: Доступность (A11y) — новое

**WCAG 2.1 Level AA Compliance:**

```
Требования:
├── Semantic HTML (landmarks, headings)
├── Keyboard navigation (all interactions)
├── Focus indicators (visible focus rings)
├── Color contrast (4.5:1 for text)
├── Screen reader support (ARIA labels)
├── Form accessibility (labels, errors)
├── Motion preferences (prefers-reduced-motion)
└── Language declaration (lang attribute)

Тестирование:
├── axe-core automated testing
├── Manual screen reader testing (NVDA, VoiceOver)
└── Keyboard-only navigation testing
```

---

## РАЗДЕЛ 3: УЛУЧШЕННАЯ АРХИТЕКТУРА

### 3.1 Обновлённая системная архитектура

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENTS                                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────┐    │
│  │   Web    │  │  Mobile  │  │  Admin   │  │ School Portal│    │
│  │ (Next.js)│  │ (Future) │  │  Panel   │  │              │    │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └──────┬───────┘    │
└───────┼─────────────┼─────────────┼───────────────┼────────────┘
        │             │             │               │
        └─────────────┴──────┬──────┴───────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    CLOUDFLARE (CDN + WAF)                        │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                      RAILWAY.APP                                 │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                    NestJS Backend                        │    │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐       │    │
│  │  │  Auth   │ │  Users  │ │  Tests  │ │ Results │       │    │
│  │  │ Module  │ │ Module  │ │ Module  │ │ Module  │       │    │
│  │  └─────────┘ └─────────┘ └─────────┘ └─────────┘       │    │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐       │    │
│  │  │Consult- │ │ Payments│ │ Schools │ │   AI    │ ← NEW │    │
│  │  │ations  │ │ Module  │ │ Module  │ │ Module  │       │    │
│  │  └─────────┘ └─────────┘ └─────────┘ └─────────┘       │    │
│  └─────────────────────────────────────────────────────────┘    │
│                             │                                    │
│  ┌──────────────────────────┴───────────────────────────────┐   │
│  │                    PostgreSQL 15                          │   │
│  └───────────────────────────────────────────────────────────┘   │
│                             │                                    │
│  ┌──────────────────────────┴───────────────────────────────┐   │
│  │                       Redis                               │   │
│  │  ├── Session cache                                        │   │
│  │  ├── Rate limiting                                        │   │
│  │  ├── AI response cache ← NEW                              │   │
│  │  └── Background jobs (Bull) ← NEW                         │   │
│  └───────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    EXTERNAL SERVICES                             │
│  ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌───────────┐    │
│  │  Claude   │  │  Kaspi    │  │   S3      │  │  Agora    │    │
│  │  API ←NEW │  │  Pay      │  │  Storage  │  │  Video    │    │
│  └───────────┘  └───────────┘  └───────────┘  └───────────┘    │
│  ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌───────────┐    │
│  │ SendGrid  │  │  Twilio   │  │  Sentry   │  │  Firebase │    │
│  │  Email    │  │   SMS     │  │  Errors   │  │   Push    │    │
│  └───────────┘  └───────────┘  └───────────┘  └───────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

### 3.2 Новая структура модулей Backend

```
backend/src/
├── app.module.ts
├── main.ts
│
├── common/
│   ├── decorators/
│   │   ├── @Public()
│   │   ├── @Roles()
│   │   ├── @CurrentUser()
│   │   └── @ApiPaginated() ← NEW
│   ├── filters/
│   │   └── http-exception.filter.ts ← NEW
│   ├── interceptors/
│   │   ├── logging.interceptor.ts ← NEW
│   │   └── transform.interceptor.ts ← NEW
│   ├── guards/
│   │   ├── jwt-auth.guard.ts
│   │   └── roles.guard.ts
│   └── prisma/
│       ├── prisma.module.ts
│       └── prisma.service.ts
│
├── modules/
│   ├── auth/           ✅ Готово (95%)
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   ├── strategies/jwt.strategy.ts
│   │   └── dto/
│   │
│   ├── users/          ✅ Готово (90%)
│   │   ├── users.controller.ts
│   │   ├── users.service.ts
│   │   └── dto/
│   │
│   ├── tests/          ❌ Требуется (P0)
│   │   ├── tests.controller.ts
│   │   ├── tests.service.ts
│   │   ├── sessions.controller.ts
│   │   ├── sessions.service.ts
│   │   └── dto/
│   │       ├── test-response.dto.ts
│   │       ├── start-test.dto.ts
│   │       └── answer.dto.ts
│   │
│   ├── results/        ❌ Требуется (P0)
│   │   ├── results.controller.ts
│   │   ├── results.service.ts
│   │   ├── pdf.service.ts
│   │   └── dto/
│   │
│   ├── payments/       ❌ Требуется (P0)
│   │   ├── payments.controller.ts
│   │   ├── payments.service.ts
│   │   ├── providers/
│   │   │   ├── kaspi.provider.ts
│   │   │   └── paybox.provider.ts
│   │   └── dto/
│   │
│   ├── consultations/  ❌ Требуется (P1)
│   │   ├── consultations.controller.ts
│   │   ├── consultations.service.ts
│   │   ├── video.service.ts (Agora)
│   │   └── dto/
│   │
│   ├── psychologists/  ❌ Требуется (P1)
│   │   ├── psychologists.controller.ts
│   │   ├── psychologists.service.ts
│   │   └── dto/
│   │
│   ├── schools/        ❌ Требуется (P2)
│   │   ├── schools.controller.ts
│   │   ├── schools.service.ts
│   │   ├── import.service.ts
│   │   └── dto/
│   │
│   ├── ai/             ❌ NEW (P1)
│   │   ├── ai.module.ts
│   │   ├── ai.service.ts
│   │   ├── prompts/
│   │   │   ├── interpretation.prompt.ts
│   │   │   ├── chatbot.prompt.ts
│   │   │   └── crisis-detection.prompt.ts
│   │   └── dto/
│   │
│   └── admin/          ❌ Требуется (P2)
│       ├── admin.controller.ts
│       ├── admin.service.ts
│       └── dto/
│
├── jobs/               ❌ NEW
│   ├── jobs.module.ts
│   ├── pdf-generation.job.ts
│   ├── email-notification.job.ts
│   └── ai-interpretation.job.ts
│
└── health/
    └── health.module.ts ✅ Готово
```

### 3.3 Новая структура Frontend

```
frontend/
├── app/
│   ├── layout.tsx           ✅ Готово
│   ├── page.tsx             ❌ Landing Page (P0)
│   ├── providers.tsx        ✅ Готово
│   ├── globals.css          ✅ Готово
│   │
│   ├── (auth)/              ✅ Готово
│   │   ├── login/page.tsx
│   │   └── register/page.tsx
│   │
│   ├── (protected)/         ⚠️ Частично
│   │   ├── layout.tsx       ❌ Protected layout wrapper
│   │   ├── dashboard/page.tsx ⚠️ Базовый
│   │   │
│   │   ├── tests/           ❌ P0
│   │   │   ├── page.tsx         (каталог)
│   │   │   ├── [id]/page.tsx    (детали теста)
│   │   │   └── [id]/session/page.tsx (прохождение)
│   │   │
│   │   ├── results/         ❌ P0
│   │   │   ├── page.tsx         (история)
│   │   │   └── [id]/page.tsx    (детальный результат)
│   │   │
│   │   ├── children/        ❌ P1
│   │   │   └── page.tsx
│   │   │
│   │   ├── consultations/   ❌ P1
│   │   │   ├── page.tsx
│   │   │   └── [id]/page.tsx
│   │   │
│   │   ├── psychologists/   ❌ P1
│   │   │   ├── page.tsx
│   │   │   └── [id]/page.tsx
│   │   │
│   │   └── profile/         ❌ P2
│   │       └── page.tsx
│   │
│   └── api/
│       └── auth/[...nextauth]/route.ts ✅ Готово
│
├── components/              ❌ Требуется создать
│   ├── ui/                  (shadcn/ui components)
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── input.tsx
│   │   ├── modal.tsx
│   │   └── ...
│   │
│   ├── layout/
│   │   ├── Navbar.tsx       ❌ P0
│   │   ├── Sidebar.tsx      ❌ P1
│   │   ├── Footer.tsx       ❌ P0
│   │   └── MobileMenu.tsx   ❌ P1
│   │
│   ├── tests/
│   │   ├── TestCard.tsx     ❌ P0
│   │   ├── TestSession.tsx  ❌ P0
│   │   ├── QuestionRenderer.tsx ❌ P0
│   │   └── ProgressBar.tsx  ❌ P0
│   │
│   ├── results/
│   │   ├── ResultCard.tsx   ❌ P0
│   │   ├── ScoreChart.tsx   ❌ P0
│   │   └── Recommendations.tsx ❌ P0
│   │
│   ├── onboarding/
│   │   └── OnboardingWizard.tsx ❌ P1
│   │
│   └── chat/
│       └── ChatWidget.tsx   ❌ P2
│
├── lib/
│   ├── api.ts              ✅ Готово
│   ├── auth.ts             ✅ Готово
│   ├── utils.ts            ❌ Требуется
│   └── constants.ts        ❌ Требуется
│
├── hooks/                   ❌ Требуется создать
│   ├── useAuth.ts
│   ├── useTests.ts
│   ├── useResults.ts
│   └── usePagination.ts
│
├── types/
│   ├── auth.ts             ✅ Готово
│   ├── tests.ts            ❌ Требуется
│   ├── results.ts          ❌ Требуется
│   └── next-auth.d.ts      ✅ Готово
│
└── public/
    ├── images/             ❌ Требуется
    └── icons/              ❌ Требуется
```

---

## РАЗДЕЛ 4: ДЕТАЛЬНЫЕ СПЕЦИФИКАЦИИ

### 4.1 API Specifications (OpenAPI)

#### Tests Module API

```yaml
/api/v1/tests:
  get:
    summary: Get all tests
    parameters:
      - name: category
        in: query
        schema:
          type: string
          enum: [ANXIETY, MOTIVATION, ATTENTION, EMOTIONS, CAREER, SELF_ESTEEM]
      - name: ageMin
        in: query
        schema:
          type: integer
      - name: ageMax
        in: query
        schema:
          type: integer
      - name: isPremium
        in: query
        schema:
          type: boolean
    responses:
      200:
        content:
          application/json:
            schema:
              type: array
              items:
                $ref: '#/components/schemas/Test'

/api/v1/tests/{id}:
  get:
    summary: Get test details
    parameters:
      - name: id
        in: path
        required: true
        schema:
          type: string
          format: uuid
    responses:
      200:
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/TestDetail'

/api/v1/tests/{id}/start:
  post:
    summary: Start a test session
    security:
      - bearerAuth: []
    parameters:
      - name: id
        in: path
        required: true
    requestBody:
      content:
        application/json:
          schema:
            type: object
            required: [childId]
            properties:
              childId:
                type: string
                format: uuid
    responses:
      201:
        content:
          application/json:
            schema:
              type: object
              properties:
                sessionId:
                  type: string
                firstQuestion:
                  $ref: '#/components/schemas/Question'
      402:
        description: Payment required

/api/v1/tests/sessions/{sessionId}/answer:
  post:
    summary: Submit an answer
    requestBody:
      content:
        application/json:
          schema:
            type: object
            required: [questionId, answerOptionId]
            properties:
              questionId:
                type: string
              answerOptionId:
                type: string
              textAnswer:
                type: string
    responses:
      200:
        content:
          application/json:
            schema:
              type: object
              properties:
                nextQuestion:
                  $ref: '#/components/schemas/Question'
                isComplete:
                  type: boolean
                progress:
                  type: number
                  description: Progress percentage (0-100)
```

### 4.2 Database Schema Updates

```prisma
// Дополнения к schema.prisma

// Добавить soft delete
model User {
  // ... existing fields
  deletedAt     DateTime?  @map("deleted_at")  // NEW: soft delete
}

// Добавить audit fields
model TestSession {
  // ... existing fields
  createdBy     String?    @map("created_by")  // NEW
  updatedBy     String?    @map("updated_by")  // NEW
}

// Новая модель для AI interpretations
model AIInterpretation {
  id              String   @id @default(uuid())
  resultId        String   @unique @map("result_id")
  result          Result   @relation(fields: [resultId], references: [id])

  summary         String
  strengths       String[]
  areasForDev     String[] @map("areas_for_dev")
  recommendations Json

  needSpecialist  Boolean  @map("need_specialist")
  specialistReason String? @map("specialist_reason")

  modelVersion    String   @map("model_version")  // claude-sonnet-4
  promptVersion   String   @map("prompt_version") // v1.0

  createdAt       DateTime @default(now()) @map("created_at")

  @@map("ai_interpretations")
}

// Новая модель для chat
model ChatSession {
  id          String        @id @default(uuid())
  userId      String        @map("user_id")

  createdAt   DateTime      @default(now()) @map("created_at")
  updatedAt   DateTime      @updatedAt @map("updated_at")

  messages    ChatMessage[]

  @@map("chat_sessions")
  @@index([userId])
}

model ChatMessage {
  id          String      @id @default(uuid())
  sessionId   String      @map("session_id")
  session     ChatSession @relation(fields: [sessionId], references: [id])

  role        String      // 'user' | 'assistant'
  content     String

  createdAt   DateTime    @default(now()) @map("created_at")

  @@map("chat_messages")
  @@index([sessionId])
}
```

---

## РАЗДЕЛ 5: ПЛАН РЕАЛИЗАЦИИ

### 5.1 Фазы разработки

```
ФАЗА 1: CORE FUNCTIONALITY (4 недели)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Week 1-2:
├── Tests Module (Backend)
│   ├── CRUD endpoints
│   ├── Session management
│   └── Answer processing
├── Tests Module (Frontend)
│   ├── Catalog page
│   ├── Test detail page
│   └── Session UI

Week 3-4:
├── Results Module (Backend)
│   ├── Score calculation
│   ├── PDF generation
│   └── S3 upload
├── Results Module (Frontend)
│   ├── Results history
│   └── Detail view
├── Payments Module
│   ├── Kaspi Pay integration
│   └── Webhook handling

ФАЗА 2: AI & UX (3 недели)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Week 5:
├── AI Module
│   ├── Claude API integration
│   ├── Interpretation prompts
│   └── Caching
├── Landing Page
│   ├── Hero section
│   ├── Features
│   └── Pricing

Week 6-7:
├── Onboarding Wizard
├── Dashboard improvements
├── Navbar & Footer
└── Mobile responsiveness

ФАЗА 3: CONSULTATIONS (2 недели)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Week 8-9:
├── Psychologists Module
│   ├── Profile pages
│   └── Availability
├── Consultations Module
│   ├── Booking flow
│   └── Agora video integration

ФАЗА 4: POLISH & LAUNCH (2 недели)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Week 10:
├── Testing
│   ├── Unit tests (70% coverage)
│   ├── E2E tests (critical paths)
│   └── Security audit

Week 11:
├── Performance optimization
├── Monitoring setup
├── Documentation
└── Soft launch
```

### 5.2 Приоритизированный Backlog

| # | Задача | Приоритет | Effort | Зависимости |
|---|--------|-----------|--------|-------------|
| 1 | Tests Module Backend | P0 | L | - |
| 2 | Tests Module Frontend | P0 | L | #1 |
| 3 | Results Module Backend | P0 | M | #1 |
| 4 | PDF Generation | P0 | M | #3 |
| 5 | Results Frontend | P0 | M | #3 |
| 6 | Kaspi Pay Integration | P0 | M | - |
| 7 | Landing Page | P0 | M | - |
| 8 | AI Interpretation | P1 | M | #3 |
| 9 | Onboarding Wizard | P1 | S | #2 |
| 10 | Navbar + Footer | P1 | S | - |
| 11 | Psychologists Module | P1 | M | - |
| 12 | Consultations Module | P1 | L | #11, #6 |
| 13 | Agora Video | P1 | M | #12 |
| 14 | AI Chatbot | P2 | M | #8 |
| 15 | Schools Module | P2 | L | - |
| 16 | Admin Panel | P2 | L | - |
| 17 | Push Notifications | P2 | S | - |
| 18 | Email Verification | P2 | S | - |

**Effort:** S = 2-3 дня, M = 1 неделя, L = 2+ недели

---

## РАЗДЕЛ 6: КРИТЕРИИ ПРИЁМКИ

### 6.1 Definition of Done

Каждая задача считается выполненной, если:

- [ ] Код написан и прошёл code review
- [ ] Unit tests написаны (coverage > 70%)
- [ ] API документирована в Swagger
- [ ] Нет критических security issues
- [ ] Работает на мобильных устройствах
- [ ] Локализация RU/KZ
- [ ] Нет console errors
- [ ] Lighthouse score > 80

### 6.2 Acceptance Criteria по модулям

#### Tests Module

```gherkin
Feature: Прохождение теста

Scenario: Пользователь проходит тест
  Given пользователь авторизован
  And у пользователя есть ребёнок
  And тест оплачен или бесплатный
  When пользователь начинает тест
  Then создаётся новая сессия
  And показывается первый вопрос

  When пользователь отвечает на вопрос
  Then ответ сохраняется
  And показывается следующий вопрос
  And обновляется прогресс

  When пользователь отвечает на последний вопрос
  Then сессия завершается
  And вычисляется результат
  And генерируется PDF
  And показывается страница результатов
```

#### Payments Module

```gherkin
Feature: Оплата теста

Scenario: Успешная оплата через Kaspi
  Given пользователь выбрал платный тест
  When пользователь нажимает "Оплатить"
  Then создаётся платёж со статусом PENDING
  And пользователь перенаправляется на Kaspi Pay

  When Kaspi отправляет webhook об успешной оплате
  Then статус платежа меняется на COMPLETED
  And пользователь может начать тест

Scenario: Неудачная оплата
  Given пользователь на странице оплаты Kaspi
  When оплата отклонена
  Then статус платежа меняется на FAILED
  And пользователь видит сообщение об ошибке
  And предлагается повторить оплату
```

---

## РАЗДЕЛ 7: РИСКИ И МИТИГАЦИЯ

| Риск | Вероятность | Влияние | Митигация |
|------|-------------|---------|-----------|
| Kaspi API недоступен | Low | Critical | Fallback на PayBox |
| Claude API rate limits | Medium | High | Кэширование, очереди |
| PDF generation slow | Medium | Medium | Background jobs (Bull) |
| Data breach | Low | Critical | Encryption, audit, SIEM |
| Low test coverage | High | Medium | CI/CD gates, TDD |
| Mobile UX issues | Medium | High | Mobile-first design |

---

## РАЗДЕЛ 8: APPENDIX

### A. Контрольный список перед релизом

- [ ] Все P0 задачи выполнены
- [ ] Security audit пройден
- [ ] Load testing (500 concurrent users)
- [ ] Backup стратегия настроена
- [ ] Monitoring и alerting работают
- [ ] Документация актуальна
- [ ] Legal compliance (PDPL)
- [ ] Rollback план готов

### B. Контакты

- **Product Owner:** [TBD]
- **Tech Lead:** [TBD]
- **DevOps:** [TBD]

---

**Версия документа:** 2.0
**Последнее обновление:** 24.12.2025
**Следующий review:** После Фазы 1
