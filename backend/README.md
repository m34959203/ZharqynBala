# Zharqyn Bala Backend

Production-ready Backend API для платформы Zharqyn Bala на NestJS + Prisma + PostgreSQL.

## 🚀 Быстрый старт

### Требования
- Node.js 18+
- Docker и Docker Compose
- npm или yarn

### Установка

1. Клонируйте репозиторий и перейдите в папку backend:
```bash
cd backend
```

2. Установите зависимости:
```bash
npm install
```

3. Создайте `.env` файл:
```bash
cp .env.example .env
```

4. Запустите инфраструктуру (PostgreSQL + Redis):
```bash
cd ../infrastructure
docker-compose -f docker-compose.dev.yml up -d
cd ../backend
```

5. Примените миграции базы данных:
```bash
npm run prisma:migrate
```

6. (Опционально) Заполните тестовыми данными:
```bash
npm run prisma:seed
```

7. Запустите приложение:
```bash
npm run start:dev
```

Приложение запустится на http://localhost:3001
API Documentation: http://localhost:3001/api/docs

## 📁 Структура проекта

```
backend/
├── prisma/
│   ├── schema.prisma          # Prisma schema (модели БД)
│   ├── migrations/            # Миграции БД
│   └── seed.ts                # Seed данные
│
├── src/
│   ├── modules/               # Функциональные модули
│   │   ├── auth/              # Аутентификация
│   │   ├── users/             # Пользователи
│   │   ├── tests/             # Тесты и диагностики
│   │   ├── consultations/     # Консультации
│   │   └── payments/          # Платежи
│   │
│   ├── common/                # Общие компоненты
│   │   ├── decorators/        # Custom decorators
│   │   ├── filters/           # Exception filters
│   │   ├── guards/            # Guards
│   │   ├── interceptors/      # Interceptors
│   │   ├── pipes/             # Validation pipes
│   │   └── prisma/            # Prisma service
│   │
│   ├── config/                # Конфигурация
│   ├── app.module.ts          # Root module
│   └── main.ts                # Entry point
│
├── test/                      # E2E тесты
├── .env.example               # Пример environment variables
├── package.json               # Dependencies
└── tsconfig.json              # TypeScript config
```

## 🔧 Доступные команды

### Разработка
```bash
npm run start          # Запуск
npm run start:dev      # Запуск с hot-reload
npm run start:debug    # Запуск с debugger
```

### Сборка
```bash
npm run build          # Production build
npm run start:prod     # Запуск production
```

### Тестирование
```bash
npm run test           # Unit tests
npm run test:watch     # Unit tests с watch
npm run test:cov       # Coverage
npm run test:e2e       # E2E tests
```

### База данных (Prisma)
```bash
npm run prisma:generate  # Генерация Prisma Client
npm run prisma:migrate   # Применить миграции
npm run prisma:studio    # Prisma Studio (GUI)
npm run prisma:seed      # Заполнить тестовыми данными
```

### Code quality
```bash
npm run lint           # ESLint
npm run format         # Prettier
```

## 🗄️ База данных

Проект использует PostgreSQL с Prisma ORM.

### Основные таблицы:
- `users` - Пользователи (родители, психологи, школы, админы)
- `children` - Профили детей
- `psychologists` - Профили психологов
- `schools` - Школы
- `tests` - Психологические тесты
- `test_sessions` - Прохождения тестов
- `results` - Результаты тестов
- `consultations` - Консультации
- `payments` - Платежи
- `subscriptions` - Подписки

Полная схема в `prisma/schema.prisma`

## 🔐 Безопасность

- JWT аутентификация (access + refresh tokens)
- Bcrypt для хеширования паролей
- Rate limiting (100 req/мин)
- Helmet для security headers
- CORS защита
- Input validation (class-validator)
- SQL Injection защита (Prisma ORM)

## 📊 API Эндпоинты

### Аутентификация
- `POST /api/v1/auth/register` - Регистрация
- `POST /api/v1/auth/login` - Вход
- `POST /api/v1/auth/refresh` - Обновление токена
- `POST /api/v1/auth/logout` - Выход

### Пользователи
- `GET /api/v1/users/me` - Текущий пользователь
- `PATCH /api/v1/users/me` - Обновить профиль

### Тесты
- `GET /api/v1/tests` - Список тестов
- `POST /api/v1/tests/:id/start` - Начать тест
- `POST /api/v1/tests/sessions/:id/answer` - Отправить ответ
- `POST /api/v1/tests/sessions/:id/complete` - Завершить тест

Полная документация: http://localhost:3001/api/docs

## 🐳 Docker

Для production используйте:
```bash
docker build -t zharqyn-backend .
docker run -p 3001:3001 zharqyn-backend
```

## 📝 Environment Variables

Все переменные окружения в `.env.example`. Основные:

- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - Secret для JWT токенов
- `REDIS_HOST` - Redis host
- `KASPI_API_KEY` - Kaspi Pay API key
- И другие...

## 🚧 TODO

- [ ] Модуль Auth (завершить)
- [ ] Модуль Tests
- [ ] Модуль Consultations
- [ ] Модуль Payments (интеграция Kaspi Pay)
- [ ] Email notifications
- [ ] SMS notifications
- [ ] PDF generation для отчетов
- [ ] Redis caching
- [ ] Background jobs (Bull)

## 📞 Поддержка

- Email: dev@zharqynbala.kz
- Документация: см. корневой README.md

---

**Версия:** 1.0.0
**Последнее обновление:** 05.12.2025
