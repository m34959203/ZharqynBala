# ZharqynBala - Документация для разработчиков

**Версия:** 2.0 | **Дата:** 2026-04-02 | **Статус:** Active Development

---

## 1. О проекте

**ZharqynBala** ("Жарқын Бала") — платформа психологического здоровья школьников (10-17 лет) для Казахстана.

**Ключевые функции:**
- Психологические тесты (билингвальные: RU/KZ)
- AI-интерпретация результатов (Claude / Gemini)
- Видеоконсультации с психологами (Jitsi Meet)
- Школьный портал (массовая диагностика)
- Платежи через Kaspi Pay
- PDF-отчёты

**Роли:** PARENT, PSYCHOLOGIST, SCHOOL, ADMIN

---

## 2. Стек технологий

| Слой | Технология | Версия |
|------|-----------|--------|
| **Backend** | NestJS + TypeScript | 10.3 / 5.3 |
| **ORM** | Prisma | 5.8 |
| **БД** | PostgreSQL | 15 |
| **Frontend** | Next.js + React + TypeScript | 16.1 / 19.2 / 5 |
| **Стили** | Tailwind CSS | 4 |
| **Auth (frontend)** | NextAuth.js | 4.24 |
| **Auth (backend)** | JWT + Passport | - |
| **AI** | Anthropic SDK + Google Generative AI | 0.32 / 0.24 |
| **PDF** | Puppeteer | 21.6 |
| **Видео** | Jitsi Meet | - |
| **Mobile** | React Native + Expo | 0.73 / 50 |
| **Деплой** | Docker + Railway.app | - |
| **Кэш** | Redis | 7 (dev) |

---

## 3. Структура проекта

```
ZharqynBala/
├── backend/                    # NestJS API сервер
│   ├── src/
│   │   ├── main.ts             # Bootstrap, CORS, Swagger, middleware
│   │   ├── app.module.ts       # Root module
│   │   ├── common/
│   │   │   ├── audit/          # Логирование действий
│   │   │   ├── monitoring/     # Health, metrics, logger
│   │   │   ├── prisma/         # PrismaService
│   │   │   └── security/       # Rate limiting, sanitizer, CSP
│   │   └── modules/
│   │       ├── auth/           # JWT, register, login, refresh
│   │       ├── users/          # Профили, дети
│   │       ├── tests/          # Тесты, сессии, ответы
│   │       ├── results/        # Подсчёт баллов, интерпретация
│   │       ├── consultations/  # Бронирование, статусы, Jitsi
│   │       ├── psychologists/  # Профили, расписание, доходы
│   │       ├── schedule/       # Слоты доступности
│   │       ├── payments/       # Kaspi Pay, webhook
│   │       ├── schools/        # Школы, классы, ученики
│   │       ├── admin/          # Дашборд, управление
│   │       ├── ai/             # Claude + Gemini интерпретация
│   │       ├── pdf/            # Генерация PDF (Puppeteer)
│   │       ├── notifications/  # Email, SMS, push
│   │       ├── patient-notes/  # Записи психолога
│   │       ├── crisis/         # Горячие линии
│   │       ├── analytics/      # Аналитика платформы
│   │       └── health/         # Healthcheck
│   ├── prisma/
│   │   ├── schema.prisma       # Схема БД (713 строк, 20+ таблиц)
│   │   ├── seed.ts             # Тестовые данные
│   │   └── migrations/         # 9 миграций
│   ├── test/                   # E2E тесты (Jest + Supertest)
│   └── scripts/                # Утилиты (migrate-prod.sh)
│
├── frontend/                   # Next.js веб-приложение
│   ├── app/
│   │   ├── layout.tsx          # Root layout (SEO, PWA, fonts)
│   │   ├── page.tsx            # Landing page
│   │   ├── providers.tsx       # NextAuth + Toast providers
│   │   ├── login/              # Вход
│   │   ├── register/           # Регистрация
│   │   ├── forgot-password/    # Восстановление пароля
│   │   ├── offline/            # PWA offline
│   │   ├── api/                # Next.js API routes (proxy)
│   │   └── (protected)/        # Защищённые страницы
│   │       ├── layout.tsx      # Auth guard + sidebar навигация
│   │       ├── dashboard/      # Ролевые дашборды
│   │       ├── children/       # Управление детьми (PARENT)
│   │       ├── tests/          # Каталог + прохождение тестов
│   │       ├── results/        # Результаты + AI
│   │       ├── consultations/  # Консультации
│   │       ├── schedule/       # Расписание (PSYCHOLOGIST)
│   │       ├── clients/        # Клиенты (PSYCHOLOGIST)
│   │       ├── earnings/       # Доход (PSYCHOLOGIST)
│   │       ├── classes/        # Классы (SCHOOL)
│   │       ├── students/       # Ученики (SCHOOL)
│   │       ├── testing/        # Групповое тестирование (SCHOOL)
│   │       ├── reports/        # Отчёты (SCHOOL)
│   │       ├── admin/          # Админ-панель
│   │       ├── profile/        # Профиль пользователя
│   │       ├── payment/        # Оплата
│   │       └── onboarding/     # Онбординг
│   ├── components/
│   │   ├── ui/                 # Button, Card, Modal, Toast, Alert, Skeleton, Spinner, EmptyState
│   │   ├── layout/             # Navbar, Footer
│   │   ├── charts/             # BarChart, ScoreChart
│   │   ├── chat/               # ChatWidget
│   │   ├── tests/              # TestCard, TestSession
│   │   ├── video/              # JitsiMeet
│   │   └── onboarding/         # OnboardingWizard
│   ├── lib/
│   │   ├── api.ts              # Axios клиент + interceptors
│   │   ├── auth.ts             # NextAuth конфигурация
│   │   ├── types.ts            # TypeScript интерфейсы
│   │   ├── utils.ts            # Утилиты
│   │   ├── i18n/               # Интернационализация
│   │   └── pwa/                # Service Worker
│   ├── config/
│   │   └── navigation.ts       # Ролевая навигация
│   ├── types/                  # Auth types, NextAuth augmentation
│   └── e2e/                    # Playwright тесты
│
├── mobile/                     # React Native / Expo (КАРКАС)
│   └── src/services/api.ts     # Только API клиент
│
├── infrastructure/
│   └── docker-compose.dev.yml  # PostgreSQL 15, Redis 7, MailHog
│
├── docs/
│   ├── ADDING_TESTS.md         # Как добавлять психологические тесты
│   ├── API_REFERENCE.md        # REST API документация
│   ├── PROJECT_STATUS.md       # Статус проекта
│   └── v0-design-prompt.md     # Дизайн-система и UI промпты
│
├── Dockerfile                  # Multi-stage production build
├── railway.json                # Railway.app конфигурация
└── fix-migration.js            # Ручной фикс сломанных миграций
```

---

## 4. Быстрый старт

### 4.1 Требования

- Node.js 20+
- PostgreSQL 15+
- Docker & Docker Compose (опционально)
- Git

### 4.2 Запуск через Docker (рекомендуется)

```bash
# 1. Клонировать
git clone https://github.com/m34959203/ZharqynBala.git
cd ZharqynBala

# 2. Запустить инфраструктуру (PostgreSQL, Redis, MailHog)
docker compose -f infrastructure/docker-compose.dev.yml up -d

# 3. Backend
cd backend
cp .env.example .env
npm install
npx prisma migrate dev
npx prisma db seed
npm run start:dev
# API: http://localhost:3001
# Swagger: http://localhost:3001/api/docs

# 4. Frontend (в новом терминале)
cd ../frontend
cp .env.example .env.local
npm install
npm run dev
# Web: http://localhost:3000
```

### 4.3 Тестовые аккаунты (из seed)

| Роль | Email | Пароль |
|------|-------|--------|
| ADMIN | admin@zharqynbala.kz | Admin123! |
| PARENT | parent@test.kz | Parent123! |
| PSYCHOLOGIST | psychologist@test.kz | Psychologist123! |
| PSYCHOLOGIST | psychologist2@test.kz | Psychologist123! |

---

## 5. Переменные окружения

### Backend (.env)

```bash
# === ОБЯЗАТЕЛЬНЫЕ ===
NODE_ENV=development
PORT=3001
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/zharqynbala?schema=public"
JWT_SECRET=your-jwt-secret
JWT_REFRESH_SECRET=your-refresh-secret

# === ОПЦИОНАЛЬНЫЕ ===
API_PREFIX=api                    # Default: api
JWT_EXPIRES_IN=15m                # Default: 15m
JWT_REFRESH_EXPIRES_IN=7d         # Default: 7d
CORS_ORIGIN=http://localhost:3000 # Запятая-разделённые origins

# AI (нужен хотя бы один)
ANTHROPIC_API_KEY=sk-ant-...      # Claude API
GEMINI_API_KEY=...                # Google Gemini

# Платежи
KASPI_MERCHANT_ID=...
KASPI_API_KEY=...
KASPI_WEBHOOK_SECRET=...

# Уведомления
SENDGRID_API_KEY=...              # Email
EMAIL_FROM=noreply@zharqynbala.kz
MOBIZON_API_KEY=...               # SMS

# Мониторинг
SENTRY_DSN=...

# Rate Limiting
THROTTLE_TTL=60                   # Default: 60
THROTTLE_LIMIT=100                # Default: 100
```

### Frontend (.env.local)

```bash
# === ОБЯЗАТЕЛЬНЫЕ ===
NEXT_PUBLIC_API_URL=http://localhost:3001   # Backend URL
NEXTAUTH_SECRET=your-nextauth-secret
NEXTAUTH_URL=http://localhost:3000

# === ОПЦИОНАЛЬНЫЕ (OAuth) ===
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
MAILRU_CLIENT_ID=...
MAILRU_CLIENT_SECRET=...
```

---

## 6. База данных

### 6.1 Схема (Prisma)

**Enums:**

| Enum | Значения |
|------|----------|
| UserRole | PARENT, PSYCHOLOGIST, SCHOOL, ADMIN |
| Language | RU, KZ |
| Gender | MALE, FEMALE |
| TestCategory | ANXIETY, MOTIVATION, ATTENTION, EMOTIONS, CAREER, SELF_ESTEEM, SOCIAL, COGNITIVE |
| QuestionType | MULTIPLE_CHOICE, SCALE, YES_NO, TEXT |
| SessionStatus | IN_PROGRESS, COMPLETED, ABANDONED |
| ConsultationStatus | PENDING, CONFIRMED, REJECTED, IN_PROGRESS, COMPLETED, CANCELLED, NO_SHOW |
| PaymentStatus | PENDING, PAID, REFUNDED |
| TransactionStatus | PENDING, COMPLETED, FAILED, REFUNDED |
| PaymentType | DIAGNOSTIC, CONSULTATION, SUBSCRIPTION |
| PaymentProvider | KASPI, PAYBOX |
| SubscriptionPlan | BASIC, STANDARD, PREMIUM, FAMILY |

### 6.2 Модели (20+ таблиц)

```
┌─────────────────────────────────────────────────────────────┐
│                    ЯДРО ПОЛЬЗОВАТЕЛЕЙ                        │
│                                                             │
│  User ─────┬──── Child (1:N)                                │
│  (roles)   ├──── Psychologist (1:1)                         │
│            ├──── School (1:1)                                │
│            ├──── RefreshToken (1:N)                          │
│            └──── SecurityLog (1:N)                           │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                    ТЕСТЫ И ДИАГНОСТИКА                       │
│                                                             │
│  Test ──── Question ──── AnswerOption                        │
│    │                        │                                │
│    └── TestSession ──── Answer                               │
│           │                                                  │
│           └── Result (1:1)                                   │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                    КОНСУЛЬТАЦИИ                              │
│                                                             │
│  Consultation (Psychologist ↔ User/Child)                    │
│       └── PatientNote (1:N)                                  │
│                                                             │
│  PsychologistAvailability (weekly pattern)                   │
│  ScheduleSlot (specific date/hour)                           │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                    ШКОЛЫ                                     │
│                                                             │
│  School ──── SchoolClass ──── Student                        │
│                  └── GroupTest                                │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                    ПЛАТЕЖИ И ПОДПИСКИ                         │
│                                                             │
│  Payment (userId, type, provider, status)                    │
│  Subscription (userId, plan, diagnosticsLeft)                │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                    КОНТЕНТ                                   │
│                                                             │
│  Course ──── Lesson (1:N)                                    │
└─────────────────────────────────────────────────────────────┘
```

### 6.3 Ключевые связи

| Связь | Тип | ON DELETE |
|-------|-----|----------|
| User → Child | 1:N | CASCADE |
| User → Psychologist | 1:1 | CASCADE |
| User → School | 1:1 | CASCADE |
| Test → Question | 1:N | CASCADE |
| Question → AnswerOption | 1:N | CASCADE |
| Test → TestSession | 1:N | - |
| Child → TestSession | 1:N | CASCADE |
| TestSession → Answer | 1:N | CASCADE |
| TestSession → Result | 1:1 | CASCADE |
| SchoolClass → Student | 1:N | CASCADE |
| SchoolClass → GroupTest | 1:N | CASCADE |
| Psychologist → Consultation | 1:N | - |
| Consultation → PatientNote | 1:N | - |

### 6.4 Команды

```bash
cd backend

# Создать миграцию
npx prisma migrate dev --name описание_изменений

# Применить миграции (production)
npx prisma migrate deploy

# Сбросить БД + применить миграции + seed
npx prisma migrate reset

# Сгенерировать клиент
npx prisma generate

# Открыть Prisma Studio (GUI)
npx prisma studio

# Запустить seed
npx prisma db seed
```

---

## 7. API Reference

**Base URL:** `http://localhost:3001/api/v1`
**Swagger:** `http://localhost:3001/api/docs`
**Версионирование:** URI (`/api/v1/...`)
**Auth:** Bearer JWT в заголовке `Authorization`

### 7.1 Полная карта эндпоинтов (119 endpoints)

#### Auth (`/auth`) — 5 endpoints

| Метод | Путь | Auth | Описание |
|-------|------|------|----------|
| POST | `/auth/register` | Public | Регистрация |
| POST | `/auth/login` | Public | Вход (email + password) |
| POST | `/auth/refresh` | Public | Обновить access token |
| POST | `/auth/logout` | JWT | Выход |
| GET | `/auth/me` | JWT | Текущий пользователь |

**Пример регистрации:**
```json
POST /api/v1/auth/register
{
  "email": "user@example.com",
  "password": "Password123!",
  "firstName": "Имя",
  "lastName": "Фамилия",
  "phone": "+77001234567",
  "role": "PARENT",
  "language": "RU"
}

Response 201:
{
  "accessToken": "eyJhbG...",
  "refreshToken": "eyJhbG...",
  "user": { "id": "...", "email": "...", "role": "PARENT", ... }
}
```

#### Users (`/users`) — 10 endpoints

| Метод | Путь | Auth | Описание |
|-------|------|------|----------|
| GET | `/users/me` | JWT | Мой профиль |
| PATCH | `/users/me` | JWT | Обновить профиль |
| DELETE | `/users/me` | JWT | Удалить аккаунт |
| GET | `/users/me/children` | JWT | Список детей |
| GET | `/users/me/children/:childId` | JWT | Профиль ребёнка |
| POST | `/users/me/children` | JWT | Добавить ребёнка |
| PATCH | `/users/me/children/:childId` | JWT | Обновить ребёнка |
| DELETE | `/users/me/children/:childId` | JWT | Удалить ребёнка |
| GET | `/users/:id` | ADMIN | Пользователь по ID |
| DELETE | `/users/:id` | ADMIN | Удалить пользователя |

#### Tests (`/tests`) — 6 endpoints

| Метод | Путь | Auth | Описание |
|-------|------|------|----------|
| GET | `/tests` | Public | Каталог тестов (фильтры: category, isPremium) |
| GET | `/tests/:id` | Public | Детали теста с вопросами |
| POST | `/tests/:id/start` | JWT | Начать тест (создаёт сессию) |
| GET | `/tests/sessions/:sessionId` | JWT | Статус сессии |
| POST | `/tests/sessions/:sessionId/answer` | JWT | Отправить ответ |
| POST | `/tests/sessions/:sessionId/complete` | JWT | Завершить тест |

#### Results (`/results`) — 6 endpoints

| Метод | Путь | Auth | Описание |
|-------|------|------|----------|
| GET | `/results` | JWT | Все результаты пользователя |
| GET | `/results/child/:childId` | JWT | Результаты ребёнка |
| GET | `/results/session/:sessionId` | JWT | Результат по сессии |
| GET | `/results/:id` | JWT | Детальный результат |
| GET | `/results/:id/pdf` | JWT (5/min) | Скачать PDF |
| POST | `/results/calculate/:sessionId` | JWT | Рассчитать результат |
| PATCH | `/results/:id/recalculate` | JWT | Пересчитать |

#### Consultations (`/consultations`) — 11 endpoints

| Метод | Путь | Auth | Описание |
|-------|------|------|----------|
| POST | `/consultations` | PARENT | Забронировать |
| GET | `/consultations/my` | PARENT | Мои консультации |
| PUT | `/consultations/:id/cancel` | PARENT | Отменить |
| PUT | `/consultations/:id/rate` | PARENT | Оценить |
| GET | `/consultations/psychologist` | PSYCHOLOGIST | Консультации психолога |
| PUT | `/consultations/:id/confirm` | PSYCHOLOGIST | Подтвердить |
| PUT | `/consultations/:id/reject` | PSYCHOLOGIST | Отклонить |
| PUT | `/consultations/:id/complete` | PSYCHOLOGIST | Завершить |
| PUT | `/consultations/:id/no-show` | PSYCHOLOGIST | Отметить неявку |
| GET | `/consultations/:id` | JWT (PARENT/PSY/ADMIN) | Детали |
| PUT | `/consultations/:id/start` | JWT (PARENT/PSY/ADMIN) | Начать видео |
| GET | `/consultations/:id/jitsi-config` | JWT (PARENT/PSY/ADMIN) | Конфиг Jitsi |

#### Psychologists (`/psychologists`) — 7 endpoints

| Метод | Путь | Auth | Описание |
|-------|------|------|----------|
| GET | `/psychologists` | Public | Список (пагинация) |
| GET | `/psychologists/:id` | Public | Профиль |
| GET | `/psychologists/:id/slots` | Public | Доступные слоты |
| GET | `/psychologists/me` | PSYCHOLOGIST | Свой профиль |
| PUT | `/psychologists/me` | PSYCHOLOGIST | Обновить профиль |
| GET | `/psychologists/me/clients` | PSYCHOLOGIST | Список клиентов |
| GET | `/psychologists/me/earnings` | PSYCHOLOGIST | Статистика дохода |

#### Schedule (`/schedule`) — 4 endpoints

| Метод | Путь | Auth | Описание |
|-------|------|------|----------|
| GET | `/schedule` | PSYCHOLOGIST | Своё расписание |
| POST | `/schedule` | PSYCHOLOGIST | Сохранить слоты |
| DELETE | `/schedule` | PSYCHOLOGIST | Очистить период |
| GET | `/schedule/psychologist/:id` | Public | Публичное расписание |

#### Payments (`/payments`) — 5 endpoints

| Метод | Путь | Auth | Описание |
|-------|------|------|----------|
| POST | `/payments` | JWT | Создать платёж |
| GET | `/payments` | JWT | История платежей |
| GET | `/payments/:id` | JWT | Детали платежа |
| POST | `/payments/webhook/kaspi` | Public | Kaspi webhook |
| POST | `/payments/:id/simulate-complete` | JWT | **DEV ONLY** Симуляция |

#### Schools (`/schools`) — 10 endpoints

| Метод | Путь | Auth | Описание |
|-------|------|------|----------|
| POST | `/schools` | ADMIN/SCHOOL | Создать школу |
| GET | `/schools` | ADMIN | Список школ |
| GET | `/schools/:id` | ADMIN/SCHOOL | Детали школы |
| PATCH | `/schools/:id` | ADMIN/SCHOOL | Обновить |
| DELETE | `/schools/:id` | ADMIN | Удалить |
| GET | `/schools/:id/stats` | ADMIN/SCHOOL | Статистика |
| GET | `/schools/:id/classes` | ADMIN/SCHOOL | Классы |
| POST | `/schools/:id/students` | ADMIN/SCHOOL | Добавить ученика |
| POST | `/schools/:id/import` | ADMIN/SCHOOL | Импорт из Excel |
| GET | `/schools/:id/reports` | ADMIN/SCHOOL | Отчёты |

#### Admin (`/admin`) — 22 endpoints

| Метод | Путь | Auth | Описание |
|-------|------|------|----------|
| GET | `/admin/dashboard` | ADMIN | Статистика |
| GET | `/admin/dashboard/activity` | ADMIN | Активность |
| GET | `/admin/users` | ADMIN | Пользователи (фильтры) |
| PATCH | `/admin/users/:id` | ADMIN | Обновить пользователя |
| DELETE | `/admin/users/:id` | ADMIN | Удалить |
| POST | `/admin/users/:id/ban` | ADMIN | Заблокировать |
| POST | `/admin/users/:id/unban` | ADMIN | Разблокировать |
| GET | `/admin/tests` | ADMIN | Все тесты |
| GET | `/admin/tests/:id` | ADMIN | Тест по ID |
| POST | `/admin/tests` | ADMIN | Создать тест |
| PATCH | `/admin/tests/:id` | ADMIN | Обновить |
| DELETE | `/admin/tests/:id` | ADMIN | Удалить |
| POST | `/admin/tests/:id/toggle` | ADMIN | Вкл/выкл тест |
| GET | `/admin/payments` | ADMIN | Все платежи |
| POST | `/admin/payments/:id/refund` | ADMIN | Возврат |
| GET | `/admin/psychologists` | ADMIN | Все психологи |
| POST | `/admin/psychologists/:id/verify` | ADMIN | Верифицировать |
| GET | `/admin/settings` | ADMIN | Настройки |
| PATCH | `/admin/settings` | ADMIN | Обновить настройки |
| GET | `/admin/reports/revenue` | ADMIN | Отчёт по доходу |
| GET | `/admin/reports/users` | ADMIN | Отчёт по пользователям |
| GET | `/admin/reports/tests` | ADMIN | Отчёт по тестам |
| DELETE | `/admin/cleanup-demo` | ADMIN | Очистить демо-данные |

#### AI (`/ai`) — 4 endpoints

| Метод | Путь | Auth | Описание |
|-------|------|------|----------|
| POST | `/ai/interpret/:resultId` | JWT | AI-интерпретация результата |
| POST | `/ai/chat` | JWT | Чат с AI-ассистентом |
| POST | `/ai/parse-methodology` | ADMIN | Парсинг методики из текста |
| POST | `/ai/create-test-from-methodology` | ADMIN | Создать тест из методики |

#### Patient Notes (`/patient-notes`) — 6 endpoints

| Метод | Путь | Auth | Описание |
|-------|------|------|----------|
| POST | `/patient-notes` | PSYCHOLOGIST | Создать запись |
| GET | `/patient-notes` | PSYCHOLOGIST | Все записи |
| GET | `/patient-notes/consultation/:id` | PSYCHOLOGIST | По консультации |
| GET | `/patient-notes/:id` | PSYCHOLOGIST | По ID |
| PUT | `/patient-notes/:id` | PSYCHOLOGIST | Обновить |
| DELETE | `/patient-notes/:id` | PSYCHOLOGIST | Удалить |

#### PDF (`/pdf`) — 3 endpoints

| Метод | Путь | Auth | Описание |
|-------|------|------|----------|
| GET | `/pdf/result/:id` | JWT | PDF результата |
| GET | `/pdf/child/:id/report` | JWT | PDF прогресса ребёнка |
| GET | `/pdf/school/:id/report` | JWT | PDF отчёта школы |

#### Analytics (`/analytics`) — 6 endpoints

| Метод | Путь | Auth | Описание |
|-------|------|------|----------|
| GET | `/analytics/dashboard` | ADMIN | Метрики дашборда |
| GET | `/analytics/users` | ADMIN | Аналитика пользователей |
| GET | `/analytics/tests` | ADMIN | Аналитика тестов |
| GET | `/analytics/children` | ADMIN | Аналитика детей |
| GET | `/analytics/revenue` | ADMIN | Аналитика дохода |
| GET | `/analytics/export` | ADMIN | Экспорт (JSON/CSV) |

#### Notifications (`/notifications`) — 7 endpoints

| Метод | Путь | Auth | Описание |
|-------|------|------|----------|
| POST | `/notifications/sms/send-code` | - | Отправить SMS-код |
| POST | `/notifications/sms/verify` | - | Проверить SMS-код |
| POST | `/notifications/push/subscribe` | JWT | Подписка на push |
| DELETE | `/notifications/push/unsubscribe` | JWT | Отписка |
| GET | `/notifications/push/vapid-key` | - | VAPID ключ |
| POST | `/notifications/test/email` | JWT | Тестовое письмо |
| POST | `/notifications/test/push` | JWT | Тестовый push |

#### Crisis (`/crisis`) — 2 endpoints

| Метод | Путь | Auth | Описание |
|-------|------|------|----------|
| GET | `/crisis/resources` | Public | Кризисные ресурсы |
| GET | `/crisis/resources/kz` | Public | Ресурсы Казахстана |

#### Health — 6 endpoints

| Метод | Путь | Auth | Описание |
|-------|------|------|----------|
| GET | `/health` | Public | Healthcheck (без /api prefix) |
| GET | `/health` | Public | Detailed health |
| GET | `/health/ready` | Public | Readiness probe |
| GET | `/health/live` | Public | Liveness probe |
| GET | `/health/metrics` | Public | Prometheus metrics |
| GET | `/health/metrics/json` | Public | JSON metrics |

---

## 8. Аутентификация

### 8.1 Backend (JWT + Passport)

```
POST /auth/login { email, password }
        │
        ▼
  Validate credentials (bcrypt)
        │
        ▼
  Generate tokens:
    - accessToken (JWT, 15min, JWT_SECRET)
    - refreshToken (JWT, 7d, JWT_REFRESH_SECRET)
        │
        ▼
  Store hashed refreshToken in DB
        │
        ▼
  Return { accessToken, refreshToken, user }
```

**Guards:**
- `JwtAuthGuard` — глобальный, проверяет Bearer token
- `RolesGuard` — проверяет роль через `@Roles()` декоратор
- `@Public()` — пропускает JwtAuthGuard

**Автоматический ADMIN:**
Emails `admin@jarkinbala.kz` и `admin@zharqynbala.kz` автоматически получают роль ADMIN при регистрации.

### 8.2 Frontend (NextAuth.js)

**Providers:**
- Credentials (email/password) — всегда
- Google OAuth — если настроены `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`
- Mail.ru OAuth — если настроены `MAILRU_CLIENT_ID` / `MAILRU_CLIENT_SECRET`

**Стратегия:** JWT (не database sessions)

**Хранение токенов:**
- NextAuth session cookie (`next-auth.session-token`)
- Дополнительно: cookies `accessToken` / `refreshToken` + localStorage

**Auto-refresh:** Axios interceptor при 401 → POST `/auth/refresh` → retry

---

## 9. Frontend — Страницы (31 route)

### Публичные

| Route | Файл | Описание |
|-------|------|----------|
| `/` | `app/page.tsx` | Landing page |
| `/login` | `app/login/page.tsx` | Вход |
| `/register` | `app/register/page.tsx` | Регистрация |
| `/forgot-password` | `app/forgot-password/page.tsx` | Восстановление (TODO) |
| `/offline` | `app/offline/page.tsx` | PWA offline |

### Защищённые (требуют auth)

| Route | Роль | Описание |
|-------|------|----------|
| `/dashboard` | ALL | Ролевой дашборд |
| `/profile` | ALL | Профиль |
| `/onboarding` | ALL | Онбординг |
| `/children` | PARENT | Управление детьми |
| `/tests` | PARENT | Каталог тестов |
| `/tests/[id]` | PARENT | Детали теста |
| `/tests/[id]/session` | PARENT | Прохождение теста |
| `/results` | PARENT | Результаты |
| `/results/[id]` | PARENT | Детальный результат |
| `/consultations` | PARENT/PSY | Консультации |
| `/consultations/[id]` | PARENT/PSY | Детали консультации |
| `/payment` | PARENT | Оплата |
| `/schedule` | PSYCHOLOGIST | Расписание |
| `/clients` | PSYCHOLOGIST | Клиенты |
| `/clients/[id]` | PSYCHOLOGIST | Детали клиента |
| `/earnings` | PSYCHOLOGIST | Доход |
| `/classes` | SCHOOL | Классы |
| `/students/import` | SCHOOL | Импорт учеников |
| `/testing/new` | SCHOOL | Новое тестирование |
| `/reports` | SCHOOL | Отчёты |
| `/admin/users` | ADMIN | Пользователи |
| `/admin/psychologists` | ADMIN | Психологи |
| `/admin/tests` | ADMIN | Тесты |
| `/admin/payments` | ADMIN | Платежи |
| `/admin/analytics` | ADMIN | Аналитика |
| `/admin/settings` | ADMIN | Настройки |

---

## 10. Навигация по ролям

### PARENT (Родитель) — синий
- Главная → `/dashboard`
- Мои дети → `/children`
- Тесты → `/tests`
- Результаты → `/results`
- Консультации → `/consultations`

### PSYCHOLOGIST (Психолог) — фиолетовый
- Главная → `/dashboard`
- Расписание → `/schedule`
- Клиенты → `/clients`
- Консультации → `/consultations`
- Доход → `/earnings`

### SCHOOL (Школа) — зелёный
- Главная → `/dashboard`
- Классы → `/classes`
- Ученики → `/students`
- Тестирование → `/testing`
- Отчёты → `/reports`

### ADMIN (Администратор) — красный
- Dashboard → `/dashboard`
- Пользователи → `/admin/users`
- Психологи → `/admin/psychologists`
- Тесты → `/admin/tests`
- Платежи → `/admin/payments`
- Аналитика → `/admin/analytics`
- Настройки → `/admin/settings`

---

## 11. Деплой

### 11.1 Railway.app (текущий)

**Backend:**
- Dockerfile → multi-stage build (node:20-alpine)
- Healthcheck: GET `/health` (timeout: 100s)
- Restart: ON_FAILURE (max 10 retries)
- При старте: миграции → seed → запуск

**Frontend:**
- Отдельный Railway сервис
- `railway.json` в `/frontend/`

### 11.2 Docker (локальный)

```bash
# Инфраструктура
docker compose -f infrastructure/docker-compose.dev.yml up -d

# Сервисы:
# - PostgreSQL 15: localhost:5432 (postgres/postgres, db: zharqynbala)
# - Redis 7: localhost:6379
# - MailHog: SMTP localhost:1025, Web UI localhost:8025
```

### 11.3 Production Dockerfile

```dockerfile
# Stage 1: Build
FROM node:20-alpine AS builder
# npm ci → prisma generate → npm run build

# Stage 2: Production
FROM node:20-alpine
# dumb-init, non-root user (nodejs:1001)
# npm ci --omit=dev → prisma generate
# CMD: migrate deploy → db seed → node dist/main.js
EXPOSE 3001
```

---

## 12. Тестирование

### Backend

```bash
cd backend

# Unit-тесты
npm run test

# E2E тесты
npm run test:e2e

# Coverage
npm run test:cov
```

**Файлы E2E тестов:**
- `test/auth.e2e-spec.ts` — регистрация, логин, refresh, logout
- `test/tests.e2e-spec.ts` — каталог, начало, ответы, завершение
- `test/children.e2e-spec.ts` — CRUD детей
- `test/results.e2e-spec.ts` — результаты, PDF

**Файлы Unit-тестов:**
- `src/modules/auth/auth.service.spec.ts`
- `src/modules/auth/auth.controller.spec.ts`
- `src/modules/users/users.service.spec.ts`
- `src/modules/tests/tests.service.spec.ts`

### Frontend

```bash
cd frontend

# E2E (Playwright)
npx playwright test

# Файлы: e2e/*.spec.ts
# auth, landing, tests, results, consultations, children
```

---

## 13. Seed данные

При `npx prisma db seed` создаются:

### Пользователи
- 1 Admin + 1 Parent (с 1 ребёнком) + 2 Psychologists

### Тесты (8 штук)

| ID | Название | Категория | Возраст | Цена | Premium |
|----|---------|-----------|---------|------|---------|
| test-anxiety-1 | Тест на тревожность | ANXIETY | 10-17 | 0 | Нет |
| test-motivation-1 | Школьная мотивация | MOTIVATION | 10-17 | 0 | Нет |
| test-selfesteem-1 | Самооценка | SELF_ESTEEM | 12-17 | 3500₸ | Да |
| test-attention-1 | Внимание и концентрация | ATTENTION | 8-15 | 4000₸ | Да |
| test-emotions-1 | Эмоциональный интеллект | EMOTIONS | 10-17 | 3000₸ | Нет |
| test-social-1 | Социальные навыки | SOCIAL | 8-16 | 0 | Нет |
| test-stress-1 | Стрессоустойчивость | ANXIETY | 12-17 | 3500₸ | Да |
| test-learning-style-1 | Стиль обучения | COGNITIVE | 10-17 | 0 | Нет |

Все тесты билингвальные (RU + KZ) с вопросами и вариантами ответов.

---

## 14. Как добавить психологический тест

Подробно: `docs/ADDING_TESTS.md`

**Краткий план:**

1. Определить метаданные теста (категория, возраст, вопросы)
2. Добавить данные в `prisma/seed.ts` или через Admin API
3. Добавить логику подсчёта в `backend/src/modules/results/scoring.service.ts`
4. Добавить интерпретации по уровням баллов
5. Запустить seed или создать через `POST /admin/tests`

**Категории:** ANXIETY, MOTIVATION, ATTENTION, EMOTIONS, CAREER, SELF_ESTEEM, SOCIAL, COGNITIVE

**Типы вопросов:** MULTIPLE_CHOICE, SCALE, YES_NO, TEXT

---

## 15. Известные проблемы и технический долг

### CRITICAL — Безопасность

| # | Проблема | Файл | Строки |
|---|---------|------|--------|
| 1 | CSP: `unsafe-eval` + `unsafe-inline` — XSS уязвимость | `backend/src/common/security/security.middleware.ts` | 20-21 |
| 2 | `httpOnly: false` для accessToken cookies (11 мест) | `frontend/app/api/*/route.ts` | ~73 |
| 3 | Hardcoded admin emails → привилегии при регистрации | `backend/src/modules/auth/auth.service.ts` | 51-54 |

### HIGH — Незавершённые функции

| # | Проблема | Файл | Строки |
|---|---------|------|--------|
| 4 | Платежи Kaspi — mock URL, нет реальной интеграции | `backend/src/modules/payments/payments.service.ts` | 100, 193 |
| 5 | Refund — только меняет статус в БД, не вызывает API провайдера | `backend/src/modules/admin/admin.service.ts` | 453 |
| 6 | Кризисные уведомления — только лог, SMS/email не отправляются | `backend/src/modules/crisis/crisis.service.ts` | 306 |
| 7 | `simulate-complete` — dev endpoint доступен в production | `backend/src/modules/payments/payments.controller.ts` | 75-83 |
| 8 | Forgot password — TODO, не реализовано | `frontend/app/forgot-password/page.tsx` | 27 |
| 9 | Settings — не сохраняются (mock return) | `backend/src/modules/admin/admin.service.ts` | 478-494 |

### MEDIUM — Качество кода

| # | Проблема | Файл |
|---|---------|------|
| 10 | 15+ `console.log` в auth flow (логируют email, token presence) | `backend/src/modules/auth/auth.service.ts`, `auth.controller.ts` |
| 11 | Console.log в consultations, main.ts | `consultations.service.ts`, `main.ts` |
| 12 | PDF: `@ts-ignore` для optional puppeteer, `req: any` | `backend/src/modules/pdf/pdf.service.ts`, `pdf.controller.ts` |
| 13 | Push notifications — in-memory (теряются при рестарте) | `backend/src/modules/notifications/push.service.ts` |
| 14 | Dual token storage (cookies + localStorage) — рассинхронизация | `frontend/lib/auth.ts`, `(protected)/layout.tsx` |
| 15 | Миграция `20260109000003` сломана — обход в Dockerfile | `Dockerfile`, `fix-migration.js` |

### LOW — Mobile

| # | Проблема |
|---|---------|
| 16 | Mobile app: есть только API клиент, нет UI/экранов/навигации |

---

## 16. Roadmap для разработки

### Фаза 0: Стабилизация (1-2 дня)

- [ ] Убрать `unsafe-eval` и `unsafe-inline` из CSP
- [ ] Установить `httpOnly: true` для всех auth cookies
- [ ] Вынести admin emails в ENV / БД
- [ ] Убрать `simulate-complete` endpoint (или защитить NODE_ENV check)
- [ ] Удалить console.log из auth flow
- [ ] Исправить сломанную миграцию (нормальный fix, а не обход в Dockerfile)

### Фаза 1: MVP Completion (2-3 недели)

- [ ] Реальная интеграция Kaspi Pay (не mock)
- [ ] Реализовать forgot password (backend + frontend)
- [ ] Подключить email уведомления (SendGrid) к бизнес-событиям
- [ ] Настроить PDF генерацию (установить Chromium или перейти на PDFKit)
- [ ] Добавить больше валидированных тестов (минимум 5-10)
- [ ] Реализовать admin settings persistence
- [ ] Подключить кризисные уведомления (SMS родителям)

### Фаза 2: Полноценный продукт (1-2 месяца)

- [ ] SMS верификация при регистрации
- [ ] OAuth серверная часть (Google callback через backend)
- [ ] Подписки (BASIC/STANDARD/PREMIUM/FAMILY) — полный цикл
- [ ] Курсы и уроки (Course/Lesson — контент)
- [ ] Групповое тестирование для школ — полный цикл
- [ ] Push notifications (persistent storage, web push)
- [ ] Загрузка аватаров (S3)
- [ ] Расширить unit/e2e тесты (покрытие > 70%)

### Фаза 3: Mobile & Scale (2-3 месяца)

- [ ] Mobile app — экраны, навигация, offline
- [ ] Мониторинг (Sentry, Grafana)
- [ ] Redis caching в production
- [ ] CDN для статики
- [ ] Нагрузочное тестирование
- [ ] CI/CD (GitHub Actions)

---

## 17. Полезные команды

```bash
# === BACKEND ===
cd backend
npm run start:dev          # Dev сервер с hot reload
npm run build              # Сборка для production
npm run lint               # ESLint
npm run format             # Prettier
npm run test               # Unit тесты
npm run test:e2e           # E2E тесты
npx prisma studio          # GUI для БД
npx prisma migrate dev     # Новая миграция
npx prisma db seed         # Заполнить тестовыми данными

# === FRONTEND ===
cd frontend
npm run dev                # Dev сервер (localhost:3000)
npm run build              # Сборка
npm run lint               # ESLint
npx playwright test        # E2E тесты

# === INFRASTRUCTURE ===
docker compose -f infrastructure/docker-compose.dev.yml up -d    # Запуск
docker compose -f infrastructure/docker-compose.dev.yml down      # Остановка
docker compose -f infrastructure/docker-compose.dev.yml logs -f   # Логи

# === БАЗА ДАННЫХ ===
# Подключение к dev PostgreSQL
psql -h localhost -U postgres -d zharqynbala

# Полный сброс
npx prisma migrate reset
```

---

## 18. Контакты и ресурсы

| Ресурс | URL |
|--------|-----|
| GitHub | github.com/m34959203/ZharqynBala |
| Production API | zharqynbala-production.up.railway.app |
| Swagger (prod) | {API_URL}/api/docs |
| Railway Dashboard | railway.app |

| Документ | Файл |
|----------|------|
| Добавление тестов | `docs/ADDING_TESTS.md` |
| API Reference | `docs/API_REFERENCE.md` |
| Дизайн-система | `docs/v0-design-prompt.md` |
| Деплой Railway | `RAILWAY_DEPLOYMENT.md` |
| OAuth настройка | `frontend/OAUTH_SETUP.md` |
