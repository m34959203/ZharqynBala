# 🏗️ ТЕХНИЧЕСКАЯ АРХИТЕКТУРА ZHARQYN BALA

## 📐 ОБЩАЯ АРХИТЕКТУРА

```
┌─────────────────────────────────────────────────────────────┐
│                        ПОЛЬЗОВАТЕЛИ                         │
│  (Родители, Психологи, Школы, Администраторы)              │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                          CDN                                │
│                   (Cloudflare)                              │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND LAYER                           │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              Next.js 14 (App Router)                 │  │
│  │  • SSR/SSG для SEO                                   │  │
│  │  • React 18 + TypeScript                             │  │
│  │  • Tailwind CSS + shadcn/ui                          │  │
│  │  • Zustand (State Management)                        │  │
│  │  • React Query (Server State)                        │  │
│  │  • i18next (Русский/Казахский)                       │  │
│  └──────────────────────────────────────────────────────┘  │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼ HTTPS (REST API + WebSocket)
┌─────────────────────────────────────────────────────────────┐
│                   API GATEWAY / LOAD BALANCER               │
│                        (Nginx)                              │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                    BACKEND LAYER                            │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              NestJS (Node.js)                        │  │
│  │                                                      │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌────────────┐  │  │
│  │  │   Auth      │  │   Users     │  │  Tests     │  │  │
│  │  │   Module    │  │   Module    │  │  Module    │  │  │
│  │  └─────────────┘  └─────────────┘  └────────────┘  │  │
│  │                                                      │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌────────────┐  │  │
│  │  │ Bookings    │  │  Payments   │  │  Reports   │  │  │
│  │  │   Module    │  │   Module    │  │  Module    │  │  │
│  │  └─────────────┘  └─────────────┘  └────────────┘  │  │
│  │                                                      │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌────────────┐  │  │
│  │  │   Schools   │  │   Admin     │  │  Video     │  │  │
│  │  │   Module    │  │   Module    │  │  Module    │  │  │
│  │  └─────────────┘  └─────────────┘  └────────────┘  │  │
│  └──────────────────────────────────────────────────────┘  │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                     DATA LAYER                              │
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌─────────────────┐  │
│  │  PostgreSQL  │  │    Redis     │  │  S3 Storage     │  │
│  │              │  │              │  │                 │  │
│  │  • Users     │  │  • Sessions  │  │  • PDF Reports │  │
│  │  • Tests     │  │  • Cache     │  │  • Avatars     │  │
│  │  • Results   │  │  • Queues    │  │  • Videos      │  │
│  │  • Payments  │  │              │  │                 │  │
│  └──────────────┘  └──────────────┘  └─────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                 ВНЕШНИЕ СЕРВИСЫ                             │
│                                                             │
│  • Kaspi Pay / PayBox (Платежи)                            │
│  • Twilio / SMS.ru (SMS)                                   │
│  • SendGrid (Email)                                        │
│  • WhatsApp Business API                                   │
│  • Agora / Zoom SDK (Видео)                                │
│  • Sentry (Error Tracking)                                 │
│  • Yandex Metrica / Google Analytics                       │
└─────────────────────────────────────────────────────────────┘
```

---

## 🗄️ СХЕМА БАЗЫ ДАННЫХ

### Основные таблицы:

```sql
-- ПОЛЬЗОВАТЕЛИ
users
  - id (uuid, PK)
  - email (string, unique)
  - phone (string, unique)
  - password_hash (string)
  - role (enum: parent, psychologist, school, admin)
  - first_name (string)
  - last_name (string)
  - avatar_url (string)
  - language (enum: ru, kz)
  - is_verified (boolean)
  - created_at (timestamp)
  - updated_at (timestamp)

-- ПРОФИЛИ ДЕТЕЙ
children
  - id (uuid, PK)
  - parent_id (uuid, FK -> users.id)
  - first_name (string)
  - last_name (string)
  - birth_date (date)
  - gender (enum: male, female)
  - school (string)
  - grade (integer)
  - created_at (timestamp)

-- ПСИХОЛОГИ (расширенная информация)
psychologists
  - id (uuid, PK)
  - user_id (uuid, FK -> users.id)
  - specialization (string[])
  - experience_years (integer)
  - education (text)
  - certificate_url (string)
  - hourly_rate (integer)
  - bio (text)
  - is_approved (boolean)
  - rating (decimal)
  - total_consultations (integer)

-- ШКОЛЫ
schools
  - id (uuid, PK)
  - user_id (uuid, FK -> users.id)
  - school_name (string)
  - region (string)
  - city (string)
  - address (string)
  - contact_person (string)
  - subscription_until (date)
  - total_students (integer)

-- ТЕСТЫ/ДИАГНОСТИКИ
tests
  - id (uuid, PK)
  - title_ru (string)
  - title_kz (string)
  - description_ru (text)
  - description_kz (text)
  - category (enum: anxiety, motivation, attention, etc.)
  - age_min (integer)
  - age_max (integer)
  - duration_minutes (integer)
  - price (integer)
  - is_active (boolean)
  - order (integer)
  - created_at (timestamp)

-- ВОПРОСЫ
questions
  - id (uuid, PK)
  - test_id (uuid, FK -> tests.id)
  - question_text_ru (text)
  - question_text_kz (text)
  - question_type (enum: multiple_choice, scale, yes_no)
  - order (integer)

-- ВАРИАНТЫ ОТВЕТОВ
answer_options
  - id (uuid, PK)
  - question_id (uuid, FK -> questions.id)
  - option_text_ru (text)
  - option_text_kz (text)
  - score (integer)
  - order (integer)

-- ПРОХОЖДЕНИЕ ТЕСТОВ
test_sessions
  - id (uuid, PK)
  - test_id (uuid, FK -> tests.id)
  - child_id (uuid, FK -> children.id)
  - started_at (timestamp)
  - completed_at (timestamp)
  - status (enum: in_progress, completed, abandoned)
  - current_question (integer)

-- ОТВЕТЫ
answers
  - id (uuid, PK)
  - session_id (uuid, FK -> test_sessions.id)
  - question_id (uuid, FK -> questions.id)
  - answer_option_id (uuid, FK -> answer_options.id)
  - answered_at (timestamp)

-- РЕЗУЛЬТАТЫ
results
  - id (uuid, PK)
  - session_id (uuid, FK -> test_sessions.id)
  - total_score (integer)
  - interpretation (text)
  - recommendations (text)
  - pdf_url (string)
  - created_at (timestamp)

-- КОНСУЛЬТАЦИИ
consultations
  - id (uuid, PK)
  - psychologist_id (uuid, FK -> psychologists.id)
  - parent_id (uuid, FK -> users.id)
  - child_id (uuid, FK -> children.id)
  - scheduled_at (timestamp)
  - duration_minutes (integer)
  - status (enum: scheduled, completed, cancelled)
  - meeting_url (string)
  - price (integer)
  - notes (text)
  - rating (integer)
  - review (text)

-- ПОДПИСКИ
subscriptions
  - id (uuid, PK)
  - user_id (uuid, FK -> users.id)
  - plan (enum: premium)
  - started_at (timestamp)
  - expires_at (timestamp)
  - is_active (boolean)
  - auto_renew (boolean)
  - diagnostics_left (integer)

-- ПЛАТЕЖИ
payments
  - id (uuid, PK)
  - user_id (uuid, FK -> users.id)
  - amount (integer)
  - currency (enum: KZT)
  - payment_type (enum: diagnostic, consultation, subscription)
  - related_id (uuid) -- ID теста, консультации или подписки
  - provider (enum: kaspi, paybox)
  - external_id (string)
  - status (enum: pending, completed, failed, refunded)
  - created_at (timestamp)
  - completed_at (timestamp)

-- КЛАССЫ (для школ)
school_classes
  - id (uuid, PK)
  - school_id (uuid, FK -> schools.id)
  - grade (integer)
  - letter (string)
  - academic_year (string)

-- УЧЕНИКИ (для школ)
students
  - id (uuid, PK)
  - class_id (uuid, FK -> school_classes.id)
  - first_name (string)
  - last_name (string)
  - birth_date (date)
  - gender (enum: male, female)

-- МАССОВЫЕ ДИАГНОСТИКИ
group_tests
  - id (uuid, PK)
  - school_id (uuid, FK -> schools.id)
  - class_id (uuid, FK -> school_classes.id)
  - test_id (uuid, FK -> tests.id)
  - assigned_at (timestamp)
  - deadline (timestamp)
  - completed_count (integer)
  - total_count (integer)

-- КУРСЫ
courses
  - id (uuid, PK)
  - title_ru (string)
  - title_kz (string)
  - description_ru (text)
  - description_kz (text)
  - thumbnail_url (string)
  - is_premium (boolean)
  - order (integer)

-- УРОКИ
lessons
  - id (uuid, PK)
  - course_id (uuid, FK -> courses.id)
  - title_ru (string)
  - title_kz (string)
  - video_url (string)
  - duration_minutes (integer)
  - order (integer)

-- ПРОГРЕСС ПО КУРСАМ
course_progress
  - id (uuid, PK)
  - user_id (uuid, FK -> users.id)
  - lesson_id (uuid, FK -> lessons.id)
  - completed (boolean)
  - completed_at (timestamp)
```

### Индексы для оптимизации:
```sql
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_phone ON users(phone);
CREATE INDEX idx_test_sessions_child ON test_sessions(child_id);
CREATE INDEX idx_test_sessions_status ON test_sessions(status);
CREATE INDEX idx_consultations_psychologist ON consultations(psychologist_id);
CREATE INDEX idx_consultations_scheduled ON consultations(scheduled_at);
CREATE INDEX idx_payments_user ON payments(user_id);
CREATE INDEX idx_payments_status ON payments(status);
```

---

## 🔐 БЕЗОПАСНОСТЬ

### Аутентификация:
```typescript
// JWT токены
{
  accessToken: {
    payload: {
      userId: string,
      role: string,
      email: string
    },
    expiresIn: '15m'
  },
  refreshToken: {
    payload: {
      userId: string,
      tokenVersion: number
    },
    expiresIn: '7d'
  }
}
```

### Шифрование:
- **Пароли:** bcrypt (salt rounds: 12)
- **Персональные данные:** AES-256-GCM
- **Токены:** HS256 (для JWT)
- **Коммуникация:** HTTPS/TLS 1.3

### Защита от атак:
```typescript
// Rate limiting
app.use(rateLimit({
  windowMs: 15 * 60 * 1000, // 15 минут
  max: 100 // лимит запросов
}));

// CSRF защита
app.use(csrf({ cookie: true }));

// XSS защита
app.use(helmet());

// SQL Injection защита
// Используем ORM (TypeORM/Prisma) с параметризованными запросами
```

---

## 📡 API ENDPOINTS

### Authentication:
```
POST   /api/auth/register          # Регистрация
POST   /api/auth/login             # Вход
POST   /api/auth/refresh           # Обновление токена
POST   /api/auth/verify-email      # Верификация email
POST   /api/auth/verify-phone      # Верификация телефона
POST   /api/auth/forgot-password   # Восстановление пароля
POST   /api/auth/reset-password    # Сброс пароля
POST   /api/auth/logout            # Выход
```

### Users:
```
GET    /api/users/me               # Текущий пользователь
PATCH  /api/users/me               # Обновить профиль
GET    /api/users/:id              # Получить пользователя (admin)
DELETE /api/users/me               # Удалить аккаунт
```

### Children:
```
GET    /api/children               # Список детей
POST   /api/children               # Добавить ребенка
GET    /api/children/:id           # Получить ребенка
PATCH  /api/children/:id           # Обновить ребенка
DELETE /api/children/:id           # Удалить ребенка
```

### Tests:
```
GET    /api/tests                  # Список тестов
GET    /api/tests/:id              # Информация о тесте
POST   /api/tests/:id/start        # Начать тест
GET    /api/tests/sessions/:id     # Состояние сессии
POST   /api/tests/sessions/:id/answer  # Отправить ответ
POST   /api/tests/sessions/:id/complete # Завершить тест
```

### Results:
```
GET    /api/results                # История результатов
GET    /api/results/:id            # Конкретный результат
GET    /api/results/:id/pdf        # Скачать PDF
```

### Consultations:
```
GET    /api/consultations          # Список консультаций
POST   /api/consultations          # Забронировать
GET    /api/consultations/:id      # Детали консультации
PATCH  /api/consultations/:id      # Изменить (отменить)
POST   /api/consultations/:id/review # Оставить отзыв
```

### Psychologists:
```
GET    /api/psychologists          # Список психологов
GET    /api/psychologists/:id      # Профиль психолога
GET    /api/psychologists/:id/availability # Доступные слоты
```

### Schools:
```
POST   /api/schools/students/import    # Импорт учеников
GET    /api/schools/classes            # Список классов
POST   /api/schools/classes/:id/assign-test # Назначить тест классу
GET    /api/schools/reports/:classId   # Отчет по классу
```

### Subscriptions:
```
POST   /api/subscriptions/subscribe    # Подписаться
POST   /api/subscriptions/cancel       # Отменить подписку
GET    /api/subscriptions/status       # Статус подписки
```

### Payments:
```
POST   /api/payments/create        # Создать платеж
POST   /api/payments/webhook       # Webhook от провайдера
GET    /api/payments/history       # История платежей
```

### Admin:
```
GET    /api/admin/stats            # Статистика
GET    /api/admin/users            # Управление пользователями
POST   /api/admin/tests            # Создать тест
PATCH  /api/admin/tests/:id        # Редактировать тест
GET    /api/admin/payments         # Все платежи
```

---

## 🔄 РЕАЛЬНЫЕ СЦЕНАРИИ ИСПОЛЬЗОВАНИЯ

### Сценарий 1: Родитель проходит диагностику

```typescript
// 1. Родитель выбирает тест
GET /api/tests
Response: [{ id, title, description, price, duration }]

// 2. Просмотр деталей
GET /api/tests/123
Response: { id, title, questions_count, description, price }

// 3. Оплата (если требуется)
POST /api/payments/create
Body: { testId: 123, childId: 456 }
Response: { paymentUrl: 'https://kaspi.kz/pay/...' }

// 4. После оплаты - начало теста
POST /api/tests/123/start
Body: { childId: 456 }
Response: { sessionId: 'abc-123', currentQuestion: {...} }

// 5. Ответы на вопросы
POST /api/tests/sessions/abc-123/answer
Body: { questionId: 1, answerId: 'opt-1' }
Response: { nextQuestion: {...} }

// 6. Завершение
POST /api/tests/sessions/abc-123/complete
Response: { resultId: 'res-123' }

// 7. Просмотр результатов
GET /api/results/res-123
Response: { score, interpretation, recommendations, pdfUrl }

// 8. Скачивание PDF
GET /api/results/res-123/pdf
Response: PDF файл
```

### Сценарий 2: Запись на консультацию

```typescript
// 1. Поиск психолога
GET /api/psychologists?specialization=anxiety
Response: [{ id, name, rating, hourlyRate, specialization }]

// 2. Просмотр профиля
GET /api/psychologists/789
Response: { id, name, bio, experience, rating, reviews }

// 3. Доступные слоты
GET /api/psychologists/789/availability?date=2025-12-10
Response: [{ time: '10:00', available: true }, ...]

// 4. Бронирование
POST /api/consultations
Body: {
  psychologistId: 789,
  childId: 456,
  scheduledAt: '2025-12-10T10:00:00Z',
  duration: 60
}
Response: { consultationId, paymentUrl }

// 5. Получение ссылки на видео (в день консультации)
GET /api/consultations/cons-123
Response: { meetingUrl: 'https://meet.zharqynbala.kz/...' }

// 6. После консультации - отзыв
POST /api/consultations/cons-123/review
Body: { rating: 5, review: 'Отличный специалист!' }
```

### Сценарий 3: Школа назначает массовую диагностику

```typescript
// 1. Импорт учеников
POST /api/schools/students/import
Body: FormData (Excel file)
Response: { imported: 25, errors: [] }

// 2. Получение классов
GET /api/schools/classes
Response: [{ id, grade, letter, studentsCount }]

// 3. Назначение теста классу
POST /api/schools/classes/class-123/assign-test
Body: { testId: 456, deadline: '2025-12-20' }
Response: { groupTestId, assignedTo: 25 }

// 4. Мониторинг прогресса
GET /api/schools/group-tests/group-123
Response: { completed: 18, total: 25, progress: 72% }

// 5. Получение отчета
GET /api/schools/reports/class-123?testId=456
Response: {
  classAverage: 65,
  distribution: {...},
  recommendations: '...',
  students: [{ name, score, level }]
}

// 6. Экспорт отчета
GET /api/schools/reports/class-123/export?format=pdf
Response: PDF файл
```

---

## 🚀 DEPLOYMENT

### Production Stack:
```yaml
# docker-compose.yml
version: '3.8'

services:
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - backend

  backend:
    image: zharqynbala/backend:latest
    environment:
      NODE_ENV: production
      DATABASE_URL: ${DATABASE_URL}
      REDIS_URL: ${REDIS_URL}
      JWT_SECRET: ${JWT_SECRET}
    depends_on:
      - postgres
      - redis

  frontend:
    image: zharqynbala/frontend:latest
    environment:
      NEXT_PUBLIC_API_URL: ${API_URL}

  postgres:
    image: postgres:15
    volumes:
      - postgres_data:/var/lib/postgresql/data
    environment:
      POSTGRES_DB: zharqynbala
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}

  redis:
    image: redis:alpine
    volumes:
      - redis_data:/data

volumes:
  postgres_data:
  redis_data:
```

### CI/CD Pipeline (GitHub Actions):
```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Run tests
        run: npm test

  build:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Build Docker images
        run: |
          docker build -t backend ./backend
          docker build -t frontend ./frontend
      - name: Push to registry
        run: |
          docker push zharqynbala/backend:latest
          docker push zharqynbala/frontend:latest

  deploy:
    needs: build
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to server
        run: |
          ssh user@server 'cd /app && docker-compose pull && docker-compose up -d'
```

---

## 📊 МОНИТОРИНГ

### Метрики для отслеживания:
```typescript
// Application Metrics
- Response time (p50, p95, p99)
- Error rate
- Throughput (requests/sec)
- Active users
- Database connection pool
- Redis hit/miss ratio

// Business Metrics
- Registrations per day
- Tests completed per day
- Revenue per day
- Conversion rate (visitor → customer)
- Churn rate
- NPS score

// Infrastructure Metrics
- CPU usage
- Memory usage
- Disk I/O
- Network I/O
- Database queries/sec
```

### Alerting:
```yaml
alerts:
  - name: High Error Rate
    condition: error_rate > 5%
    action: Notify on-call engineer

  - name: Database Connection Pool Full
    condition: db_pool_usage > 90%
    action: Scale up database

  - name: Low Disk Space
    condition: disk_usage > 85%
    action: Clean up logs / Scale storage
```

---

## 🧪 ТЕСТИРОВАНИЕ

### Стратегия тестирования:
```
Pyramid структура:

         /\
        /E2E\          < 10% (критичные user flows)
       /------\
      /  API  \        < 30% (все endpoints)
     /----------\
    /    UNIT    \     < 60% (бизнес-логика)
   /--------------\
```

### Минимальное покрытие:
- **Unit tests:** 70%+
- **Integration tests:** Все критичные API endpoints
- **E2E tests:** 5-10 ключевых сценариев

---

**Документ актуален на:** 05.12.2025
**Версия:** 1.0
**Следующий review:** После завершения MVP
