# OAuth Setup Guide

Это руководство поможет настроить OAuth авторизацию через Google и GitHub для платформы Жарқын Бала.

## Быстрый старт

1. Скопируйте `.env.example` в `.env.local`
2. Сгенерируйте `NEXTAUTH_SECRET`:
   ```bash
   openssl rand -base64 32
   ```
3. Настройте OAuth провайдеры (см. ниже)

---

## Google OAuth Setup

### Шаг 1: Создайте проект в Google Cloud Console

1. Откройте [Google Cloud Console](https://console.cloud.google.com/)
2. Создайте новый проект или выберите существующий
3. Перейдите в **APIs & Services** → **Credentials**

### Шаг 2: Настройте OAuth Consent Screen

1. Нажмите **OAuth consent screen** в боковом меню
2. Выберите **External** и нажмите **Create**
3. Заполните обязательные поля:
   - **App name**: Жарқын Бала
   - **User support email**: ваш email
   - **Developer contact email**: ваш email
4. Нажмите **Save and Continue**
5. На странице **Scopes** нажмите **Save and Continue** (базовые скоупы уже добавлены)
6. На странице **Test users** добавьте ваш email для тестирования
7. Нажмите **Save and Continue**, затем **Back to Dashboard**

### Шаг 3: Создайте OAuth 2.0 Client ID

1. Перейдите на **Credentials** → **Create Credentials** → **OAuth client ID**
2. Выберите **Application type**: Web application
3. Заполните:
   - **Name**: Жарқын Бала Web Client
   - **Authorized JavaScript origins**:
     - `http://localhost:3000` (для локальной разработки)
     - `https://your-production-domain.com` (для продакшена)
   - **Authorized redirect URIs**:
     - `http://localhost:3000/api/auth/callback/google`
     - `https://your-production-domain.com/api/auth/callback/google`
4. Нажмите **Create**
5. Скопируйте **Client ID** и **Client Secret**

### Шаг 4: Добавьте в .env.local

```env
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
```

---

## GitHub OAuth Setup

### Шаг 1: Создайте OAuth App

1. Откройте [GitHub Developer Settings](https://github.com/settings/developers)
2. Нажмите **New OAuth App**

### Шаг 2: Настройте приложение

Заполните форму:

- **Application name**: Жарқын Бала
- **Homepage URL**:
  - Для разработки: `http://localhost:3000`
  - Для продакшена: `https://your-production-domain.com`
- **Application description**: Платформа психологической диагностики детей
- **Authorization callback URL**:
  - Для разработки: `http://localhost:3000/api/auth/callback/github`
  - Для продакшена: `https://your-production-domain.com/api/auth/callback/github`

### Шаг 3: Получите credentials

1. После создания приложения скопируйте **Client ID**
2. Нажмите **Generate a new client secret**
3. Скопируйте **Client Secret** (он показывается только один раз!)

### Шаг 4: Добавьте в .env.local

```env
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
```

---

## Полный .env.local файл

```env
# Backend API
NEXT_PUBLIC_API_URL=https://zharqynbala-production.up.railway.app

# NextAuth Configuration
NEXTAUTH_SECRET=generated-secret-from-openssl-rand-base64-32
NEXTAUTH_URL=http://localhost:3000  # Для продакшена: https://your-domain.com

# Google OAuth
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret

# GitHub OAuth
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
```

---

## Настройка для Production (Railway/Vercel)

### Railway

1. Откройте проект frontend в Railway
2. Перейдите в **Variables**
3. Добавьте переменные окружения:
   ```
   NEXTAUTH_SECRET=...
   NEXTAUTH_URL=https://your-frontend-url.railway.app
   GOOGLE_CLIENT_ID=...
   GOOGLE_CLIENT_SECRET=...
   GITHUB_CLIENT_ID=...
   GITHUB_CLIENT_SECRET=...
   ```

### Vercel

1. Откройте проект в Vercel Dashboard
2. Перейдите в **Settings** → **Environment Variables**
3. Добавьте все переменные из .env.local
4. **Важно**: Установите `NEXTAUTH_URL` в значение вашего production URL

---

## Проверка работы

1. Запустите приложение:
   ```bash
   npm run dev
   ```

2. Откройте `http://localhost:3000/login`

3. Нажмите на кнопку "Войти через Google" или "Войти через GitHub"

4. Вы должны быть перенаправлены на страницу авторизации провайдера

5. После успешной авторизации вы будете перенаправлены на `/dashboard`

---

## Troubleshooting

### Ошибка: "Redirect URI mismatch"

**Проблема**: URL в настройках OAuth не совпадает с фактическим callback URL.

**Решение**:
- Проверьте, что в Google/GitHub OAuth настройках указан правильный callback URL
- Формат: `http://localhost:3000/api/auth/callback/google` (или `/github`)
- Убедитесь, что нет лишних слэшей в конце

### Ошибка: "Invalid client"

**Проблема**: Неправильный Client ID или Client Secret.

**Решение**:
- Убедитесь, что скопировали credentials правильно
- Проверьте, что нет лишних пробелов в .env.local
- Перезапустите dev сервер после изменения .env.local

### Ошибка 403: "Access blocked: Authorization Error"

**Проблема**: OAuth Consent Screen не настроен или приложение не опубликовано.

**Решение**:
- В Google Cloud Console завершите настройку OAuth Consent Screen
- Добавьте тестовых пользователей, если приложение в режиме Testing
- Или опубликуйте приложение (Publish App)

---

## Дополнительные провайдеры

NextAuth поддерживает множество провайдеров. Для добавления других (Facebook, Apple, Microsoft и т.д.) см. [официальную документацию](https://next-auth.js.org/providers/).

Пример добавления провайдера в `frontend/lib/auth.ts`:

```typescript
import FacebookProvider from "next-auth/providers/facebook";

providers: [
  FacebookProvider({
    clientId: process.env.FACEBOOK_CLIENT_ID,
    clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
  }),
  // ...остальные провайдеры
]
```
