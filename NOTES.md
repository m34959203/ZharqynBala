# ZharqynBala — server deploy session 2026-05-11

## Target
Развернуть на server.zhezu.kz с публичной ссылкой (раньше был Railway, сейчас 404).

## Топология

| Компонент | Порт | Публичный URL |
|---|---|---|
| Backend (NestJS) | localhost:3500 | https://fifteen-occasional-cathedral-edmonton.trycloudflare.com |
| Frontend (Next.js) | localhost:3400 | https://indication-tale-mercury-salad.trycloudflare.com |
| Postgres | localhost:5433 (docker `zharqyn_postgres`) | — |
| Redis | localhost:6380 (docker `zharqyn_redis`) | — |
| MailHog | localhost:8025 (docker `zharqyn_mailhog`) | — |

## Текущий статус (по ходу деплоя)

- [x] Клон в `/home/ubuntu/ZharqynBala` (был уже)
- [x] Docker postgres/redis/mailhog уже подняты с прошлого раза
- [x] 2 cloudflared трycloudflare-туннеля стартанули (pids 2191526 backend, 2191527 frontend)
- [x] backend/.env обновлён: NODE_ENV=production, FRONTEND_URL/BACKEND_URL/CORS на туннели
- [x] frontend/.env.local обновлён: NEXT_PUBLIC_API_URL=backend tunnel, NEXTAUTH_URL=frontend tunnel, новый NEXTAUTH_SECRET
- [x] Prisma migrate deploy — все 18 миграций уже применены, БД актуальна
- [x] Backend rebuild (`nest build`) + старт `node dist/main` pid 2193725, /health = 200 локально и через туннель
- [x] Frontend rebuild (`next build`) — успешно
- [x] Frontend старт `next start` pid 2195474
- [x] Smoke: фронт отдаёт title=«ZharqynBala», CORS OPTIONS 204, NextAuth прицепился к backend tunnel
- [x] Опубликован

## Запущенные процессы

| PID | Команда |
|---|---|
| 2191526 | `cloudflared tunnel --url http://localhost:3500` (backend tunnel) |
| 2191527 | `cloudflared tunnel --url http://localhost:3400` (frontend tunnel) |
| 2193725 | `node dist/main` (NestJS backend) |
| 2195474 | `npm run start` (Next.js frontend) |

Остановить всё: `kill 2191526 2191527 2193725 2195474`

## Публичные ссылки
- Сайт: https://indication-tale-mercury-salad.trycloudflare.com
- API: https://fifteen-occasional-cathedral-edmonton.trycloudflare.com/api
- Swagger: https://fifteen-occasional-cathedral-edmonton.trycloudflare.com/api/docs

## Gotchas
- 5 файлов с несохранёнными правками в рабочей копии (frontend/next.config.ts, backend monitoring/export/group-tests/dto) — оставляю как есть.
- CI на GitHub сломан с 2026-04-03, но это не блокирует ручной деплой.

## 2026-05-12 — Admin dashboard redesign (Claude Design handoff)

Реализовал `admin.html` из дизайн-бандла Claude Design (zharqynbala/, README + chat1.md прочитаны).

**Что сделано:**
- `frontend/app/(protected)/dashboard/components/AdminDashboard.tsx` — полный rewrite. Шапка command-center (#0E0E14) с бейджем «Админ», статусом «12 сервисов онлайн», быстрыми действиями (Экспорт репорта / Пригласить психолога). 6 стат-карточек: Пользователи, Дети, Психологи (одобрено), Тесты пройдено, **Выручка май** (фиолетовый featured-градиент), Конверсия. 2-колоночный блок: слева — модерация психологов + барчарт выручки с табами Неделя/Месяц/Год + топ-5 тестов; справа — последние платежи Kaspi, системные уведомления, регионы Казахстана с прогресс-барами. Внизу — светофор операционных рисков (красная/жёлтая/зелёная карточки SLA). Тёмная footer-полоса с сертификатами ISO 27001 / ЗРК ПДн / Данные в РК. AI-ассистент FAB.
- `frontend/app/layout.tsx` — добавлен `<link>` на Inter + Manrope из Google Fonts (используется во всех скоупах, не только admin).
- Цвета/градиенты из дизайна изолированы в `style jsx global` под `.admin-shell` — не текут в остальные роли.

**Wiring:**
- 6 стат-карточек подхватывают `adminApi.getDashboardStats()` (поля totalUsers, totalChildren, totalTests, totalRevenue, approvedPsychologists, consultationConversion) с fallback на mock-цифры из дизайна.
- Очередь модерации, топ-тестов, платежи Kaspi, sys-notes, регионы, риски — пока mock (бэкенд эти срезы не отдаёт). Это бэклог.

**Visual integration:**
- Дизайн предполагает свою тёмную AdminBar с навигацией. Сейчас (protected)/layout рендерит белую пилюль-навигацию сверху для всех ролей — оставил её, чтобы не ломать 8 admin-подстраниц (users/psychologists/tests/payments/analytics/settings/bullying/cases). Тёмная command-center шапка идёт как первый блок контента, визуально отличает админ от parent/psy.

**Что не сделал (бэклог):**
- Реальные API под moderation queue / popular tests / Kaspi feed / regional stats / SLA traffic light.
- Полностью тёмный shell с админ-навигацией (требует refactor protected layout под role-aware chrome).
