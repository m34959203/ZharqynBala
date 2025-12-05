# 🚀 QUICK START GUIDE - ZHARQYN BALA

## 📋 ПРЕДВАРИТЕЛЬНЫЕ ТРЕБОВАНИЯ

Перед началом разработки убедитесь, что у вас установлено:

### Обязательное ПО:
- **Node.js:** >= 18.x LTS ([скачать](https://nodejs.org/))
- **npm:** >= 9.x (идет с Node.js)
- **Git:** >= 2.x ([скачать](https://git-scm.com/))
- **Docker:** >= 20.x ([скачать](https://www.docker.com/))
- **Docker Compose:** >= 2.x (идет с Docker Desktop)

### Рекомендуемое ПО:
- **VS Code:** с расширениями ESLint, Prettier, TypeScript
- **PostgreSQL Client:** pgAdmin / DBeaver
- **API Client:** Postman / Insomnia

### Проверка установки:
```bash
node --version    # должно быть v18.x или выше
npm --version     # должно быть 9.x или выше
git --version     # должно быть 2.x или выше
docker --version  # должно быть 20.x или выше
```

---

## 📁 СТРУКТУРА РЕПОЗИТОРИЕВ

Рекомендуемая организация:

```
zharqyn-bala/
├── backend/           # NestJS Backend API
├── frontend/          # Next.js Frontend
├── docs/              # Документация
├── infrastructure/    # Docker, CI/CD, конфиги
└── README.md
```

---

## 🏗️ ШАБЛОНЫ ПРОЕКТОВ

### Backend (NestJS)

#### 1. Создание проекта:
```bash
# Установка Nest CLI
npm i -g @nestjs/cli

# Создание проекта
nest new backend --package-manager npm

cd backend
```

#### 2. Установка зависимостей:
```bash
# Core dependencies
npm install @nestjs/config @nestjs/typeorm typeorm pg
npm install @nestjs/jwt @nestjs/passport passport passport-jwt
npm install bcrypt class-validator class-transformer

# Additional
npm install @nestjs/swagger
npm install bull @nestjs/bull
npm install redis

# Dev dependencies
npm install -D @types/bcrypt @types/passport-jwt
npm install -D prettier eslint
```

#### 3. Структура папок Backend:
```
backend/
├── src/
│   ├── modules/
│   │   ├── auth/
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.service.ts
│   │   │   ├── auth.module.ts
│   │   │   ├── dto/
│   │   │   │   ├── register.dto.ts
│   │   │   │   └── login.dto.ts
│   │   │   ├── guards/
│   │   │   │   └── jwt-auth.guard.ts
│   │   │   └── strategies/
│   │   │       └── jwt.strategy.ts
│   │   │
│   │   ├── users/
│   │   │   ├── users.controller.ts
│   │   │   ├── users.service.ts
│   │   │   ├── users.module.ts
│   │   │   ├── entities/
│   │   │   │   └── user.entity.ts
│   │   │   └── dto/
│   │   │       └── update-user.dto.ts
│   │   │
│   │   ├── tests/
│   │   ├── results/
│   │   ├── consultations/
│   │   ├── payments/
│   │   ├── schools/
│   │   └── admin/
│   │
│   ├── common/
│   │   ├── decorators/
│   │   ├── filters/
│   │   ├── guards/
│   │   ├── interceptors/
│   │   └── pipes/
│   │
│   ├── config/
│   │   ├── database.config.ts
│   │   ├── jwt.config.ts
│   │   └── app.config.ts
│   │
│   ├── database/
│   │   └── migrations/
│   │
│   ├── app.module.ts
│   └── main.ts
│
├── test/
├── .env.example
├── .eslintrc.js
├── .prettierrc
├── nest-cli.json
├── package.json
├── tsconfig.json
└── README.md
```

#### 4. Пример .env для Backend:
```env
# Application
NODE_ENV=development
PORT=3001
API_PREFIX=api

# Database
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=postgres
DATABASE_PASSWORD=postgres
DATABASE_NAME=zharqynbala

# JWT
JWT_SECRET=your-super-secret-key-change-in-production
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=your-refresh-secret-key
JWT_REFRESH_EXPIRES_IN=7d

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# File Storage
S3_BUCKET=zharqynbala-files
S3_REGION=ru-central1
S3_ACCESS_KEY=your-access-key
S3_SECRET_KEY=your-secret-key

# Payments
KASPI_MERCHANT_ID=your-merchant-id
KASPI_API_KEY=your-api-key
PAYBOX_MERCHANT_ID=your-merchant-id
PAYBOX_SECRET_KEY=your-secret-key

# Notifications
SENDGRID_API_KEY=your-sendgrid-key
TWILIO_ACCOUNT_SID=your-twilio-sid
TWILIO_AUTH_TOKEN=your-twilio-token
TWILIO_PHONE_NUMBER=+1234567890

# Video
AGORA_APP_ID=your-agora-app-id
AGORA_APP_CERTIFICATE=your-agora-certificate

# Monitoring
SENTRY_DSN=your-sentry-dsn
```

#### 5. Docker Compose для локальной разработки:
```yaml
# docker-compose.dev.yml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    container_name: zharqyn_postgres
    ports:
      - "5432:5432"
    environment:
      POSTGRES_DB: zharqynbala
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    container_name: zharqyn_redis
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

  mailhog:
    image: mailhog/mailhog
    container_name: zharqyn_mailhog
    ports:
      - "1025:1025"  # SMTP
      - "8025:8025"  # Web UI

volumes:
  postgres_data:
  redis_data:
```

**Запуск:**
```bash
docker-compose -f docker-compose.dev.yml up -d
```

---

### Frontend (Next.js)

#### 1. Создание проекта:
```bash
npx create-next-app@latest frontend --typescript --tailwind --app --eslint

cd frontend
```

#### 2. Установка зависимостей:
```bash
# UI Components
npx shadcn-ui@latest init
npx shadcn-ui@latest add button
npx shadcn-ui@latest add form
npx shadcn-ui@latest add input
npx shadcn-ui@latest add card
npx shadcn-ui@latest add dialog
npx shadcn-ui@latest add dropdown-menu
npx shadcn-ui@latest add toast

# State Management
npm install zustand

# Data Fetching
npm install @tanstack/react-query axios

# Forms
npm install react-hook-form zod @hookform/resolvers

# i18n
npm install next-i18next react-i18next

# Charts
npm install recharts

# Video
npm install agora-rtc-sdk-ng

# Utils
npm install date-fns clsx
```

#### 3. Структура папок Frontend:
```
frontend/
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── login/
│   │   │   │   └── page.tsx
│   │   │   └── register/
│   │   │       └── page.tsx
│   │   │
│   │   ├── (dashboard)/
│   │   │   ├── dashboard/
│   │   │   │   └── page.tsx
│   │   │   ├── tests/
│   │   │   │   ├── page.tsx
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx
│   │   │   ├── consultations/
│   │   │   └── profile/
│   │   │
│   │   ├── api/          # API routes (если нужны)
│   │   ├── layout.tsx
│   │   ├── page.tsx      # Landing page
│   │   └── globals.css
│   │
│   ├── components/
│   │   ├── ui/           # shadcn components
│   │   ├── layout/
│   │   │   ├── Header.tsx
│   │   │   ├── Footer.tsx
│   │   │   └── Sidebar.tsx
│   │   ├── auth/
│   │   │   ├── LoginForm.tsx
│   │   │   └── RegisterForm.tsx
│   │   ├── tests/
│   │   │   ├── TestCard.tsx
│   │   │   ├── TestQuestion.tsx
│   │   │   └── TestResults.tsx
│   │   └── common/
│   │       ├── Button.tsx
│   │       └── Card.tsx
│   │
│   ├── lib/
│   │   ├── api/
│   │   │   ├── client.ts
│   │   │   ├── auth.ts
│   │   │   ├── tests.ts
│   │   │   └── users.ts
│   │   ├── store/
│   │   │   ├── authStore.ts
│   │   │   └── testStore.ts
│   │   └── utils/
│   │       ├── cn.ts
│   │       └── formatters.ts
│   │
│   ├── types/
│   │   ├── user.ts
│   │   ├── test.ts
│   │   └── api.ts
│   │
│   └── hooks/
│       ├── useAuth.ts
│       ├── useTests.ts
│       └── useConsultations.ts
│
├── public/
│   ├── images/
│   ├── icons/
│   └── locales/
│       ├── ru/
│       │   └── common.json
│       └── kz/
│           └── common.json
│
├── .env.local
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

#### 4. Пример .env.local для Frontend:
```env
# API
NEXT_PUBLIC_API_URL=http://localhost:3001/api

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=Zharqyn Bala

# Analytics
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
NEXT_PUBLIC_YM_ID=12345678

# Feature Flags
NEXT_PUBLIC_ENABLE_VIDEO=true
NEXT_PUBLIC_ENABLE_COURSES=false
```

#### 5. API Client пример:
```typescript
// src/lib/api/client.ts
import axios from 'axios';

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor для добавления токена
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor для обработки ошибок
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        const { data } = await axios.post(
          `${process.env.NEXT_PUBLIC_API_URL}/auth/refresh`,
          { refreshToken }
        );

        localStorage.setItem('accessToken', data.accessToken);
        originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;

        return apiClient(originalRequest);
      } catch (refreshError) {
        localStorage.clear();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
```

---

## 🔧 ЛОКАЛЬНАЯ РАЗРАБОТКА

### Шаг 1: Клонирование репозитория
```bash
git clone https://github.com/your-org/zharqyn-bala.git
cd zharqyn-bala
```

### Шаг 2: Запуск инфраструктуры
```bash
# Запустить PostgreSQL и Redis
docker-compose -f infrastructure/docker-compose.dev.yml up -d

# Проверить что контейнеры запущены
docker ps
```

### Шаг 3: Backend setup
```bash
cd backend

# Установить зависимости
npm install

# Скопировать .env
cp .env.example .env
# Отредактировать .env с вашими настройками

# Запустить миграции
npm run migration:run

# Запустить seeds (опционально)
npm run seed

# Запустить в dev режиме
npm run start:dev

# Backend доступен на http://localhost:3001
```

### Шаг 4: Frontend setup
```bash
cd frontend

# Установить зависимости
npm install

# Скопировать .env
cp .env.example .env.local
# Отредактировать .env.local

# Запустить в dev режиме
npm run dev

# Frontend доступен на http://localhost:3000
```

---

## 🧪 ТЕСТИРОВАНИЕ

### Backend tests:
```bash
cd backend

# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov
```

### Frontend tests:
```bash
cd frontend

# Unit tests (если настроено Jest)
npm run test

# E2E tests (если настроено Playwright)
npm run test:e2e
```

---

## 📝 ПОЛЕЗНЫЕ КОМАНДЫ

### Git:
```bash
# Создать новую ветку
git checkout -b feature/user-auth

# Коммит с conventional commits
git commit -m "feat: add user authentication"

# Пуш в remote
git push origin feature/user-auth
```

### Docker:
```bash
# Посмотреть логи
docker logs zharqyn_postgres

# Войти в контейнер
docker exec -it zharqyn_postgres psql -U postgres -d zharqynbala

# Остановить все
docker-compose -f docker-compose.dev.yml down

# Очистить volumes (удалит данные!)
docker-compose -f docker-compose.dev.yml down -v
```

### Database:
```bash
# Создать миграцию
npm run migration:create --name=CreateUsersTable

# Запустить миграции
npm run migration:run

# Откатить последнюю миграцию
npm run migration:revert
```

---

## 🐛 TROUBLESHOOTING

### Проблема: "Port 5432 already in use"
**Решение:** У вас уже запущен PostgreSQL. Либо остановите его, либо измените порт в docker-compose.yml

### Проблема: "Cannot connect to database"
**Решение:**
1. Проверьте что Docker контейнеры запущены: `docker ps`
2. Проверьте .env файл
3. Проверьте логи: `docker logs zharqyn_postgres`

### Проблема: "Module not found"
**Решение:**
```bash
# Удалить node_modules и переустановить
rm -rf node_modules package-lock.json
npm install
```

---

## 📚 ДОПОЛНИТЕЛЬНЫЕ РЕСУРСЫ

### Документация:
- [NestJS Docs](https://docs.nestjs.com/)
- [Next.js Docs](https://nextjs.org/docs)
- [TypeScript Docs](https://www.typescriptlang.org/docs/)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [shadcn/ui Docs](https://ui.shadcn.com/)

### Туториалы:
- [NestJS + PostgreSQL Tutorial](https://www.youtube.com/watch?v=...)
- [Next.js 14 App Router Tutorial](https://www.youtube.com/watch?v=...)
- [JWT Authentication in NestJS](https://www.youtube.com/watch?v=...)

---

## 🤝 CONTRIBUTING

Перед началом работы:
1. Прочитайте `CONTRIBUTING.md`
2. Создайте issue для новой фичи
3. Получите одобрение от мейнтейнера
4. Создайте feature branch
5. Делайте небольшие, атомарные коммиты
6. Пишите тесты
7. Создайте Pull Request

---

## 📞 ПОДДЕРЖКА

Если возникли вопросы:
- 📧 Email: dev@zharqynbala.kz
- 💬 Telegram: @zharqynbala_dev
- 📖 Wiki: [link to wiki]

---

**Готовы начать?** Следуйте инструкциям выше и начните с Backend setup!

**Последнее обновление:** 05.12.2025
