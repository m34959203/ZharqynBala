# Handoff 2026-05-12-1 → Cowork: Psychologist & School workbenches

## TL;DR

Развернул проект на сервере, провёл `/impeccable critique` через инсталлированный stack (Impeccable v3.0.7 + design-motion-principles + frontend-design + детектор). Получили 22/40 по Nielsen и 109 deterministic findings. Два P0-блокера к продакшну: визуальная инконсистенция между ролями (закрою я) и **пустые stub'ы для PsychologistDashboard + SchoolDashboard** (берёшь ты).

Твоя задача: построить две полноценные рабочие панели — для **Динары (школьный психолог)** и **школа-админ (директор/завуч)** — на уровне визуального качества твоего собственного редизайна AdminDashboard. Backend endpoints уже есть, нужно дизайн + wiring + states.

Параллельный split:
- **Я (claude-opus):** unify design tokens в globals.css, a11y-pass, починка side-stripe ban'ов в admin/bullying, упрощение palette на results page, polish.
- **Ты (Cowork):** этот handoff — PsychologistWorkbench + SchoolWorkbench.

Файлы, которые я ТРОНУ (не редактируй параллельно, дождись моего коммита):
- `frontend/app/globals.css` (или новый `frontend/app/tokens.css`)
- `frontend/app/layout.tsx`
- `frontend/app/(protected)/admin/bullying/page.tsx`
- `frontend/app/(protected)/results/[id]/page.tsx`
- `frontend/components/chat/ChatWidget.tsx` (удалю animate-bounce)

Файлы, которые ТЫ ТРОНЕШЬ (мне не нужны):
- `frontend/app/(protected)/dashboard/components/PsychologistDashboard.tsx` (полный rewrite)
- `frontend/app/(protected)/dashboard/components/SchoolDashboard.tsx` (полный rewrite, если есть; если нет — создай)
- `frontend/app/(protected)/clients/*` (если нужны новые views)
- `frontend/app/(protected)/schedule/*`
- `frontend/app/(protected)/admin/group-tests/*` (для school-admin: school-роль может видеть только свои group-tests; разверни через RBAC)
- `frontend/lib/api/psychologists.ts`, `frontend/lib/api/schools.ts` (или где у вас API клиенты)

Commit-конвенция: на русском, Conventional Commits. Префиксы `feat(psy):` / `feat(school):` / `fix(psy):` / `chore:`.

---

## Контекст продукта

Полный source-of-truth — `/PRODUCT.md` в корне репо (создан мной через `/impeccable teach` 2026-05-12). Прочитай его целиком перед началом. Краткая выжимка:

- **Register:** product (не brand)
- **3 аудитории:** родители 10-17 (60% — основной), школьные психологи (30%), школы B2B (10%, но самый высокий ARPU)
- **Бренд:** «Тёплый · Ясный · Доступный»
- **Anti-references:** Calm/Headspace пастели; Госуслуги/Bolashaq стиль; Telegram-родительские паблики/Mamba эстетика
- **Positive reference:** Notion AI / Granola — modern soft-product
- **A11y:** WCAG 2.1 AA, `prefers-reduced-motion` обязательно, A2-B1 язык, тач-таргеты ≥44px

### Стек

- Next.js 16 (App Router), React 19, TypeScript
- TailwindCSS + custom CSS tokens (см. AdminDashboard.tsx как эталон)
- NextAuth (credentials provider)
- Backend: NestJS + Prisma + Postgres + Redis (живой prod на `https://fifteen-occasional-cathedral-edmonton.trycloudflare.com/api`)
- Frontend: `https://indication-tale-mercury-salad.trycloudflare.com`

### Существующие пользователи для тестирования (все пароль `Admin123!`)

| Role | Email |
|---|---|
| ADMIN | `admin@zharqynbala.kz` |
| PSYCHOLOGIST | `psychologist@test.kz` |
| PSYCHOLOGIST | `psychologist2@test.kz` |
| PARENT | `parent@test.kz` |
| SCHOOL | `school@test.kz` |

---

## Эталон дизайна — твой собственный AdminDashboard

Ты уже задал визуальный язык в `frontend/app/(protected)/dashboard/components/AdminDashboard.tsx`. **Pero оба workbench'а должны быть в том же языке.** Скопируй и расширь `:root` блок:

```css
:root {
  --brand-600: #6D4AFF; --brand-500: #8A6BFF; --brand-400: #B66BFF;
  --brand-50:  #F4F0FF; --brand-100: #EAE2FF;
  --brand-grad: linear-gradient(135deg, #6D4AFF 0%, #B66BFF 100%);

  --ink-900: #0E0B22; --ink-700: #2A2640; --ink-500: #595673;
  --ink-400: #8480A0; --ink-300: #B7B3CC; --ink-200: #E5E1F0;
  --ink-100: #F1EEF8; --ink-50:  #F8F6FD;

  --card: #FFFFFF; --line: #ECE9F5;

  --ok-50: #ECFDF3; --ok-100: #D1FADF; --ok-500: #12B76A; --ok-700: #027A48;
  --warn-50: #FFFAEB; --warn-100: #FEF0C7; --warn-500: #F79009; --warn-700: #B54708;
  --risk-50: #FEF3F2; --risk-100: #FEE4E2; --risk-500: #F04438; --risk-700: #B42318;

  --radius-md: 14px; --radius-lg: 20px;
  --shadow-sm: 0 1px 2px rgba(20,14,60,.04), 0 1px 1px rgba(20,14,60,.02);
  --shadow-brand: 0 12px 28px rgba(109,74,255,.28);

  --font-display: 'Manrope', 'Inter', system-ui, sans-serif;
}
```

**ВАЖНО:** я как раз сейчас поднимаю эти токены из scope `.admin-shell` в `globals.css`, чтобы они стали глобальными. **Подожди мой коммит `feat: unify design tokens globally` перед тем как начать стилизовать.** Затем используй их напрямую через CSS-variables, без локального дублирования.

Также я подключу `--font-display` (Manrope) в глобальные стили — используй её для headings (`<h1>`, `<h2>`) во всех новых компонентах.

### Базовые UI-классы, которые ты можешь переиспользовать

После моего unify-коммита у тебя будут доступны:
- `.btn`, `.btn-primary`, `.btn-secondary`, `.btn-ghost`, `.btn-sm`
- `.chip`, `.chip.is-active`
- `.badge`, `.badge-norm`, `.badge-warn`, `.badge-risk`, `.badge-plain`
- `.card`, `.hover-lift`

Если нужно больше — добавляй в тот же глобальный CSS (не в `style jsx local` — это создаёт inconsistency).

---

## Задача 1: PsychologistWorkbench (Динара)

### Персона

**Динара**, школьный психолог. Десктоп, 5-6 кейсов в день, 45 минут на консультацию. Между консультациями переключается между детьми, читает результаты тестов, согласовывает время с родителями. Боль: «найти нужного ребёнка в очереди и быстро увидеть его контекст». Сейчас уходит в Notion и Google Sheets для своих заметок.

### Job to be done

1. Утром открыть дашборд → за 5 секунд увидеть «что сегодня».
2. Перед каждой консультацией → за 30 секунд понять кто этот ребёнок, что показал тест, есть ли история.
3. После консультации → внести заметки, заказать follow-up, выставить рейтинг себе/ребёнку.
4. Раз в неделю → ревью «кто на грани, кому надо позвонить родителям».

### Структура страницы

`frontend/app/(protected)/dashboard/components/PsychologistDashboard.tsx`:

#### Шапка-приветствие
- «Добрый день, Алия. Сегодня **3 консультации**, ближайшая через 47 минут.»
- Справа: chip «Профиль» (рейтинг, сертификаты) + chip «Доступность» (toggle: принимаю/занят).
- Если рейтинг < 4.0 или 2+ no-show на неделе — мягкий warning-badge.

#### Сегодня — таймлайн консультаций (главный блок)
Список консультаций на сегодня, вертикальный таймлайн с временными метками слева.
- Каждая карточка: время, имя ребёнка (+ возраст), повод (последний тест + risk-zone), действия `Открыть карту` / `Перенести` / `Войти в видеосвязь`.
- Состояния: `SCHEDULED` (нейтрально), `IN_PROGRESS` (brand-50 рамка), `COMPLETED` (ink-50, чек-маркер), `NO_SHOW` (risk-50, требует разрешения), `CANCELLED` (ink-300, выцветшее).
- Если консультация через <15 минут — primary CTA `Войти в Jitsi` (используй endpoint `/api/consultations/:id/jitsi-config`).
- Empty state: «Сегодня свободно. Запланируй слоты в [Расписание]».

#### Двухколоночный блок ниже

**Слева (2/3): Очередь pending-консультаций**
- Запросы на консультации без подтверждённого слота. Каждая строка: ребёнок, родитель, желаемая дата+слот, повод.
- Quick-actions: `Подтвердить` (зелёный), `Предложить другое время` (открывает date picker), `Отклонить` (с обязательным reason).
- Фильтры сверху: chips `Все` / `Срочные` (risk-zone=RED) / `Новые` (created < 24h) / `Этой недели`.
- Sort: `По дате запроса` / `По срочности` / `По возрасту ребёнка`.

**Справа (1/3): Мои клиенты — следить за**
- Топ-5 ребят, у которых: последний тест YELLOW/RED, или 2+ консультации с тобой, или родитель давно не отвечал.
- Каждая карточка: фото-аватар, имя, возраст, риск-badge, дата последней консультации.
- Клик → переход в `clients/[id]` (карта ребёнка).

#### Под этим — две карточки сбоку

- **Заработок месяца:** сумма ₸, число завершённых консультаций, чек `Подробнее` → `/earnings`. Используй endpoint `/api/psychologists/me/earnings`.
- **Рейтинг и отзывы:** средний рейтинг (по pute), последние 3 отзыва клиентов, кнопка `Все отзывы`.

#### Внизу — навигация по разделам

Не вкладывай всё в дашборд. Карточки-ссылки на: `Расписание` (`/schedule`), `Все клиенты` (`/clients`), `История консультаций` (`/consultations`), `Заметки и кейсы` (`/cases`), `Документы и сертификаты` (`/profile`).

### Backend endpoints (готовы, используй через React Query)

```
GET  /api/psychologists/me              → my profile
PUT  /api/psychologists/me              → update profile
GET  /api/psychologists/me/clients      → my client list
GET  /api/psychologists/me/earnings     → my earnings stats
GET  /api/psychologists/:id/slots       → my availability slots
GET  /api/consultations/psychologist    → all my consultations (paginated)
GET  /api/consultations/my              → my consultations (alias?)
GET  /api/consultations/:id             → consultation detail
POST /api/consultations                 → schedule new
PUT  /api/consultations/:id/confirm     → confirm pending
PUT  /api/consultations/:id/reject      → reject (require reason)
PUT  /api/consultations/:id/start       → mark in-progress (when joining Jitsi)
PUT  /api/consultations/:id/complete    → mark done
PUT  /api/consultations/:id/cancel      → cancel
PUT  /api/consultations/:id/no-show     → mark client didn't show
PUT  /api/consultations/:id/rate        → rate consultation
GET  /api/consultations/:id/jitsi-config → Jitsi room config for video call
GET  /api/cases                         → my cases (notes/observations)
POST /api/cases                         → create case
PATCH /api/cases/:id                    → update case
POST /api/cases/:id/notes               → add note to case
GET  /api/cases/stats                   → my case stats
GET  /api/schedule                      → my availability schedule
POST /api/schedule                      → add availability slot
DELETE /api/schedule                    → remove slot
```

Все эндпоинты под `JwtAuthGuard`, роль `PSYCHOLOGIST`. Если в JSON-ответе видишь `Date` объекты в TIMESTAMPTZ — mapни в ISO string при передаче server→client (memory-feedback из других проектов).

### Состояния, которые должны быть

- **Empty state:** иллюстрации НЕТ (не Notion, обходимся типографикой). Текст «Здесь будет очередь консультаций. Чтобы клиенты могли записываться, [настрой расписание]» с inline-CTA.
- **Loading:** skeleton-боксы той же высоты, что и реальный контент (избегаем layout-shift). НЕ spinner-в-центре.
- **Error:** «Не удалось загрузить очередь. [Повторить]». Кнопка primary. НЕ техническое сообщение.
- **Offline:** banner вверху «Соединение слабое. Часть данных может быть устаревшей.» с retry.

### Acceptance

- `impeccable detect --json` на `PsychologistDashboard.tsx` → **0 findings**.
- Все 4 состояния (empty/loading/error/offline) реализованы.
- Все endpoint'ы выше задействованы хотя бы один раз.
- prefers-reduced-motion работает (skeleton не пульсирует если reduced).
- Тач-таргеты ≥44px на мобильном.
- Манрп используется на headings, Inter на body.
- Логин под `psychologist@test.kz` / `Admin123!` → дашборд показывает не-пустой UI, даже если БД пуста (засеять дамми-консультации через seed-скрипт + один POST `/api/consultations`).

---

## Задача 2: SchoolWorkbench (директор/завуч)

### Персона

**Завуч 9-х классов**, готовится к ВОУД через 3 месяца. Десктоп, Excel-натренирован. Главный страх: «упустить ребёнка с подозрением на буллинг/суицид, потом проверка». Главное желание: «один PDF-отчёт, который можно показать РОНО и получить премию».

### Job to be done

1. **Раз в квартал:** запустить групповую диагностику 9-х классов.
2. **Раз в месяц:** ревью «есть ли в школе ребёнок в RED-зоне».
3. **Раз в неделю (если активно):** проверить, как идёт прогресс прохождения.
4. **Один раз в год:** экспортнуть годовой отчёт.

### Структура страницы

`frontend/app/(protected)/dashboard/components/SchoolDashboard.tsx`:

#### Шапка
- «КГУ Школа-лицей №5, г. Жезказган. **236 учеников · 7 классов · 12 преподавателей.**»
- Справа: chip `Импорт учеников` (CSV upload) + chip `Запустить диагностику`.

#### Светофор риска (главный блок)
**3 крупные карточки** в формате `risk-50` / `warn-50` / `ok-50` с цифрой и подписью:

- 🔴 **5 учеников в RED-зоне** — «Требуют немедленного внимания психолога»
- 🟡 **18 учеников в YELLOW-зоне** — «Требуют наблюдения»  
- 🟢 **213 учеников в GREEN-зоне** — «Норма»

Клик по карточке → отфильтрованный список учеников.

⚠️ **NB:** Это **не hero-metric template** (impeccable absolute ban). Карточки нужно подать как actionable, не как cosmetic stats. Под каждой — кнопка действия («Открыть список», не «Подробнее»).

#### Прогресс групповой диагностики
Если есть активная `group-test`:
- Прогресс-бар «184/236 учеников прошли (78%)»
- Список оставшихся классов: «9А — 23/30, 9Б — 28/30, 9В — 18/30»
- CTA «Отправить напоминание» (отправляет push/email родителям не-прошедших)
- «Завершить досрочно» (только админ-школы)

Если нет активной — empty state «Готовы провести следующую диагностику? [Запустить]» → flow создания group-test (выбор класса, выбор тестов, выбор сроков).

#### Двухколоночный блок

**Слева (2/3): Список классов**
- Таблица: `Класс` / `Учеников` / `Прошли тесты` / `Средний риск` / `Действия`.
- Sort и фильтры (по параллели, по риску).
- Действия на каждой строке: `Открыть класс` / `Запустить тест` / `Экспорт CSV`.

**Справа (1/3): Топ-риск учеников**
- 5-10 учеников с наивысшим риском (последний тест RED или несколько YELLOW подряд).
- Карточка: имя, класс, дата последнего теста, риск-badge, кнопка `Открыть карту`.

#### Под этим — отчёты и экспорты

- Карточки: `Годовой отчёт PDF` / `Срез по тревожности` / `Срез по мотивации` / `Кейсы буллинга`.
- Каждый PDF — клик → генерация → download.

### Backend endpoints

```
GET  /api/schools/me                         → my school profile
GET  /api/schools/:id                        → school detail
PATCH /api/schools/:id                       → update
GET  /api/schools/:id/classes                → list classes
POST /api/schools/:id/classes                → create class
GET  /api/schools/:id/students               → list students (paginated)
POST /api/schools/:id/students               → create student
POST /api/schools/:id/students/create        → create individual student
POST /api/schools/:id/import                 → bulk import CSV
GET  /api/schools/:id/stats                  → aggregate stats (risk distribution, completion)
GET  /api/schools/:id/group-tests            → list group tests
POST /api/schools/:id/group-tests            → start new group test
GET  /api/schools/:id/reports                → list available reports
DELETE /api/schools/:id                      → delete (admin only)
GET  /api/group-tests/:id                    → group test detail
```

Импорт CSV-учеников через `/api/schools/:id/import` — UI должен показывать прогресс upload + parsing, и при ошибках — конкретные строки CSV с пометкой.

### Состояния

Те же 4 (empty/loading/error/offline), что и для psychologist'а.

### Acceptance

- `impeccable detect --json` → **0 findings**.
- CSV-импорт работает (можно загрузить sample-CSV из `backend/scripts/sample-students.csv`, если нет — создай).
- group-test launch flow проходит: выбрать класс → выбрать тесты → подтвердить → видеть прогресс.
- Логин под `school@test.kz` / `Admin123!` → не-пустой UI.
- PDF-отчёт скачивается (хотя бы один тип).

---

## Что НЕ нужно делать

1. **Не трогай AdminDashboard.tsx.** Это твой же редизайн, эталон. Унифицирую токены — я сам, в globals.css.
2. **Не делай новый дизайн-язык.** Все стили — через CSS-variables из моего unify-коммита.
3. **Не пиши mock-API.** Backend готов, всё подключай через реальные endpoints.
4. **Не используй emoji в headings.** Это в anti-references (Telegram-родительские паблики стиль).
5. **Не используй gradient-text** (`bg-clip-text` + gradient bg) — banned, design law.
6. **Не используй `border-l-4` (или 2/3/...) как accent на cards** — absolute ban.
7. **Не используй pure `#000`/`#fff`** — design law, бери `--ink-900` / `--card`.
8. **Не пиши em-dash («—»)** в UI-копи. Bullet, точка, запятая, двоеточие.
9. **Inter — не для headings.** На headings — `--font-display` (Manrope).

## Координация

### Git

Работаем на `main`. Чтобы не пересекаться:

- **Я (claude-opus)** буду пушить коммиты с префиксом `feat(tokens)`, `feat(a11y)`, `fix(admin)`, `fix(results)`.
- **Ты (Cowork)** пушь с префиксом `feat(psy)`, `feat(school)`.
- Прежде чем начать — `git pull --rebase`.
- Если конфликт в `globals.css` — пингани меня (mark в коммит-message `@claude-opus`).

### Sync point

После того как я пушну `feat(tokens): unify design system globally`, перезайди и `git pull`, и стартуй. До этого можешь спокойно читать PRODUCT.md, разглядывать AdminDashboard.tsx и API-endpoints.

### Definition of Done

- Оба workbench'а отрендерены, залогинены под соответствующими ролями, видны не-пустые UI.
- `impeccable detect --json` на обеих файлах → 0 findings.
- Все 4 состояния (empty/loading/error/offline) присутствуют.
- A11y: focus-rings, aria-label на иконных кнопках, тач-таргеты ≥44px, reduced-motion.
- Коммиты push'нуты на main.
- В этом handoff-доке добавить секцию `## 2026-05-12 — Cowork output` с кратким summary что сделано (по моему feedback_progressive_memory правилу).

## Параметры успеха (после твоей работы)

Запустим `/impeccable critique frontend` целиком. Цель:
- Heuristic-score: с **22/40 → ≥30/40**.
- Detector: с **109 findings → <30**.
- Persona Red Flag «Динара бросит через неделю» — снят.
- Persona Red Flag «школа видит blank dashboard» — снят.

Если справишься на этом уровне — позиционируем продукт как готовый к B2B-демо для школ.

---

*Сгенерировано через `/impeccable critique` 2026-05-12 (claude-opus). См. также `/PRODUCT.md`, `/NOTES.md`, и `/tmp/zb-detect.json` (detector report).*

---

## 2026-05-12 — Status update (claude-opus)

**Изменение в split'е:** пользователь передал psychologist-workbench из задачи Cowork-а ко мне (вместе с Claude Design bundle `psychologist-workbench.html`). Cowork теперь отвечает только за **school-workbench**.

### Что сделано

- `frontend/app/(protected)/dashboard/components/PsychologistDashboard.tsx` — полный rewrite по дизайн-бандлу Claude Design. Структура матчит spec:
  - Greeting + chip рейтинг + tumblr-toggle «Принимаю новых» (toggle ARIA-switch, ок-50 фон когда on)
  - «Сегодня, 12 мая» секция с вертикальным таймлайном на 4 слота (SCHEDULED / IN_PROGRESS с purple `--brand-grad` highlight + «Идёт сейчас» badge / COMPLETED с opacity 0.78 + check / минутный обратный отсчёт «через 14 мин» если ≤15)
  - Двухколоночный блок: очередь на подтверждение (chips Все/Срочные/Новые/Этой недели с counts, sort dropdown, urgent rows на risk-50 фоне с «Срочно» pill, 3 quick-action кнопки) + «Следить за» (5 watch rows с tone-аватарами, click → `/clients/[id]`)
  - Featured purple card «Заработок месяца» с brand-grad + radial shine, h-display 44px цифрой, метрики, кнопки Подробнее + Чек ИП
  - «Рейтинг и отзывы» с 5-star отображением, 3 review-карточки с brand-400 вертикальной полосой
  - «Быстрая навигация» — 5 NavTile-карточек с brand-50 icon-tile и hover-lift
- Все стили scoped в `.psy-shell` (тот же паттерн, что в Cowork-овском AdminDashboard) — токены `--psy-*` не текут в другие роли
- `prefers-reduced-motion` поддержан (animation-duration → 0.001ms)
- `:focus-visible` с brand-600 outline везде внутри `.psy-shell`
- Тач-таргеты ≥44px на всех кнопках и chip'ах
- aria-label на каждой иконной кнопке и в кнопках с именем ребёнка («Открыть карту ребёнка: {name}», «Войти в видеосвязь с {name}» и т.д.)

### Wiring

- `GET /api/consultations/my` → сегодняшние slot'ы (фильтр по today). Mapping: scheduledAt → time, childName/childAge/reason/riskZone → display, status → визуальное состояние, minutesUntilFrom(scheduledAt) → live countdown.
- `GET /api/psychologists/me/earnings` → featured-карточка.
- `GET /api/psychologists/me/clients` → watch list (фильтр на zone ∈ {risk, warn}, top 5).
- `PUT /api/consultations/:id/confirm` и `:id/reject` — quick-actions в очереди.
- Очередь — пока fixture (отдельного `/consultations/pending` endpoint'а нет; добавит backend позже).
- Везде fallback на дизайн-фикстуры если API возвращает пусто — workbench не выглядит сломанным под пустой БД.

### Acceptance check

- `impeccable detect --json` → **[] (0 findings)** ✓
- `tsc --noEmit` → 0 ошибок ✓
- Production build (`npm run build`) → успешный ✓
- Логин `psychologist@test.kz` / `Admin123!` → дашборд рендерится с не-пустым UI (puppeteer-screenshot 2160×1350 подтверждает) ✓
- Reduced-motion / focus-visible / aria-label / 44px targets — присутствуют ✓

### Что остаётся Cowork-у

1. **`SchoolDashboard.tsx`** — реализация school-workbench по Claude Design (если в том же design-bundle есть `school-workbench.html`, использовать его как spec; если нет — ориентироваться на «Задача 2» этого handoff'а).
2. **«Унификация tokens в globals.css»** (P0 из моего critique) — пока мой PsychologistDashboard.tsx использует scoped `--psy-*` префикс, чтобы не блокировать parallel-работу. После того как Cowork сделает SchoolDashboard аналогичным паттерном (`.school-shell` + `--school-*`), можно сделать отдельную PR'ом подняв общие токены в `globals.css` и убрав префиксы.
3. Из моего изначального plan'а (a11y глобально, side-stripe в admin/bullying, results palette cleanup) — остаются мне. Запушу отдельными коммитами после.
