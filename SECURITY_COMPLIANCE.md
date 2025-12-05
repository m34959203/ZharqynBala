# 🔐 БЕЗОПАСНОСТЬ И СООТВЕТСТВИЕ СТАНДАРТАМ

## 📋 ОБЗОР

Этот документ описывает требования к безопасности и compliance для платформы **Zharqyn Bala**. Безопасность медицинских данных детей - наш главный приоритет.

---

## ⚖️ НОРМАТИВНЫЕ ТРЕБОВАНИЯ

### 1. Закон РК "О персональных данных и их защите" (PDPL)

**Основные требования:**
- ✅ Согласие на обработку персональных данных
- ✅ Право на доступ к данным
- ✅ Право на удаление (right to be forgotten)
- ✅ Уведомление об утечках (в течение 72 часов)
- ✅ Назначение ответственного за персональные данные

**Имплементация:**
```typescript
// Consent Management
interface UserConsent {
  userId: string;
  consentTypes: {
    dataProcessing: boolean;
    marketing: boolean;
    thirdPartySharing: boolean;
  };
  consentDate: Date;
  ipAddress: string;
  version: string; // версия Privacy Policy
}

// Audit Log для compliance
interface DataAccessLog {
  userId: string;
  accessedBy: string;
  action: 'read' | 'update' | 'delete';
  dataType: string;
  timestamp: Date;
  ipAddress: string;
}
```

**Чеклист PDPL Compliance:**
- [ ] Политика конфиденциальности (русский + казахский)
- [ ] Форма согласия на обработку данных
- [ ] Механизм отзыва согласия
- [ ] Экспорт данных по запросу пользователя
- [ ] Полное удаление данных по запросу
- [ ] Логирование всех доступов к данным
- [ ] Назначить DPO (Data Protection Officer)
- [ ] Процедура уведомления об утечках

---

### 2. Медицинские данные (Healthcare Data)

**Специфика:**
Хотя мы не медицинское учреждение, психологические данные детей требуют особой защиты.

**Best Practices (HIPAA-inspired):**
- Шифрование данных at rest и in transit
- Минимизация доступа (need-to-know basis)
- Анонимизация для аналитики
- Retention policy (хранение только необходимое время)

**Классификация данных:**

```yaml
Public (открытые):
  - Информация о платформе
  - Публичные статьи

Internal (внутренние):
  - Статистика без персональных данных
  - Аггрегированная аналитика

Confidential (конфиденциальные):
  - ФИО, email, телефон
  - Профили детей (без результатов тестов)

Sensitive (чувствительные):
  - Результаты психологических тестов
  - История консультаций
  - Записи видео-сессий
  - Медицинские заключения
```

---

## 🔐 ТЕХНИЧЕСКИЕ МЕРЫ БЕЗОПАСНОСТИ

### 1. Аутентификация и Авторизация

#### JWT Tokens (Рекомендация)

```typescript
// Token Structure
interface AccessToken {
  userId: string;
  role: 'parent' | 'psychologist' | 'school' | 'admin';
  permissions: string[];
  exp: number; // expires in 15 minutes
}

interface RefreshToken {
  userId: string;
  tokenVersion: number; // для инвалидации всех токенов
  exp: number; // expires in 7 days
}

// Token Rotation
async function refreshAccessToken(refreshToken: string) {
  const decoded = verifyToken(refreshToken);

  // Проверка, не был ли токен отозван
  const isRevoked = await checkIfRevoked(decoded.userId, decoded.tokenVersion);
  if (isRevoked) throw new Error('Token revoked');

  // Генерация нового access token
  const newAccessToken = generateAccessToken(decoded.userId);

  return newAccessToken;
}
```

**Безопасность:**
- ✅ Short-lived access tokens (15 мин)
- ✅ Refresh token rotation
- ✅ Token blacklisting при logout
- ✅ Automatic logout после 30 дней неактивности
- ✅ IP-based anomaly detection

---

#### Multi-Factor Authentication (MFA)

**Для кого обязательно:**
- Психологи (доступ к чувствительным данным)
- Школы (массовые данные детей)
- Администраторы

**Методы:**
```typescript
enum MFAMethod {
  SMS = 'sms',           // SMS код
  TOTP = 'totp',         // Google Authenticator
  EMAIL = 'email',       // Email код
  BIOMETRIC = 'biometric' // Face ID / Fingerprint (мобильное приложение)
}

// Включение MFA
async function enableMFA(userId: string, method: MFAMethod) {
  if (method === MFAMethod.TOTP) {
    const secret = generateTOTPSecret();
    const qrCode = generateQRCode(secret);

    await saveUserMFASettings(userId, {
      method: MFAMethod.TOTP,
      secret: encryptSecret(secret),
      enabled: false, // станет true после первой проверки
    });

    return { qrCode };
  }

  // ... другие методы
}

// Проверка MFA при входе
async function verifyMFA(userId: string, code: string) {
  const settings = await getUserMFASettings(userId);

  if (settings.method === MFAMethod.TOTP) {
    return verifyTOTP(settings.secret, code);
  }

  // ... другие методы
}
```

**Сроки внедрения:** 2-3 месяца после MVP
**Приоритет:** ВЫСОКИЙ

---

### 2. Шифрование Данных

#### At Rest (в хранилище)

**Что шифруем:**
```sql
-- Таблица users
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email VARCHAR(255) UNIQUE, -- не шифруем (нужен для поиска)
  phone_encrypted TEXT,      -- шифруем
  password_hash TEXT,        -- bcrypt hash
  ...
);

-- Таблица children
CREATE TABLE children (
  id UUID PRIMARY KEY,
  parent_id UUID,
  first_name_encrypted TEXT, -- шифруем
  last_name_encrypted TEXT,  -- шифруем
  birth_date_encrypted TEXT, -- шифруем
  ...
);

-- Таблица test results (самое чувствительное)
CREATE TABLE results (
  id UUID PRIMARY KEY,
  session_id UUID,
  data_encrypted TEXT,       -- шифруем все результаты
  interpretation_encrypted TEXT, -- шифруем интерпретацию
  ...
);
```

**Технология: AES-256-GCM**

```typescript
import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY; // 32 bytes

function encrypt(text: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY), iv);

  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const authTag = cipher.getAuthTag();

  return iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted;
}

function decrypt(encryptedData: string): string {
  const parts = encryptedData.split(':');
  const iv = Buffer.from(parts[0], 'hex');
  const authTag = Buffer.from(parts[1], 'hex');
  const encrypted = parts[2];

  const decipher = crypto.createDecipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY), iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}
```

**Key Management:**
- Encryption key хранится в AWS Secrets Manager / Yandex Lockbox
- Ротация ключей каждые 90 дней
- Старые ключи сохраняются для расшифровки старых данных

---

#### In Transit (при передаче)

**HTTPS Everywhere:**
```nginx
# nginx config
server {
  listen 443 ssl http2;
  server_name zharqynbala.kz;

  # SSL certificates
  ssl_certificate /etc/letsencrypt/live/zharqynbala.kz/fullchain.pem;
  ssl_certificate_key /etc/letsencrypt/live/zharqynbala.kz/privkey.pem;

  # SSL settings (Mozilla Modern)
  ssl_protocols TLSv1.3;
  ssl_prefer_server_ciphers off;

  # HSTS
  add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload" always;

  # Security headers
  add_header X-Frame-Options "SAMEORIGIN" always;
  add_header X-Content-Type-Options "nosniff" always;
  add_header X-XSS-Protection "1; mode=block" always;
  add_header Referrer-Policy "strict-origin-when-cross-origin" always;

  # CSP
  add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self'; connect-src 'self' https://api.zharqynbala.kz;" always;
}

# Redirect HTTP to HTTPS
server {
  listen 80;
  server_name zharqynbala.kz;
  return 301 https://$server_name$request_uri;
}
```

**Дополнительно:**
- Certificate Pinning в мобильном приложении
- Mutual TLS для чувствительных API endpoints

---

### 3. Защита от Атак

#### SQL Injection

**Защита:**
- ✅ ORM (Prisma/TypeORM) с параметризованными запросами
- ✅ Input validation
- ✅ Prepared statements

```typescript
// ❌ ПЛОХО (уязвимо к SQL injection)
const users = await db.query(`SELECT * FROM users WHERE email = '${email}'`);

// ✅ ХОРОШО (безопасно)
const users = await db.user.findMany({
  where: { email: email }
});

// Или с raw SQL (если необходимо)
const users = await db.$queryRaw`SELECT * FROM users WHERE email = ${email}`;
```

---

#### XSS (Cross-Site Scripting)

**Защита:**
```typescript
// Sanitization
import DOMPurify from 'dompurify';

function sanitizeInput(input: string): string {
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: [], // no HTML tags
    ALLOWED_ATTR: []
  });
}

// В React - используем {} вместо dangerouslySetInnerHTML
function UserProfile({ user }: { user: User }) {
  return (
    <div>
      <h1>{user.name}</h1>  {/* Автоматически escaped */}
      <p>{user.bio}</p>
    </div>
  );
}

// Если ДЕЙСТВИТЕЛЬНО нужен HTML (редко!)
function RichTextDisplay({ html }: { html: string }) {
  const cleanHTML = DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br'],
    ALLOWED_ATTR: []
  });

  return <div dangerouslySetInnerHTML={{ __html: cleanHTML }} />;
}
```

**CSP (Content Security Policy):**
См. nginx конфиг выше

---

#### CSRF (Cross-Site Request Forgery)

**Защита:**
```typescript
import csrf from 'csurf';

const csrfProtection = csrf({ cookie: true });

app.post('/api/sensitive-action', csrfProtection, async (req, res) => {
  // Токен будет проверен автоматически
  // Если токен невалиден - ошибка 403
  await performSensitiveAction();
  res.json({ success: true });
});

// Frontend - включить CSRF token в формы
function PaymentForm() {
  const [csrfToken, setCsrfToken] = useState('');

  useEffect(() => {
    fetch('/api/csrf-token')
      .then(r => r.json())
      .then(data => setCsrfToken(data.csrfToken));
  }, []);

  return (
    <form action="/api/payment" method="POST">
      <input type="hidden" name="_csrf" value={csrfToken} />
      {/* ... */}
    </form>
  );
}
```

---

#### Rate Limiting

**Защита от brute-force и DDoS:**

```typescript
import rateLimit from 'express-rate-limit';

// Общий rate limiter
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 минут
  max: 100, // 100 запросов на IP
  message: 'Слишком много запросов, попробуйте позже'
});

// Строгий для логина (против brute-force)
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5, // только 5 попыток входа за 15 минут
  skipSuccessfulRequests: true,
});

// Для API endpoints
const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 30, // 30 запросов в минуту
});

app.use('/api/', generalLimiter, apiLimiter);
app.post('/api/auth/login', loginLimiter);
```

**Продвинутая защита:**
```typescript
// Redis-based rate limiting (для distributed systems)
import Redis from 'ioredis';
import { RateLimiterRedis } from 'rate-limiter-flexible';

const redis = new Redis();

const rateLimiter = new RateLimiterRedis({
  storeClient: redis,
  keyPrefix: 'rl',
  points: 10, // количество запросов
  duration: 1, // в секундах
  blockDuration: 60, // блокировка на 60 секунд после превышения
});

async function rateLimitMiddleware(req, res, next) {
  try {
    await rateLimiter.consume(req.ip);
    next();
  } catch (error) {
    res.status(429).json({
      error: 'Too Many Requests',
      retryAfter: error.msBeforeNext / 1000
    });
  }
}
```

---

### 4. Безопасность API

#### API Key Management (для internal services)

```typescript
interface APIKey {
  id: string;
  name: string; // "Mobile App", "School Integration"
  key: string; // hashed
  permissions: string[];
  expiresAt: Date;
  lastUsed?: Date;
}

// Генерация API key
function generateAPIKey(): string {
  return crypto.randomBytes(32).toString('base64url');
}

// Проверка API key
async function verifyAPIKey(req, res, next) {
  const apiKey = req.headers['x-api-key'];

  if (!apiKey) {
    return res.status(401).json({ error: 'API key required' });
  }

  const hashedKey = hashAPIKey(apiKey);
  const keyData = await db.apiKey.findUnique({
    where: { keyHash: hashedKey }
  });

  if (!keyData || keyData.expiresAt < new Date()) {
    return res.status(401).json({ error: 'Invalid or expired API key' });
  }

  // Логирование использования
  await db.apiKey.update({
    where: { id: keyData.id },
    data: { lastUsed: new Date() }
  });

  req.apiKey = keyData;
  next();
}
```

---

#### API Versioning

```typescript
// Версионирование через URL
app.use('/api/v1', v1Router);
app.use('/api/v2', v2Router);

// Или через header
app.use((req, res, next) => {
  const version = req.headers['api-version'] || 'v1';
  req.apiVersion = version;
  next();
});
```

---

### 5. Логирование и Мониторинг

#### Security Event Logging

```typescript
interface SecurityEvent {
  type: 'login' | 'logout' | 'failed_login' | 'data_access' |
        'permission_change' | 'mfa_disabled' | 'password_change';
  userId?: string;
  ipAddress: string;
  userAgent: string;
  timestamp: Date;
  metadata?: any;
}

async function logSecurityEvent(event: SecurityEvent) {
  await db.securityLog.create({ data: event });

  // Алерты при подозрительной активности
  if (event.type === 'failed_login') {
    const recentFailures = await countRecentFailedLogins(event.ipAddress);

    if (recentFailures > 10) {
      await sendAlert({
        type: 'POTENTIAL_BRUTE_FORCE',
        ip: event.ipAddress,
        failureCount: recentFailures
      });
    }
  }
}
```

#### Anomaly Detection

```typescript
// Детекция подозрительных паттернов
async function detectAnomalies(userId: string) {
  const user = await getUserWithActivity(userId);

  // 1. Новое устройство
  if (isNewDevice(user.devices, currentDevice)) {
    await sendEmailNotification(user.email, 'Вход с нового устройства');
  }

  // 2. Необычное местоположение
  if (isUnusualLocation(user.locations, currentLocation)) {
    await requireMFAVerification();
  }

  // 3. Необычное время активности
  if (isUnusualTime(user.activityPattern, currentTime)) {
    await increaseMonitoring(userId);
  }
}
```

---

## 🏥 СПЕЦИФИЧНЫЕ ДЛЯ HEALTHCARE МЕРЫ

### 1. Деидентификация для Аналитики

```typescript
// Анонимизация данных для ML/Analytics
function anonymizeForAnalytics(data: TestResult[]): AnonymizedData[] {
  return data.map(result => ({
    id: hash(result.id), // one-way hash
    ageGroup: getAgeGroup(result.age), // "10-12", "13-15" вместо точного возраста
    region: getRegion(result.location), // "Алматы" вместо точного адреса
    scores: result.scores,
    // Убираем всё, что может идентифицировать: имя, email, телефон
  }));
}
```

---

### 2. Audit Trails

**Полная история доступа к медицинским данным:**

```sql
CREATE TABLE audit_log (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  accessed_by UUID NOT NULL, -- кто обращался
  resource_type VARCHAR(50), -- 'test_result', 'consultation'
  resource_id UUID,
  action VARCHAR(20), -- 'view', 'edit', 'delete', 'export'
  ip_address VARCHAR(45),
  user_agent TEXT,
  timestamp TIMESTAMP DEFAULT NOW(),
  changes JSONB -- что изменилось (для edit)
);

-- Индекс для быстрого поиска
CREATE INDEX idx_audit_user ON audit_log(user_id);
CREATE INDEX idx_audit_accessed_by ON audit_log(accessed_by);
CREATE INDEX idx_audit_timestamp ON audit_log(timestamp);
```

---

### 3. Data Retention Policy

```yaml
Retention Policy:

  Test Results:
    Retention: 7 лет (согласно медицинским стандартам)
    After: Архивирование или анонимизация

  Consultation Recordings:
    Retention: 3 года
    After: Автоматическое удаление

  User Accounts:
    After deletion request: 30 дней grace period
    Then: Полное удаление (кроме audit logs)

  Audit Logs:
    Retention: 10 лет (для compliance)
    Never deleted

  Marketing Data:
    Retention: 2 года
    After: Автоматическое удаление
```

**Автоматизация:**
```typescript
// Cron job для удаления старых данных
import cron from 'node-cron';

// Каждый день в 02:00
cron.schedule('0 2 * * *', async () => {
  const threeYearsAgo = new Date();
  threeYearsAgo.setFullYear(threeYearsAgo.getFullYear() - 3);

  // Удаление старых видео консультаций
  await db.consultationRecording.deleteMany({
    where: {
      createdAt: { lt: threeYearsAgo }
    }
  });

  console.log('Old recordings deleted');
});
```

---

## 🚨 INCIDENT RESPONSE PLAN

### 1. Классификация Инцидентов

```yaml
Severity Levels:

  P0 - Critical:
    - Утечка медицинских данных
    - Компрометация системы администрирования
    - Полный downtime сервиса
    Response Time: Немедленно (24/7)

  P1 - High:
    - Попытка взлома
    - Частичная утечка данных
    - Критический баг в безопасности
    Response Time: 1 час

  P2 - Medium:
    - Подозрительная активность
    - Нарушение политики безопасности
    Response Time: 4 часа

  P3 - Low:
    - Минорные уязвимости
    Response Time: 24 часа
```

---

### 2. Процедура Реагирования

**Шаг 1: Обнаружение (Detection)**
- Автоматические алерты (Sentry, CloudWatch)
- Сообщения от пользователей
- Security scanning tools

**Шаг 2: Оценка (Assessment)**
```markdown
- [ ] Какие данные затронуты?
- [ ] Сколько пользователей затронуто?
- [ ] Как произошел инцидент?
- [ ] Продолжается ли атака?
```

**Шаг 3: Сдерживание (Containment)**
```markdown
- [ ] Изолировать зараженные системы
- [ ] Заблокировать атакующие IP
- [ ] Отозвать скомпрометированные ключи/токены
- [ ] Уведомить команду
```

**Шаг 4: Устранение (Eradication)**
```markdown
- [ ] Закрыть уязвимость
- [ ] Удалить вредоносный код
- [ ] Обновить пароли/ключи
```

**Шаг 5: Восстановление (Recovery)**
```markdown
- [ ] Восстановить из backup
- [ ] Verify integrity
- [ ] Постепенное возвращение в работу
```

**Шаг 6: Пост-анализ (Post-Incident Review)**
```markdown
- [ ] Документировать инцидент
- [ ] Root cause analysis
- [ ] Обновить процедуры
- [ ] Обучение команды
```

---

### 3. Уведомление об Утечке (Data Breach Notification)

**Согласно PDPL:**

```markdown
При утечке данных:

1. Уведомить регулятор (72 часа)
   - Контакт: [gov authority]
   - Форма: официальное письмо

2. Уведомить пользователей (немедленно)
   - Email всем затронутым пользователям
   - Публичное заявление на сайте

3. Документировать:
   - Что произошло
   - Какие данные затронуты
   - Сколько пользователей
   - Меры по устранению
   - Меры по предотвращению
```

**Шаблон уведомления:**
```
Тема: Важное уведомление о безопасности - Zharqyn Bala

Уважаемый пользователь,

Мы обнаружили инцидент безопасности, который мог затронуть ваши данные.

ЧТО ПРОИЗОШЛО:
[Описание инцидента]

КАКИЕ ДАННЫЕ ЗАТРОНУТЫ:
[Список данных]

ЧТО МЫ СДЕЛАЛИ:
[Меры по устранению]

ЧТО ВАМ НУЖНО СДЕЛАТЬ:
1. Сменить пароль
2. Включить двухфакторную аутентификацию
3. Проверить последнюю активность

Мы глубоко сожалеем о произошедшем.

С уважением,
Команда Zharqyn Bala
```

---

## 🛡️ SECURITY TESTING

### 1. Automated Security Scanning

```yaml
# GitHub Actions - Security Scan
name: Security Scan

on: [push, pull_request]

jobs:
  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      # Dependency scanning
      - name: Run npm audit
        run: npm audit --audit-level=moderate

      # SAST (Static Analysis)
      - name: Run Snyk
        uses: snyk/actions/node@master
        env:
          SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}

      # Secret scanning
      - name: GitGuardian scan
        uses: GitGuardian/ggshield-action@master

      # Code quality
      - name: SonarCloud Scan
        uses: SonarSource/sonarcloud-github-action@master
```

---

### 2. Manual Security Testing

**Регулярность:**
- Weekly: Automated scans
- Monthly: Manual code review
- Quarterly: Penetration testing
- Annually: Full security audit

**Penetration Testing:**
```markdown
Тестирование:
1. Authentication bypass
2. Authorization flaws
3. SQL Injection
4. XSS
5. CSRF
6. Session management
7. API security
8. File upload vulnerabilities
9. Business logic flaws
10. Infrastructure security

Инструменты:
- OWASP ZAP
- Burp Suite
- Metasploit
- Nmap
```

---

### 3. Bug Bounty Program (Будущее)

**После масштабирования:**

```yaml
Bug Bounty Program:

  Scope:
    - zharqynbala.kz
    - api.zharqynbala.kz
    - Mobile apps

  Out of Scope:
    - DDoS attacks
    - Social engineering
    - Physical attacks

  Rewards:
    Critical: $500-1000
    High: $200-500
    Medium: $50-200
    Low: $10-50

  Rules:
    - Do not access user data
    - Do not disrupt service
    - Report responsibly
    - Give us 90 days to fix
```

---

## ✅ SECURITY CHECKLIST

### Pre-Launch:
- [ ] HTTPS настроен (TLS 1.3)
- [ ] Все секреты в переменных окружения (не в коде!)
- [ ] Rate limiting включен
- [ ] CSRF защита включена
- [ ] XSS sanitization
- [ ] SQL injection защита (ORM)
- [ ] Шифрование чувствительных данных
- [ ] Политика паролей (min 8 символов, сложность)
- [ ] Password hashing (bcrypt, rounds ≥ 12)
- [ ] Session timeout (15 минут)
- [ ] Secure cookies (HttpOnly, Secure, SameSite)
- [ ] Security headers (CSP, HSTS, etc.)
- [ ] Error handling (не раскрывать stack traces)
- [ ] Logging (но не логировать пароли/токены!)
- [ ] Backup strategy
- [ ] Incident response plan
- [ ] Privacy Policy и Terms of Service
- [ ] PDPL compliance documentation

### Post-Launch:
- [ ] Мониторинг безопасности (Sentry)
- [ ] Regular dependency updates
- [ ] Security scan automation
- [ ] Penetration testing (quarterly)
- [ ] Team security training
- [ ] Bug bounty program (через год)

---

## 📚 ОБУЧЕНИЕ КОМАНДЫ

### Security Training для Разработчиков:

**Обязательные темы:**
1. OWASP Top 10
2. Secure coding practices
3. PDPL requirements
4. Incident response procedures
5. Password management (LastPass/1Password)

**Ресурсы:**
- [OWASP Top 10](https://owasp.org/Top10/)
- [Web Security Academy](https://portswigger.net/web-security)
- Курс на Udemy: "Web Security & Bug Bounty"

---

## 📞 КОНТАКТЫ БЕЗОПАСНОСТИ

**Security Team:**
- Email: security@zharqynbala.kz
- Экстренный: +7 XXX XXX XXXX
- PGP Key: [link to public key]

**Responsible Disclosure:**
Если вы обнаружили уязвимость, пожалуйста, сообщите нам:
1. Email: security@zharqynbala.kz (PGP encrypted)
2. Не публикуйте публично до фикса
3. Дайте нам 90 дней на исправление
4. Мы благодарны за ответственное раскрытие

---

**Помните:** Безопасность - это процесс, а не конечное состояние. Постоянное улучшение и бдительность!

**Последнее обновление:** 05.12.2025
**Следующий review:** Квартальный
