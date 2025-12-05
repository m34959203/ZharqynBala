# 🚧 РУКОВОДСТВО ПО РАЗРАБОТКЕ

## 📋 Статус проекта

**Текущая версия:** 1.0.0 (Production-ready structure)
**Дата:** 05.12.2025
**Статус:** ✅ Базовая структура готова → Начало разработки функционала

---

## ✅ ЧТО ГОТОВО

### Backend (NestJS + Prisma + PostgreSQL)
- ✅ Структура проекта создана
- ✅ package.json с dependencies
- ✅ TypeScript конфигурация
- ✅ Prisma schema (полная схема БД)
- ✅ Main.ts с настройками (helmet, cors, compression)
- ✅ App module структура
- ✅ Prisma service
- ✅ Environment variables (.env.example)
- ✅ .gitignore

### Infrastructure
- ✅ Docker Compose для разработки (PostgreSQL + Redis + MailHog)

### Documentation
- ✅ Полная бизнес документация (9 документов)
- ✅ Backend README
- ✅ Этот файл (DEVELOPMENT.md)

---

## 🚀 БЫСТРЫЙ СТАРТ ДЛЯ РАЗРАБОТЧИКОВ

### 1. Клонирование и установка

```bash
# Клонируйте репозиторий
git clone <repo-url>
cd ZharqynBala

# Backend setup
cd backend
npm install
cp .env.example .env

# Запустите инфраструктуру
cd ../infrastructure
docker-compose -f docker-compose.dev.yml up -d

# Примените миграции
cd ../backend
npm run prisma:migrate
npm run prisma:generate

# Запустите backend
npm run start:dev
```

Backend запустится на http://localhost:3001
API Docs: http://localhost:3001/api/docs

### 2. Проверка работоспособности

```bash
# Проверьте базу данных
docker exec -it zharqyn_postgres psql -U postgres -d zharqynbala

# Prisma Studio (GUI для БД)
npm run prisma:studio
```

---

## 📝 ЧТО НУЖНО ДОДЕЛАТЬ

### 🔴 КРИТИЧЕСКИЙ ПРИОРИТЕТ (для MVP)

#### Backend Modules:

**1. Auth Module** (2-3 дня)
- [ ] DTOs (RegisterDto, LoginDto)
- [ ] AuthService (register, login, validateUser)
- [ ] JwtStrategy
- [ ] AuthController
- [ ] JwtAuthGuard
- [ ] Refresh token logic
- [ ] Password hashing (bcrypt)
- [ ] Unit tests

**2. Users Module** (1-2 дня)
- [ ] DTOs (CreateUserDto, UpdateUserDto)
- [ ] UsersService (CRUD)
- [ ] UsersController
- [ ] User profile endpoints
- [ ] Children management endpoints
- [ ] Unit tests

**3. Tests Module** (3-4 дня)
- [ ] Tests service (get tests, start session)
- [ ] Sessions service (answer questions, calculate results)
- [ ] Results service (generate report)
- [ ] Tests controller
- [ ] Question/Answer logic
- [ ] Scoring algorithm
- [ ] Unit tests

**4. Basic File Upload** (1 день)
- [ ] Multer setup
- [ ] Avatar upload
- [ ] File validation

**5. Database Seeds** (1 день)
- [ ] Seed users (тестовые аккаунты)
- [ ] Seed tests (3 теста: тревожность, мотивация, самооценка)
- [ ] Seed questions и answers

---

### 🟡 ВЫСОКИЙ ПРИОРИТЕТ (для запуска)

**6. Consultations Module** (2-3 дня)
- [ ] Consultations service
- [ ] Booking logic
- [ ] Calendar/availability logic
- [ ] Controller
- [ ] Unit tests

**7. Payments Module - Kaspi Pay** (2-3 дня)
- [ ] Kaspi Pay integration
- [ ] Payment creation
- [ ] Webhook handler
- [ ] Payment verification
- [ ] Unit tests

**8. Email Notifications** (1-2 дня)
- [ ] SendGrid integration
- [ ] Email templates
- [ ] Welcome email
- [ ] Test results email
- [ ] Booking confirmation email

**9. PDF Generation** (2 дня)
- [ ] Puppeteer setup
- [ ] Report template
- [ ] Generate PDF service
- [ ] Upload to S3 / local storage

---

### 🟢 СРЕДНИЙ ПРИОРИТЕТ (после MVP)

**10. Redis Caching** (1-2 дня)
- [ ] Redis module
- [ ] Cache decorator
- [ ] Cache tests list
- [ ] Cache user profiles

**11. Background Jobs** (2 дня)
- [ ] Bull queue setup
- [ ] PDF generation job
- [ ] Email sending job
- [ ] Job monitoring

**12. Admin Module** (3-4 дня)
- [ ] Admin guard
- [ ] User management endpoints
- [ ] Test management endpoints
- [ ] Statistics endpoints

**13. Schools Module** (3-4 дня)
- [ ] School profile management
- [ ] Class management
- [ ] Student import (Excel)
- [ ] Group tests assignment
- [ ] Reports generation

---

### Frontend (Next.js) - ОТЛОЖЕНО

Frontend структура будет создана после завершения Backend MVP.

**План:**
1. Next.js 14 setup (App Router)
2. Tailwind CSS + shadcn/ui
3. Authentication pages
4. Dashboard
5. Test interface
6. Booking interface

**Срок:** После Backend MVP (3-4 недели)

---

## 🏗️ АРХИТЕКТУРНЫЕ РЕШЕНИЯ

### Backend Structure

```
src/
├── modules/                    # Функциональные модули
│   ├── auth/
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   ├── auth.module.ts
│   │   ├── dto/
│   │   ├── guards/
│   │   └── strategies/
│   │
│   ├── users/
│   ├── tests/
│   ├── consultations/
│   └── payments/
│
├── common/                     # Общие компоненты
│   ├── decorators/
│   │   └── current-user.decorator.ts
│   ├── guards/
│   │   └── jwt-auth.guard.ts
│   ├── interceptors/
│   │   └── transform.interceptor.ts
│   ├── pipes/
│   │   └── validation.pipe.ts
│   └── prisma/
│       ├── prisma.module.ts
│       └── prisma.service.ts
│
└── config/                     # Конфигурация
    ├── database.config.ts
    └── jwt.config.ts
```

### Naming Conventions

- **Files:** kebab-case (auth.service.ts)
- **Classes:** PascalCase (AuthService)
- **Functions:** camelCase (validateUser)
- **Constants:** UPPER_SNAKE_CASE (JWT_SECRET)
- **Interfaces:** PascalCase with I prefix (IUser) - опционально

### Git Workflow

```
main                 # production
  └── develop        # development
       ├── feature/auth
       ├── feature/tests
       └── bugfix/login-error
```

**Commit Convention:**
```
feat: добавить модуль аутентификации
fix: исправить ошибку валидации email
docs: обновить README
refactor: рефакторинг tests service
test: добавить тесты для auth
```

---

## 🧪 ТЕСТИРОВАНИЕ

### Unit Tests

```typescript
// Пример unit test
describe('AuthService', () => {
  let service: AuthService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [AuthService, PrismaService],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should hash password correctly', async () => {
    const password = 'test123';
    const hashed = await service.hashPassword(password);
    expect(hashed).not.toBe(password);
  });
});
```

**Цель:** Coverage > 70%

### E2E Tests

```typescript
// Пример E2E test
describe('Auth (e2e)', () => {
  it('/auth/register (POST)', () => {
    return request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: 'test@example.com',
        password: 'password123',
        firstName: 'Test',
        lastName: 'User',
      })
      .expect(201);
  });
});
```

---

## 📊 DATABASE DEVELOPMENT

### Создание миграции

```bash
# После изменения schema.prisma
npm run prisma:migrate
# Введите название миграции: "add_user_avatar_field"
```

### Prisma Studio

```bash
npm run prisma:studio
# Откроется GUI на http://localhost:5555
```

### Seed данные

```typescript
// prisma/seed.ts
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  // Создать админа
  const admin = await prisma.user.create({
    data: {
      email: 'admin@zharqynbala.kz',
      passwordHash: await bcrypt.hash('admin123', 12),
      firstName: 'Admin',
      lastName: 'User',
      role: 'ADMIN',
      isVerified: true,
    },
  });

  // Создать тест
  const test = await prisma.test.create({
    data: {
      titleRu: 'Тест на тревожность',
      titleKz: 'Үрейлілік тесті',
      // ...
    },
  });

  console.log({ admin, test });
}

main();
```

---

## 🔧 ПОЛЕЗНЫЕ КОМАНДЫ

### Docker

```bash
# Запустить инфраструктуру
docker-compose -f infrastructure/docker-compose.dev.yml up -d

# Остановить
docker-compose -f infrastructure/docker-compose.dev.yml down

# Логи PostgreSQL
docker logs zharqyn_postgres

# Войти в PostgreSQL
docker exec -it zharqyn_postgres psql -U postgres -d zharqynbala

# Очистить volumes (удалит все данные!)
docker-compose -f infrastructure/docker-compose.dev.yml down -v
```

### Database

```bash
# Подключиться к БД
psql postgresql://postgres:postgres@localhost:5432/zharqynbala

# SQL запросы
SELECT * FROM users;
SELECT * FROM tests;
```

### Development

```bash
# Запуск с hot-reload
npm run start:dev

# Запуск с debugger (VSCode)
npm run start:debug

# Запуск тестов с watch
npm run test:watch

# Generate Prisma client
npm run prisma:generate
```

---

## 🐛 TROUBLESHOOTING

### Проблема: Cannot connect to database
**Решение:**
```bash
# Проверьте Docker контейнеры
docker ps

# Перезапустите PostgreSQL
docker-compose -f infrastructure/docker-compose.dev.yml restart postgres

# Проверьте DATABASE_URL в .env
```

### Проблема: Prisma Client не найден
**Решение:**
```bash
npm run prisma:generate
```

### Проблема: Port 3001 already in use
**Решение:**
```bash
# Найдите процесс
lsof -i :3001

# Убейте процесс
kill -9 <PID>
```

---

## 📞 КОНТАКТЫ КОМАНДЫ

- **Tech Lead:** [имя]
- **Backend Lead:** [имя]
- **Frontend Lead:** [имя]
- **DevOps:** [имя]

**Коммуникация:**
- Slack/Telegram: [канал]
- Email: dev@zharqynbala.kz
- Daily Standup: 10:00 (онлайн)

---

## 📈 ROADMAP

### Неделя 1-2: Core Backend
- Auth module
- Users module
- Database seeds

### Неделя 3-4: Tests Module
- Tests logic
- Sessions
- Results generation

### Неделя 5-6: Payments & Consultations
- Kaspi Pay integration
- Consultations booking

### Неделя 7-8: Testing & Polish
- Unit tests
- E2E tests
- Bug fixes

### Неделя 9-12: Frontend MVP
- Next.js setup
- Auth pages
- Dashboard
- Test interface

---

## ✅ CHECKLIST ДЛЯ РАЗРАБОТЧИКА

### Перед началом работы:
- [ ] Изучил всю документацию (PLAN_RAZVITIYA.md, ARCHITECTURE.md)
- [ ] Установил все зависимости
- [ ] Запустил Docker контейнеры
- [ ] Backend запускается без ошибок
- [ ] Prisma Studio работает
- [ ] API Docs доступны

### Перед коммитом:
- [ ] Код прошел линтинг (`npm run lint`)
- [ ] Форматирование (`npm run format`)
- [ ] Тесты проходят (`npm run test`)
- [ ] Нет console.log (кроме необходимых)
- [ ] Commit message по convention

### Перед Pull Request:
- [ ] Код ревью сделан
- [ ] Конфликтов нет
- [ ] CI/CD проходит
- [ ] Описание PR детальное
- [ ] Screenshot/video при необходимости

---

**Начинайте с Auth Module - это основа всего!**

**Удачи в разработке!** 🚀

**Последнее обновление:** 05.12.2025
