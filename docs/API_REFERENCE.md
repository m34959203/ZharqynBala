# API Reference - Zharqyn Bala

## Базовый URL

```
Production: https://api.zharqynbala.kz/api/v1
Development: http://localhost:3001/api/v1
```

## Аутентификация

Все защищённые эндпоинты требуют JWT токен в заголовке:

```
Authorization: Bearer <access_token>
```

---

## Auth API

### POST /auth/register

Регистрация нового пользователя.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123",
  "firstName": "Иван",
  "lastName": "Иванов",
  "role": "PARENT",
  "language": "RU"
}
```

**Response:** `201 Created`
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "firstName": "Иван",
    "lastName": "Иванов",
    "role": "PARENT"
  }
}
```

### POST /auth/login

Вход в систему.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**Response:** `200 OK`
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
  "user": { ... }
}
```

### POST /auth/refresh

Обновление access токена.

**Request Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Response:** `200 OK`
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

---

## Psychologists API

### GET /psychologists

Получить список одобренных психологов.

**Query Parameters:**
| Параметр | Тип | Описание |
|----------|-----|----------|
| page | number | Номер страницы (default: 1) |
| limit | number | Записей на странице (default: 10) |
| specialization | string | Фильтр по специализации |

**Response:** `200 OK`
```json
{
  "psychologists": [
    {
      "id": "uuid",
      "firstName": "Анна",
      "lastName": "Петрова",
      "avatarUrl": "https://...",
      "specialization": ["Детский психолог", "Семейный психолог"],
      "languages": ["Русский", "Казахский"],
      "experienceYears": 10,
      "education": "КазНУ, психология",
      "bio": "Опыт работы с детьми...",
      "hourlyRate": 15000,
      "rating": 4.8,
      "totalConsultations": 150,
      "isAvailable": true
    }
  ],
  "total": 25,
  "page": 1,
  "limit": 10
}
```

### GET /psychologists/:id

Получить профиль психолога.

**Response:** `200 OK`
```json
{
  "id": "uuid",
  "firstName": "Анна",
  "lastName": "Петрова",
  "avatarUrl": "https://...",
  "specialization": ["Детский психолог"],
  "languages": ["Русский", "Казахский"],
  "experienceYears": 10,
  "education": "КазНУ, психология",
  "bio": "...",
  "hourlyRate": 15000,
  "rating": 4.8,
  "totalConsultations": 150,
  "isAvailable": true,
  "certificateUrl": "https://...",
  "availability": [
    { "dayOfWeek": 1, "startTime": "09:00", "endTime": "18:00" },
    { "dayOfWeek": 2, "startTime": "09:00", "endTime": "18:00" }
  ]
}
```

### GET /psychologists/:id/slots

Получить доступные слоты психолога.

**Query Parameters:**
| Параметр | Тип | Описание |
|----------|-----|----------|
| startDate | string | Начало периода (YYYY-MM-DD) |
| endDate | string | Конец периода (YYYY-MM-DD) |

**Response:** `200 OK`
```json
[
  { "date": "2026-01-15", "hour": 10 },
  { "date": "2026-01-15", "hour": 11 },
  { "date": "2026-01-16", "hour": 14 }
]
```

### GET /psychologists/me

Получить свой профиль психолога. Требует роль PSYCHOLOGIST.

**Response:** `200 OK`
```json
{
  "id": "uuid",
  "firstName": "Анна",
  "lastName": "Петрова",
  ...
  "isProfileComplete": true
}
```

### PUT /psychologists/me

Обновить свой профиль. Требует роль PSYCHOLOGIST.

**Request Body:**
```json
{
  "specialization": ["Детский психолог", "Семейный психолог"],
  "languages": ["Русский", "Казахский"],
  "experienceYears": 10,
  "education": "КазНУ, психология",
  "bio": "Опыт работы с детьми...",
  "hourlyRate": 15000,
  "certificateUrl": "https://..."
}
```

---

## Consultations API

### POST /consultations

Записаться на консультацию. Требует роль PARENT.

**Request Body:**
```json
{
  "psychologistId": "uuid",
  "childId": "uuid",
  "scheduledAt": "2026-01-15T10:00:00.000Z",
  "durationMinutes": 50,
  "notes": "Проблемы с концентрацией внимания"
}
```

**Response:** `201 Created`
```json
{
  "id": "uuid",
  "psychologistId": "uuid",
  "psychologistName": "Анна Петрова",
  "psychologistAvatarUrl": "https://...",
  "clientId": "uuid",
  "clientName": "Иван Иванов",
  "childId": "uuid",
  "childName": "Пётр Иванов",
  "scheduledAt": "2026-01-15T10:00:00.000Z",
  "durationMinutes": 50,
  "status": "PENDING",
  "roomUrl": null,
  "price": 15000,
  "paymentStatus": "PENDING",
  "notes": "Проблемы с концентрацией внимания",
  "createdAt": "2026-01-10T12:00:00.000Z"
}
```

### GET /consultations/my

Мои консультации (клиент). Требует роль PARENT.

**Query Parameters:**
| Параметр | Тип | Описание |
|----------|-----|----------|
| page | number | Номер страницы |
| limit | number | Записей на странице |
| status | string | Фильтр по статусу |

**Response:** `200 OK`
```json
{
  "consultations": [ ... ],
  "total": 5,
  "page": 1,
  "limit": 10
}
```

### GET /consultations/psychologist

Консультации психолога. Требует роль PSYCHOLOGIST.

**Query Parameters:** Аналогично `/consultations/my`

### GET /consultations/:id

Детали консультации.

**Response:** `200 OK`
```json
{
  "id": "uuid",
  ...
  "roomName": "zharqynbala-abc12345-def67890",
  "roomUrl": "https://meet.jit.si/zharqynbala-abc12345-def67890"
}
```

### PUT /consultations/:id/confirm

Подтвердить консультацию. Требует роль PSYCHOLOGIST.

**Request Body (опционально):**
```json
{
  "notes": "Дополнительные заметки"
}
```

**Response:** `200 OK` - Консультация со статусом CONFIRMED и созданной видеокомнатой.

### PUT /consultations/:id/reject

Отклонить консультацию. Требует роль PSYCHOLOGIST.

**Request Body:**
```json
{
  "reason": "Не могу в это время"
}
```

### PUT /consultations/:id/cancel

Отменить консультацию. Требует роль PARENT.

**Request Body:**
```json
{
  "reason": "Изменились планы"
}
```

### PUT /consultations/:id/start

Начать консультацию. Изменяет статус на IN_PROGRESS.

### PUT /consultations/:id/complete

Завершить консультацию. Требует роль PSYCHOLOGIST.

### PUT /consultations/:id/no-show

Отметить неявку клиента. Требует роль PSYCHOLOGIST.

### PUT /consultations/:id/rate

Оставить отзыв. Требует роль PARENT.

**Request Body:**
```json
{
  "rating": 5,
  "review": "Отличная консультация!"
}
```

### GET /consultations/:id/jitsi-config

Получить конфигурацию Jitsi для видеозвонка.

**Response:** `200 OK`
```json
{
  "domain": "meet.jit.si",
  "roomName": "zharqynbala-abc12345-def67890",
  "configOverwrite": {
    "disableDeepLinking": true,
    "prejoinPageEnabled": true,
    "defaultLanguage": "ru"
  },
  "interfaceConfigOverwrite": {
    "APP_NAME": "Zharqyn Bala",
    "SHOW_JITSI_WATERMARK": false,
    "TOOLBAR_BUTTONS": ["microphone", "camera", "chat", "hangup", ...]
  },
  "userInfo": {
    "displayName": "Иван Иванов",
    "email": "user@example.com"
  }
}
```

---

## Schedule API

### GET /schedule

Получить расписание психолога. Требует роль PSYCHOLOGIST.

**Query Parameters:**
| Параметр | Тип | Описание |
|----------|-----|----------|
| startDate | string | Начало периода (YYYY-MM-DD) |
| endDate | string | Конец периода (YYYY-MM-DD) |

**Response:** `200 OK`
```json
[
  { "date": "2026-01-15", "hour": 9, "isAvailable": true },
  { "date": "2026-01-15", "hour": 10, "isAvailable": false },
  ...
]
```

### POST /schedule

Сохранить слоты расписания. Требует роль PSYCHOLOGIST.

**Request Body:**
```json
{
  "slots": [
    { "date": "2026-01-15", "hour": 9, "isAvailable": true },
    { "date": "2026-01-15", "hour": 10, "isAvailable": true }
  ]
}
```

### DELETE /schedule

Удалить слоты за период. Требует роль PSYCHOLOGIST.

**Query Parameters:**
| Параметр | Тип | Описание |
|----------|-----|----------|
| startDate | string | Начало периода |
| endDate | string | Конец периода |

---

## Tests API

### GET /tests

Получить список тестов.

**Query Parameters:**
| Параметр | Тип | Описание |
|----------|-----|----------|
| category | string | Категория теста |
| ageMin | number | Минимальный возраст |
| ageMax | number | Максимальный возраст |

### GET /tests/:id

Получить детали теста с вопросами.

### POST /tests/:id/session

Начать сессию теста.

**Request Body:**
```json
{
  "childId": "uuid"
}
```

### POST /tests/sessions/:sessionId/answer

Отправить ответ на вопрос.

**Request Body:**
```json
{
  "questionId": "uuid",
  "answerOptionId": "uuid"
}
```

### POST /tests/sessions/:sessionId/complete

Завершить тест и получить результат.

---

## Users API

### GET /users/me

Получить профиль текущего пользователя.

### PUT /users/me

Обновить профиль.

**Request Body:**
```json
{
  "firstName": "Иван",
  "lastName": "Иванов",
  "avatarUrl": "https://..."
}
```

### GET /users/children

Получить список детей.

### POST /users/children

Добавить ребёнка.

**Request Body:**
```json
{
  "firstName": "Пётр",
  "lastName": "Иванов",
  "birthDate": "2015-05-15",
  "gender": "MALE",
  "schoolName": "Школа №1",
  "grade": "5"
}
```

---

## Коды ошибок

| Код | Описание |
|-----|----------|
| 400 | Bad Request - Некорректные данные |
| 401 | Unauthorized - Требуется авторизация |
| 403 | Forbidden - Нет прав доступа |
| 404 | Not Found - Ресурс не найден |
| 409 | Conflict - Конфликт (например, время занято) |
| 500 | Internal Server Error - Внутренняя ошибка |

### Формат ошибки

```json
{
  "statusCode": 400,
  "message": "Описание ошибки",
  "error": "Bad Request"
}
```

---

## Статусы консультаций

| Статус | Описание |
|--------|----------|
| PENDING | Ожидает подтверждения психолога |
| CONFIRMED | Подтверждена, ожидает начала |
| REJECTED | Отклонена психологом |
| IN_PROGRESS | Идёт |
| COMPLETED | Завершена |
| CANCELLED | Отменена клиентом |
| NO_SHOW | Клиент не явился |

## Статусы оплаты

| Статус | Описание |
|--------|----------|
| PENDING | Ожидает оплаты |
| PAID | Оплачено |
| REFUNDED | Возврат |
