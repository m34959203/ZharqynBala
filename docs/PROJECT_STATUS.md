# Zharqyn Bala - Документация проекта

## Обзор

**Zharqyn Bala** — платформа психологического здоровья детей (10-17 лет) в Казахстане.

### Основные возможности

- Психологические диагностики (тесты)
- Онлайн-консультации с психологами через видеозвонки
- PDF-отчёты с рекомендациями
- Решения для школ (массовая диагностика)
- Многоязычность (русский, казахский)

---

## Технологический стек

### Backend
| Технология | Версия | Назначение |
|------------|--------|------------|
| NestJS | 10.x | Фреймворк |
| TypeScript | 5.x | Язык программирования |
| PostgreSQL | 15 | База данных |
| Prisma | 5.x | ORM |
| JWT + Passport.js | - | Аутентификация |
| Swagger | - | API документация |

### Frontend
| Технология | Версия | Назначение |
|------------|--------|------------|
| Next.js | 16.x | Фреймворк |
| React | 19.x | UI библиотека |
| TypeScript | 5.x | Язык программирования |
| Tailwind CSS | 4.x | Стилизация |
| NextAuth.js | 4.x | Аутентификация |
| Jitsi Meet | - | Видеозвонки |

### Инфраструктура
| Технология | Назначение |
|------------|------------|
| Docker | Контейнеризация |
| Railway.app | Хостинг |
| PostgreSQL | База данных |
| Redis | Кэширование (опционально) |

---

## Архитектура проекта

```
ZharqynBala/
├── backend/                 # NestJS API сервер
│   ├── src/
│   │   ├── modules/        # Бизнес-модули
│   │   ├── common/         # Общие утилиты
│   │   └── health/         # Health checks
│   └── prisma/             # База данных
├── frontend/               # Next.js веб-приложение
│   ├── app/               # Страницы (App Router)
│   ├── components/        # React компоненты
│   └── lib/               # Утилиты
├── mobile/                 # React Native (Expo)
├── infrastructure/         # Docker конфигурация
└── docs/                   # Документация
```

---

## Backend модули

### Основные модули

| Модуль | Путь | Назначение |
|--------|------|------------|
| **AuthModule** | `/modules/auth` | Регистрация, вход, JWT токены, refresh |
| **UsersModule** | `/modules/users` | Управление профилями, детьми |
| **TestsModule** | `/modules/tests` | Психологические тесты |
| **ResultsModule** | `/modules/results` | Обработка результатов тестов |
| **PsychologistsModule** | `/modules/psychologists` | Профили психологов |
| **ConsultationsModule** | `/modules/consultations` | Онлайн-консультации с Jitsi |
| **ScheduleModule** | `/modules/schedule` | Расписание консультаций |
| **PaymentsModule** | `/modules/payments` | Интеграция платежей (Kaspi) |
| **SchoolsModule** | `/modules/schools` | Пакеты для школ |
| **PdfModule** | `/modules/pdf` | Генерация PDF-отчётов |
| **AiModule** | `/modules/ai` | AI функционал |
| **CrisisModule** | `/modules/crisis` | Кризисная поддержка |
| **AdminModule** | `/modules/admin` | Административная панель |
| **NotificationsModule** | `/modules/notifications` | Уведомления |
| **AnalyticsModule** | `/modules/analytics` | Аналитика |

### Структура модуля (пример ConsultationsModule)

```
modules/consultations/
├── consultations.module.ts      # Определение модуля
├── consultations.controller.ts  # HTTP эндпоинты
├── consultations.service.ts     # Бизнес-логика
├── jitsi.service.ts            # Интеграция видеозвонков
└── dto/                        # Data Transfer Objects
    ├── index.ts
    ├── consultation-response.dto.ts
    └── create-consultation.dto.ts
```

---

## API эндпоинты

### Аутентификация (`/api/v1/auth`)

| Метод | Путь | Описание |
|-------|------|----------|
| POST | `/register` | Регистрация |
| POST | `/login` | Вход |
| POST | `/refresh` | Обновление токена |
| POST | `/logout` | Выход |

### Пользователи (`/api/v1/users`)

| Метод | Путь | Описание |
|-------|------|----------|
| GET | `/me` | Текущий пользователь |
| PUT | `/me` | Обновить профиль |
| GET | `/children` | Список детей |
| POST | `/children` | Добавить ребёнка |

### Психологи (`/api/v1/psychologists`)

| Метод | Путь | Описание |
|-------|------|----------|
| GET | `/` | Список психологов (публичный) |
| GET | `/:id` | Профиль психолога |
| GET | `/:id/slots` | Доступные слоты |
| GET | `/me` | Свой профиль (для психолога) |
| PUT | `/me` | Обновить свой профиль |

### Консультации (`/api/v1/consultations`)

| Метод | Путь | Описание | Роль |
|-------|------|----------|------|
| POST | `/` | Записаться | PARENT |
| GET | `/my` | Мои консультации | PARENT |
| GET | `/psychologist` | Консультации психолога | PSYCHOLOGIST |
| GET | `/:id` | Детали консультации | Все |
| PUT | `/:id/confirm` | Подтвердить | PSYCHOLOGIST |
| PUT | `/:id/reject` | Отклонить | PSYCHOLOGIST |
| PUT | `/:id/cancel` | Отменить | PARENT |
| PUT | `/:id/start` | Начать | Все |
| PUT | `/:id/complete` | Завершить | PSYCHOLOGIST |
| PUT | `/:id/no-show` | Отметить неявку | PSYCHOLOGIST |
| PUT | `/:id/rate` | Оставить отзыв | PARENT |
| GET | `/:id/jitsi-config` | Конфиг для видеозвонка | Все |

### Тесты (`/api/v1/tests`)

| Метод | Путь | Описание |
|-------|------|----------|
| GET | `/` | Список тестов |
| GET | `/:id` | Детали теста |
| POST | `/:id/session` | Начать тест |
| POST | `/sessions/:id/answer` | Отправить ответ |
| POST | `/sessions/:id/complete` | Завершить тест |

### Расписание (`/api/v1/schedule`)

| Метод | Путь | Описание |
|-------|------|----------|
| GET | `/` | Получить расписание |
| POST | `/` | Сохранить слоты |
| DELETE | `/` | Удалить слоты |

---

## База данных

### Основные модели

#### User (Пользователь)
```prisma
model User {
  id            String    @id @default(uuid())
  email         String    @unique
  phone         String?   @unique
  passwordHash  String
  role          UserRole  // PARENT, PSYCHOLOGIST, SCHOOL, ADMIN
  firstName     String
  lastName      String
  avatarUrl     String?
  language      Language  // RU, KZ
  isVerified    Boolean   @default(false)
  isActive      Boolean   @default(true)
}
```

#### Psychologist (Психолог)
```prisma
model Psychologist {
  id                String   @id @default(uuid())
  userId            String   @unique
  specialization    String[]
  languages         String[] @default(["Русский"])
  experienceYears   Int
  education         String
  certificateUrl    String?
  hourlyRate        Int
  bio               String?
  isApproved        Boolean  @default(false)
  isAvailable       Boolean  @default(true)
  rating            Float    @default(0)
  totalConsultations Int     @default(0)
}
```

#### Consultation (Консультация)
```prisma
model Consultation {
  id              String             @id @default(uuid())
  psychologistId  String
  clientId        String
  childId         String?
  scheduledAt     DateTime
  durationMinutes Int                @default(50)
  status          ConsultationStatus // PENDING, CONFIRMED, REJECTED, IN_PROGRESS, COMPLETED, CANCELLED, NO_SHOW
  roomName        String?            // Jitsi комната
  roomUrl         String?
  price           Int
  paymentStatus   PaymentStatus      // PENDING, PAID, REFUNDED
  notes           String?
  cancelReason    String?
  rating          Int?               // 1-5
  review          String?
}
```

#### Test (Тест)
```prisma
model Test {
  id              String       @id @default(uuid())
  titleRu         String
  titleKz         String
  descriptionRu   String
  descriptionKz   String
  category        TestCategory // ANXIETY, MOTIVATION, ATTENTION, etc.
  ageMin          Int
  ageMax          Int
  durationMinutes Int
  price           Int          @default(0)
  isActive        Boolean      @default(true)
  isPremium       Boolean      @default(false)
}
```

### Диаграмма связей

```
User ──────┬──────► Psychologist ◄───────── Consultation
           │              │                      │
           │              │                      │
           ▼              ▼                      ▼
        Child ◄──── TestSession ◄───────────  Result
           │              │
           │              │
           ▼              ▼
       SchoolClass     Test ◄─── Question ◄─── AnswerOption
```

---

## Frontend страницы

### Публичные

| Путь | Описание |
|------|----------|
| `/` | Главная страница |
| `/login` | Вход |
| `/register` | Регистрация |
| `/forgot-password` | Восстановление пароля |

### Защищённые (требуют авторизации)

| Путь | Роли | Описание |
|------|------|----------|
| `/dashboard` | Все | Главная панель |
| `/tests` | PARENT | Каталог тестов |
| `/tests/[id]` | PARENT | Детали теста |
| `/tests/[id]/session` | PARENT | Прохождение теста |
| `/results` | PARENT | Результаты |
| `/results/[id]` | PARENT | Детали результата |
| `/consultations` | PARENT, PSYCHOLOGIST | Консультации |
| `/consultations/[id]` | PARENT, PSYCHOLOGIST | Видеоконсультация |
| `/schedule` | PSYCHOLOGIST | Расписание |
| `/profile` | Все | Профиль |
| `/children` | PARENT | Дети |
| `/clients` | PSYCHOLOGIST | Клиенты |
| `/earnings` | PSYCHOLOGIST | Заработки |

### Административные

| Путь | Описание |
|------|----------|
| `/admin/tests` | Управление тестами |
| `/admin/users` | Управление пользователями |
| `/admin/analytics` | Аналитика |
| `/admin/payments` | Платежи |
| `/admin/settings` | Настройки |

---

## Видеоконсультации (Jitsi Meet)

### Архитектура

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Клиент    │────►│  Backend    │────►│ Jitsi Meet  │
│  (Browser)  │◄────│   (NestJS)  │◄────│ (meet.jit.si)│
└─────────────┘     └─────────────┘     └─────────────┘
      │                   │
      │                   │
      ▼                   ▼
┌─────────────┐     ┌─────────────┐
│  Frontend   │     │  PostgreSQL │
│  (Next.js)  │     │     (DB)    │
└─────────────┘     └─────────────┘
```

### Workflow консультации

1. **PENDING** - Клиент записывается к психологу
2. **CONFIRMED** - Психолог подтверждает, создаётся видеокомната
3. **IN_PROGRESS** - Участники входят в видеозвонок
4. **COMPLETED** - Психолог завершает консультацию
5. Клиент оставляет оценку и отзыв

### JitsiService

```typescript
// Генерация комнаты
generateRoomName(consultationId: string): string
// Формат: zharqynbala-{shortId}-{randomToken}

// URL для подключения
getRoomUrl(roomName: string): string
// Возвращает: https://meet.jit.si/{roomName}

// Конфигурация для iframe
getEmbedConfig(roomName: string, userName: string, userEmail?: string)
```

### Преимущества Jitsi Meet

- Полностью бесплатное и open-source
- Работает в браузере без установки приложений
- Соответствует требованиям конфиденциальности
- Не нарушает законы РК
- Можно развернуть собственный сервер

---

## Роли пользователей

| Роль | Описание | Возможности |
|------|----------|-------------|
| **PARENT** | Родитель | Тесты, консультации, дети, результаты |
| **PSYCHOLOGIST** | Психолог | Расписание, клиенты, консультации, заработки |
| **SCHOOL** | Школа | Массовая диагностика, классы, ученики |
| **ADMIN** | Администратор | Полный доступ, управление системой |

---

## Запуск проекта

### Требования

- Node.js 20+
- PostgreSQL 15+
- npm или yarn

### Локальная разработка

```bash
# 1. Клонировать репозиторий
git clone <repository-url>
cd ZharqynBala

# 2. Запустить инфраструктуру (PostgreSQL, Redis)
cd infrastructure
docker-compose -f docker-compose.dev.yml up -d

# 3. Backend
cd ../backend
cp .env.example .env
npm install
npm run prisma:migrate
npm run prisma:seed
npm run start:dev

# 4. Frontend (в новом терминале)
cd ../frontend
cp .env.example .env.local
npm install
npm run dev
```

### Доступ

- Frontend: http://localhost:3000
- Backend API: http://localhost:3001/api/v1
- Swagger: http://localhost:3001/api/docs

---

## Переменные окружения

### Backend (.env)

```env
# Application
NODE_ENV=development
PORT=3001
API_PREFIX=api

# Database
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/zharqynbala"

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=your-refresh-secret
JWT_REFRESH_EXPIRES_IN=7d

# Jitsi (опционально, по умолчанию meet.jit.si)
JITSI_DOMAIN=meet.jit.si

# Payments
KASPI_MERCHANT_ID=your-merchant-id
KASPI_API_KEY=your-api-key
```

### Frontend (.env.local)

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-nextauth-secret
```

---

## Тестирование

### Backend

```bash
# Unit тесты
npm run test

# E2E тесты
npm run test:e2e

# Покрытие
npm run test:cov
```

### Frontend

```bash
# Playwright E2E
npm run test:e2e
```

---

## Деплой

### Railway.app

1. Создать проект в Railway
2. Добавить PostgreSQL аддон
3. Подключить GitHub репозиторий
4. Настроить переменные окружения
5. Деплой автоматический при push

### Docker

```bash
# Build
docker build -t zharqynbala-backend ./backend
docker build -t zharqynbala-frontend ./frontend

# Run
docker run -p 3001:3001 zharqynbala-backend
docker run -p 3000:3000 zharqynbala-frontend
```

---

## Контакты и поддержка

- GitHub Issues: https://github.com/anthropics/claude-code/issues
- Документация API: `/api/docs`

---

## Changelog

### v1.0.0 (Январь 2026)

- Базовая система аутентификации
- Психологические тесты
- Профили психологов
- Система консультаций с Jitsi Meet
- Расписание психологов
- Интерфейс для родителей и психологов
