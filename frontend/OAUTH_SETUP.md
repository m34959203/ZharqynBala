# OAuth Setup Guide

Это руководство поможет настроить OAuth авторизацию через Google и Mail.ru для платформы Жарқын Бала.

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

## Mail.ru OAuth Setup

### Шаг 1: Создайте приложение в Mail.ru

1. Откройте [Mail.ru OAuth Portal](https://o2.mail.ru/app/)
2. Войдите с вашим Mail.ru аккаунтом
3. Нажмите **Создать приложение** или **Create Application**

### Шаг 2: Настройте приложение

Заполните форму создания приложения:

- **Название приложения**: Жарқын Бала
- **Описание**: Платформа психологической диагностики детей
- **Логотип**: загрузите логотип вашего приложения (опционально)
- **Тип приложения**: Веб-сайт
- **URL сайта**:
  - Для разработки: `http://localhost:3000`
  - Для продакшена: `https://your-production-domain.com`
- **Redirect URI**:
  - Для разработки: `http://localhost:3000/api/auth/callback/mailru`
  - Для продакшена: `https://your-production-domain.com/api/auth/callback/mailru`

### Шаг 3: Настройте права доступа

В разделе **Права доступа** (Permissions) выберите:
- ✅ **Доступ к email** (userinfo)
- ✅ **Доступ к профилю** (базовая информация)

### Шаг 4: Получите credentials

1. После создания приложения вы увидите страницу с данными:
   - **Client ID** (ID приложения)
   - **Client Secret** (Секретный ключ)
2. Скопируйте оба значения

### Шаг 5: Добавьте в .env.local

```env
MAILRU_CLIENT_ID=your-mailru-client-id
MAILRU_CLIENT_SECRET=your-mailru-client-secret
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

# Mail.ru OAuth
MAILRU_CLIENT_ID=your-mailru-client-id
MAILRU_CLIENT_SECRET=your-mailru-client-secret
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
   MAILRU_CLIENT_ID=...
   MAILRU_CLIENT_SECRET=...
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

3. Нажмите на кнопку "Войти через Google" или "Войти через Mail.ru"

4. Вы должны быть перенаправлены на страницу авторизации провайдера

5. После успешной авторизации вы будете перенаправлены на `/dashboard`

---

## Troubleshooting

### Ошибка: "Redirect URI mismatch"

**Проблема**: URL в настройках OAuth не совпадает с фактическим callback URL.

**Решение**:
- Проверьте, что в Google/Mail.ru OAuth настройках указан правильный callback URL
- Формат: `http://localhost:3000/api/auth/callback/google` (или `/mailru`)
- Убедитесь, что нет лишних слэшей в конце

### Ошибка: "Invalid client"

**Проблема**: Неправильный Client ID или Client Secret.

**Решение**:
- Убедитесь, что скопировали credentials правильно
- Проверьте, что нет лишних пробелов в .env.local
- Перезапустите dev сервер после изменения .env.local

### Ошибка 403: "Access blocked: Authorization Error"

**Проблема**: OAuth Consent Screen не настроен или приложение не опубликовано.

**Решение (Google)**:
- В Google Cloud Console завершите настройку OAuth Consent Screen
- Добавьте тестовых пользователей, если приложение в режиме Testing
- Или опубликуйте приложение (Publish App)

**Решение (Mail.ru)**:
- Проверьте, что приложение активно в Mail.ru OAuth Portal
- Убедитесь, что указаны правильные Redirect URIs
- Проверьте права доступа (должен быть включен userinfo)

### Mail.ru: Ошибка при получении userinfo

**Проблема**: Не удается получить данные пользователя от Mail.ru.

**Решение**:
- Убедитесь, что в правах доступа включен scope `userinfo`
- Проверьте, что redirect URI точно совпадает с настройками в Mail.ru
- Используйте HTTPS для production URL

---

## Дополнительные провайдеры

NextAuth поддерживает множество провайдеров. Для добавления других (Яндекс, VK, Facebook и т.д.) см. [официальную документацию](https://next-auth.js.org/providers/).

### Пример добавления Яндекс OAuth

```typescript
// В frontend/lib/auth.ts

{
  id: "yandex",
  name: "Yandex",
  type: "oauth",
  authorization: {
    url: "https://oauth.yandex.ru/authorize",
    params: {
      scope: "login:email login:info",
      response_type: "code",
    },
  },
  token: "https://oauth.yandex.ru/token",
  userinfo: "https://login.yandex.ru/info?format=json",
  clientId: process.env.YANDEX_CLIENT_ID || "",
  clientSecret: process.env.YANDEX_CLIENT_SECRET || "",
  profile(profile) {
    return {
      id: profile.id,
      name: profile.display_name || profile.real_name,
      email: profile.default_email,
      image: profile.default_avatar_id
        ? `https://avatars.yandex.net/get-yapic/${profile.default_avatar_id}/islands-200`
        : null,
    };
  },
}
```

## Полезные ссылки

- [NextAuth.js Documentation](https://next-auth.js.org/)
- [Google OAuth 2.0](https://developers.google.com/identity/protocols/oauth2)
- [Mail.ru OAuth](https://o2.mail.ru/docs/)
- [Генератор секретных ключей](https://generate-secret.vercel.app/32)
