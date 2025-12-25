# ROADMAP: План развития Zharqyn Bala

**Создан на основе:** PROJECT_COMPLIANCE_REPORT.md (аудит 25.12.2025)
**Текущий прогресс:** ~70%
**Цель:** 100% MVP + Production Ready

---

## ОБЗОР ТЕКУЩЕГО СОСТОЯНИЯ

```
РЕАЛИЗОВАНО (70%):                    ТРЕБУЕТСЯ (30%):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━         ━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Auth (JWT + Refresh)               ❌ Консультации с психологами
✅ Users + Children                   ❌ Видео-звонки (Agora)
✅ Tests (полный цикл)                ❌ Школьный портал
✅ Results + History                  ❌ Admin Panel
✅ AI Interpretation (Claude)         ❌ PDF генерация
✅ Payments (Kaspi структура)         ❌ Email уведомления
✅ Frontend (80% страниц)             ❌ Push notifications
✅ Railway Deploy                     ❌ Тесты (unit/e2e)
```

---

## ФАЗА 0: СТАБИЛИЗАЦИЯ (Срочно)

> **Цель:** Сделать текущую версию полностью рабочей

### 0.1 Environment Variables

```bash
# Railway Backend - добавить:
ANTHROPIC_API_KEY=sk-ant-...        # Для AI интерпретаций
KASPI_MERCHANT_ID=...               # Для платежей (или mock)
KASPI_SECRET_KEY=...

# Railway Frontend - добавить:
NEXT_PUBLIC_API_URL=https://zharqynbala-backend-production.up.railway.app
NEXTAUTH_URL=https://zharqynbala-frontend-production.up.railway.app
NEXTAUTH_SECRET=your-secret-key
```

**Задачи:**
- [ ] Настроить ANTHROPIC_API_KEY в Railway Backend
- [ ] Настроить NEXT_PUBLIC_API_URL в Railway Frontend
- [ ] Проверить подключение Frontend → Backend
- [ ] Протестировать AI интерпретацию

### 0.2 Seed Data (Тестовые данные)

```typescript
// prisma/seed.ts - добавить:
- 5 тестовых тестов разных категорий
- 10-15 вопросов на каждый тест
- Варианты ответов с баллами
- Тестовый пользователь
```

**Задачи:**
- [ ] Создать seed.ts с тестовыми данными
- [ ] Запустить `npx prisma db seed`
- [ ] Проверить отображение тестов в каталоге

### 0.3 Критические баги

| Баг | Приоритет | Статус |
|-----|-----------|--------|
| Нет навигации (Navbar) | P0 | ❌ |
| Landing page пустая | P0 | ❌ |
| Dashboard API routes 404 | P1 | ❌ |

**Задачи:**
- [ ] Добавить Navbar компонент
- [ ] Обновить Landing page
- [ ] Исправить API routes в Dashboard

---

## ФАЗА 1: MVP COMPLETION

> **Цель:** Полноценный MVP для первых пользователей

### Sprint 1.1: UI/UX Improvements

```
Компоненты:
├── components/
│   ├── layout/
│   │   ├── Navbar.tsx          # Навигация
│   │   ├── Footer.tsx          # Футер
│   │   ├── Sidebar.tsx         # Боковая панель (опционально)
│   │   └── MobileMenu.tsx      # Мобильное меню
│   │
│   └── ui/
│       ├── Button.tsx          # Переиспользуемая кнопка
│       ├── Card.tsx            # Карточка
│       ├── Modal.tsx           # Модальное окно
│       ├── Input.tsx           # Поле ввода
│       └── Spinner.tsx         # Лоадер
```

**Задачи:**
- [ ] Создать Navbar с навигацией
- [ ] Создать Footer
- [ ] Обновить Landing page (Hero, Features, Pricing, CTA)
- [ ] Добавить Mobile responsive menu
- [ ] Реализовать страницу профиля `/profile`

### Sprint 1.2: Core Features Enhancement

```
Улучшения:
├── Тесты
│   ├── Прогресс-бар при прохождении
│   ├── Таймер (опционально)
│   └── Сохранение прогресса (resume)
│
├── Результаты
│   ├── Графики (Chart.js/Recharts)
│   ├── Сравнение с нормой
│   └── PDF скачивание
│
└── AI
    ├── Детальные рекомендации
    ├── Кэширование ответов
    └── Fallback при ошибках
```

**Задачи:**
- [ ] Добавить прогресс-бар в тест сессию
- [ ] Интегрировать Recharts для графиков результатов
- [ ] Реализовать PDF генерацию (puppeteer или react-pdf)
- [ ] Добавить кэширование AI ответов

### Sprint 1.3: Payments Integration

```
Платежи:
├── Kaspi Pay
│   ├── Реальная интеграция API
│   ├── QR-код генерация
│   ├── Webhook обработка
│   └── Статусы платежей
│
└── UI
    ├── Страница оплаты
    ├── История платежей
    └── Чеки/квитанции
```

**Задачи:**
- [ ] Получить Kaspi Merchant credentials
- [ ] Реализовать генерацию QR-кода
- [ ] Настроить webhook endpoint
- [ ] Создать страницу `/payments`
- [ ] Добавить уведомления об оплате

---

## ФАЗА 2: GROWTH FEATURES

> **Цель:** Функции для роста и удержания пользователей

### Sprint 2.1: Onboarding & Engagement

```
Onboarding Wizard:
├── Step 1: Приветствие
├── Step 2: Добавление ребёнка
├── Step 3: Выбор первого теста
├── Step 4: Прохождение теста
└── Step 5: Просмотр результатов + Upsell

Email Notifications:
├── Приветственное письмо
├── Результаты теста готовы
├── Напоминание о незавершённом тесте
├── Рекомендации от AI
└── Промо-акции
```

**Задачи:**
- [ ] Создать OnboardingWizard компонент
- [ ] Интегрировать SendGrid/Resend для email
- [ ] Создать email templates
- [ ] Реализовать триггеры уведомлений

### Sprint 2.2: Consultations Module

```
Консультации:
├── Backend
│   ├── /psychologists         # Список психологов
│   ├── /consultations         # CRUD консультаций
│   ├── /consultations/book    # Бронирование
│   └── /consultations/:id/join # Подключение к видео
│
├── Frontend
│   ├── /psychologists         # Каталог психологов
│   ├── /psychologists/:id     # Профиль психолога
│   ├── /consultations         # Мои консультации
│   └── /consultations/:id     # Видео-консультация
│
└── Integrations
    ├── Agora.io               # Видео-звонки
    ├── Google Calendar        # Синхронизация
    └── Telegram Bot           # Напоминания
```

**Задачи:**
- [ ] Создать PsychologistsModule (backend)
- [ ] Создать ConsultationsModule (backend)
- [ ] Интегрировать Agora SDK
- [ ] Создать UI для бронирования
- [ ] Реализовать видео-комнату

### Sprint 2.3: Advanced AI Features

```
AI Improvements:
├── Chatbot Widget
│   ├── Floating button
│   ├── Chat interface
│   ├── Context awareness
│   └── Escalation to human
│
├── Smart Recommendations
│   ├── На основе результатов
│   ├── Персонализированные
│   └── Возрастные
│
└── Crisis Detection
    ├── Анализ ответов
    ├── Red flags detection
    └── Автоматическое уведомление
```

**Задачи:**
- [ ] Создать ChatWidget компонент
- [ ] Реализовать /ai/chat endpoint
- [ ] Добавить контекст пользователя в промпты
- [ ] Реализовать crisis detection logic

---

## ФАЗА 3: B2B & SCALE

> **Цель:** B2B функционал и масштабирование

### Sprint 3.1: Schools Portal

```
Школьный портал:
├── Backend
│   ├── /schools               # CRUD школ
│   ├── /schools/:id/classes   # Классы
│   ├── /schools/:id/students  # Ученики
│   ├── /schools/:id/reports   # Отчёты
│   └── /schools/import        # Импорт Excel
│
├── Frontend (отдельное приложение)
│   ├── /dashboard             # Обзор школы
│   ├── /classes               # Управление классами
│   ├── /students              # Список учеников
│   ├── /testing               # Массовое тестирование
│   └── /reports               # Аналитика
│
└── Features
    ├── Bulk testing           # Массовое тестирование
    ├── Class analytics        # Аналитика по классам
    ├── Export reports         # Экспорт в Excel/PDF
    └── Teacher accounts       # Аккаунты учителей
```

**Задачи:**
- [ ] Создать SchoolsModule (backend)
- [ ] Реализовать импорт из Excel
- [ ] Создать отдельный frontend для школ
- [ ] Реализовать массовое тестирование
- [ ] Добавить аналитические отчёты

### Sprint 3.2: Admin Panel

```
Admin Panel:
├── Dashboard
│   ├── Метрики (пользователи, тесты, доходы)
│   ├── Графики роста
│   └── Активность в реальном времени
│
├── Management
│   ├── Users management
│   ├── Tests management
│   ├── Psychologists management
│   ├── Schools management
│   └── Payments management
│
└── Settings
    ├── Pricing configuration
    ├── Feature flags
    ├── Email templates
    └── System settings
```

**Задачи:**
- [ ] Создать AdminModule (backend)
- [ ] Реализовать RBAC (Role-Based Access Control)
- [ ] Создать Admin UI (можно использовать AdminJS/Retool)
- [ ] Добавить аналитику и метрики

### Sprint 3.3: Infrastructure & Performance

```
Infrastructure:
├── Caching
│   ├── Redis для сессий
│   ├── Redis для AI cache
│   └── CDN для статики
│
├── Background Jobs
│   ├── Bull Queue
│   ├── PDF generation
│   ├── Email sending
│   └── AI processing
│
├── Monitoring
│   ├── Sentry (errors)
│   ├── Prometheus (metrics)
│   ├── Grafana (dashboards)
│   └── Alerting
│
└── Security
    ├── WAF (Cloudflare)
    ├── DDoS protection
    ├── Rate limiting per user
    └── Audit logging
```

**Задачи:**
- [ ] Добавить Redis в Railway
- [ ] Настроить Bull Queue
- [ ] Интегрировать Sentry
- [ ] Настроить CI/CD (GitHub Actions)
- [ ] Добавить Cloudflare

---

## ФАЗА 4: QUALITY & POLISH

> **Цель:** Production-ready качество

### Sprint 4.1: Testing

```
Тестирование:
├── Unit Tests (Jest)
│   ├── Services
│   ├── Controllers
│   └── Utils
│
├── Integration Tests
│   ├── API endpoints
│   ├── Database operations
│   └── External APIs mocks
│
├── E2E Tests (Playwright)
│   ├── Auth flow
│   ├── Test flow
│   ├── Payment flow
│   └── Consultation flow
│
└── Coverage Target: 70%+
```

**Задачи:**
- [ ] Настроить Jest для backend
- [ ] Написать unit tests для сервисов
- [ ] Настроить Playwright
- [ ] Написать E2E тесты для критических путей
- [ ] Интегрировать в CI/CD

### Sprint 4.2: Documentation

```
Документация:
├── Technical
│   ├── API Reference (Swagger)
│   ├── Architecture docs
│   ├── Database schema
│   └── Deployment guide
│
├── User
│   ├── FAQ
│   ├── User guide
│   ├── Video tutorials
│   └── Help center
│
└── Developer
    ├── CONTRIBUTING.md
    ├── Code style guide
    ├── PR template
    └── Issue templates
```

**Задачи:**
- [ ] Обновить README.md
- [ ] Создать CONTRIBUTING.md
- [ ] Добавить JSDoc комментарии
- [ ] Создать Architecture Decision Records (ADR)
- [ ] Написать User Guide

### Sprint 4.3: Accessibility & i18n

```
A11y & i18n:
├── Accessibility (WCAG 2.1 AA)
│   ├── Semantic HTML
│   ├── Keyboard navigation
│   ├── Screen reader support
│   ├── Color contrast
│   └── Focus indicators
│
└── Internationalization
    ├── Russian (default)
    ├── Kazakh
    └── English (future)
```

**Задачи:**
- [ ] Провести a11y аудит (axe-core)
- [ ] Исправить accessibility issues
- [ ] Настроить next-intl
- [ ] Добавить казахский язык
- [ ] Добавить language switcher

---

## МЕТРИКИ УСПЕХА

### Business KPIs

| Метрика | Текущее | Цель MVP | Цель 6 мес |
|---------|---------|----------|------------|
| Регистрации | 0 | 100 | 1000 |
| MAU | 0 | 50 | 500 |
| Тестов пройдено | 0 | 200 | 5000 |
| Конверсия в оплату | - | 5% | 10% |
| Доход | 0 | 50k KZT | 500k KZT |

### Technical KPIs

| Метрика | Текущее | Цель |
|---------|---------|------|
| Test coverage | 0% | 70% |
| Lighthouse score | ~60 | 90+ |
| API response time | ~500ms | <200ms |
| Error rate | ? | <1% |
| Uptime | ? | 99.5% |

---

## TIMELINE

```
                    2025                          2026
         DEC    JAN    FEB    MAR    APR    MAY
          |      |      |      |      |      |
ФАЗА 0   ████                                    Стабилизация
ФАЗА 1        ██████████                         MVP Completion
ФАЗА 2                  ██████████               Growth Features
ФАЗА 3                            ██████████     B2B & Scale
ФАЗА 4                                    ████   Quality & Polish

         MVP Ready ─────┘       │        │
                   Soft Launch ─┘        │
                              Production ─┘
```

---

## РЕСУРСЫ

### Команда (минимум)

| Роль | Количество | Фаза |
|------|------------|------|
| Fullstack Developer | 1-2 | Все |
| UI/UX Designer | 0.5 | 1-2 |
| QA Engineer | 0.5 | 3-4 |
| DevOps | 0.25 | 3-4 |

### Инфраструктура

| Сервис | Стоимость/мес | Фаза |
|--------|---------------|------|
| Railway (Backend) | $5-20 | Все |
| Railway (Frontend) | $5-20 | Все |
| Railway (PostgreSQL) | $5-10 | Все |
| Railway (Redis) | $5-10 | 2+ |
| Anthropic API | $20-100 | Все |
| SendGrid | $0-20 | 2+ |
| Agora.io | $0-50 | 2+ |
| Sentry | $0-26 | 3+ |
| **Итого** | **$40-256** | - |

### Внешние интеграции

| Интеграция | Статус | Приоритет |
|------------|--------|-----------|
| Claude API | ✅ Готово | P0 |
| Kaspi Pay | ⚠️ Частично | P0 |
| SendGrid | ❌ | P1 |
| Agora.io | ❌ | P2 |
| Firebase Push | ❌ | P3 |
| Google Calendar | ❌ | P3 |

---

## СЛЕДУЮЩИЕ ДЕЙСТВИЯ (This Week)

### Immediate (Сегодня-Завтра)

```bash
1. [ ] Настроить environment variables в Railway
   - ANTHROPIC_API_KEY
   - NEXT_PUBLIC_API_URL
   - NEXTAUTH_SECRET

2. [ ] Создать seed data
   - 5 тестов с вопросами
   - Запустить seed

3. [ ] Проверить работу приложения
   - Регистрация
   - Добавление ребёнка
   - Прохождение теста
   - Просмотр результатов
```

### This Week

```bash
4. [ ] Добавить Navbar компонент
5. [ ] Обновить Landing page
6. [ ] Исправить Dashboard API
7. [ ] Добавить Footer
```

---

**Документ создан:** 25.12.2025
**Последнее обновление:** 25.12.2025
**Владелец:** Product Team
