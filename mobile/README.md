# ZharqynBala Mobile App

## Обзор

Мобильное приложение ZharqynBala для iOS и Android, построенное на React Native.

## Технологии

- **React Native** 0.73+ с New Architecture
- **Expo** SDK 50+
- **TypeScript** для типобезопасности
- **React Navigation** для навигации
- **React Query** для управления данными
- **Zustand** для состояния
- **React Native Paper** для UI компонентов

## Структура проекта

```
mobile/
├── src/
│   ├── app/                # Экраны приложения
│   │   ├── (tabs)/        # Табы навигации
│   │   ├── auth/          # Экраны авторизации
│   │   ├── tests/         # Тесты
│   │   ├── results/       # Результаты
│   │   └── profile/       # Профиль
│   ├── components/        # Переиспользуемые компоненты
│   ├── hooks/             # Кастомные хуки
│   ├── services/          # API сервисы
│   ├── stores/            # Zustand stores
│   ├── utils/             # Утилиты
│   └── types/             # TypeScript типы
├── assets/                # Изображения, шрифты
├── app.json              # Expo конфигурация
├── eas.json              # EAS Build конфигурация
└── package.json
```

## Установка

```bash
# Установка зависимостей
npm install

# Запуск в режиме разработки
npm start

# Запуск на iOS
npm run ios

# Запуск на Android
npm run android
```

## Сборка для публикации

```bash
# Сборка для iOS
eas build --platform ios --profile production

# Сборка для Android
eas build --platform android --profile production

# Публикация в сторы
eas submit --platform ios
eas submit --platform android
```

## API интеграция

Приложение использует тот же backend API, что и веб-версия:
- Production: `https://api.zharqynbala.kz`
- Development: `http://localhost:3001`

## Функционал

### Авторизация
- Вход по email/телефону
- Регистрация
- Сброс пароля
- OAuth (Google, Apple)

### Тесты
- Каталог тестов с фильтрами
- Прохождение тестов с прогрессом
- Сохранение прогресса офлайн

### Результаты
- Просмотр результатов
- Графики и диаграммы
- PDF экспорт
- Поделиться результатами

### Профиль
- Управление детьми
- Настройки уведомлений
- Подписка и оплата
- История

### Дополнительно
- Push уведомления
- Офлайн режим
- Биометрическая аутентификация
- Dark mode

## Конфигурация

### Переменные окружения

```env
EXPO_PUBLIC_API_URL=https://api.zharqynbala.kz
EXPO_PUBLIC_SENTRY_DSN=your-sentry-dsn
```

### app.json

```json
{
  "expo": {
    "name": "ZharqynBala",
    "slug": "zharqynbala",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#667eea"
    },
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "kz.zharqynbala.app",
      "buildNumber": "1"
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#667eea"
      },
      "package": "kz.zharqynbala.app",
      "versionCode": 1
    }
  }
}
```

## Тестирование

```bash
# Unit тесты
npm test

# E2E тесты (Detox)
npm run test:e2e
```

## Публикация

### App Store (iOS)

1. Создать App ID в Apple Developer
2. Настроить provisioning profiles
3. Собрать через EAS Build
4. Отправить через EAS Submit или Transporter

### Google Play (Android)

1. Создать приложение в Google Play Console
2. Настроить signing keys
3. Собрать через EAS Build
4. Загрузить AAB через консоль

## Поддержка

- Email: mobile@zharqynbala.kz
- Документация: https://docs.zharqynbala.kz/mobile
