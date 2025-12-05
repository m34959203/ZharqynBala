# ⚡ ОПТИМИЗАЦИЯ И МАСШТАБИРОВАНИЕ

## 📋 ОБЗОР

Этот документ описывает стратегию масштабирования платформы **Zharqyn Bala** от MVP до enterprise-уровня с поддержкой 100,000+ пользователей.

---

## 🎯 ЭТАПЫ МАСШТАБИРОВАНИЯ

```
MVP (0-1k users)
  └── Оптимизация 1 (1k-10k users)
      └── Оптимизация 2 (10k-50k users)
          └── Enterprise Scale (50k-100k+ users)
```

---

## 📈 STAGE 1: MVP (0-1,000 пользователей)

### Архитектура:

```
┌─────────────┐
│   Client    │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│    CDN      │
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────────┐
│         Single Server               │
│  ┌──────────┐     ┌──────────┐    │
│  │ Next.js  │     │ NestJS   │    │
│  │ Frontend │◄────┤ Backend  │    │
│  └──────────┘     └────┬─────┘    │
│                        │           │
│                        ▼           │
│                 ┌──────────┐      │
│                 │PostgreSQL│      │
│                 └──────────┘      │
└─────────────────────────────────────┘
```

**Характеристики сервера:**
```yaml
Provider: Yandex Cloud / Timeweb
Instance: 2 vCPU, 4 GB RAM, 40 GB SSD
Cost: ~$30-50/мес

Database: PostgreSQL (на том же сервере)
Redis: На том же сервере
```

**Достаточно для:**
- 1,000 активных пользователей
- 50-100 req/sec
- 10GB данных

---

### Оптимизации на этом этапе:

#### 1. Database Indexing

```sql
-- Индексы на часто используемые поля
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_phone ON users(phone);

CREATE INDEX idx_tests_created_at ON test_sessions(created_at);
CREATE INDEX idx_tests_child_id ON test_sessions(child_id);
CREATE INDEX idx_tests_status ON test_sessions(status);

CREATE INDEX idx_consultations_date ON consultations(scheduled_at);
CREATE INDEX idx_consultations_psychologist ON consultations(psychologist_id);

CREATE INDEX idx_payments_user ON payments(user_id);
CREATE INDEX idx_payments_status ON payments(status);

-- Composite indices для частых запросов
CREATE INDEX idx_tests_child_status ON test_sessions(child_id, status);
```

---

#### 2. Query Optimization

```typescript
// ❌ ПЛОХО - N+1 query problem
async function getTestsWithResults(userId: string) {
  const tests = await db.testSession.findMany({
    where: { userId }
  });

  // Делает отдельный запрос для каждого теста!
  for (const test of tests) {
    test.result = await db.result.findUnique({
      where: { sessionId: test.id }
    });
  }

  return tests;
}

// ✅ ХОРОШО - single query с JOIN
async function getTestsWithResults(userId: string) {
  return await db.testSession.findMany({
    where: { userId },
    include: {
      result: true  // Один запрос с JOIN
    }
  });
}
```

---

#### 3. Frontend Optimization

**Code Splitting:**
```typescript
// Ленивая загрузка страниц
import { lazy, Suspense } from 'react';

const Dashboard = lazy(() => import('./pages/Dashboard'));
const Tests = lazy(() => import('./pages/Tests'));
const Consultations = lazy(() => import('./pages/Consultations'));

function App() {
  return (
    <Suspense fallback={<Loading />}>
      <Routes>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/tests" element={<Tests />} />
        <Route path="/consultations" element={<Consultations />} />
      </Routes>
    </Suspense>
  );
}
```

**Image Optimization:**
```typescript
// Next.js Image component
import Image from 'next/image';

function UserAvatar({ src }: { src: string }) {
  return (
    <Image
      src={src}
      alt="Avatar"
      width={100}
      height={100}
      loading="lazy"  // lazy loading
      placeholder="blur"  // blur-up effect
    />
  );
}
```

---

#### 4. Caching (базовый)

```typescript
// In-memory cache для часто запрашиваемых данных
import NodeCache from 'node-cache';

const cache = new NodeCache({
  stdTTL: 300, // 5 минут
  checkperiod: 60
});

async function getTests() {
  const cacheKey = 'tests:all';
  const cachedTests = cache.get(cacheKey);

  if (cachedTests) {
    return cachedTests;
  }

  const tests = await db.test.findMany();
  cache.set(cacheKey, tests);

  return tests;
}
```

---

## 📊 STAGE 2: OPTIMIZATION 1 (1k-10k пользователей)

### Архитектура:

```
┌─────────────┐
│   Client    │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ CDN/Nginx   │
└──────┬──────┘
       │
       ├───────────────────┐
       ▼                   ▼
┌──────────────┐    ┌──────────────┐
│  Frontend    │    │   Backend    │
│  Server 1    │    │   Server 1   │
│  (Next.js)   │    │   (NestJS)   │
└──────────────┘    └───────┬──────┘
                            │
              ┌─────────────┼─────────────┐
              ▼             ▼             ▼
       ┌──────────┐  ┌──────────┐ ┌──────────┐
       │PostgreSQL│  │  Redis   │ │    S3    │
       └──────────┘  └──────────┘ └──────────┘
```

**Изменения:**
- ✅ Раздельные серверы для Frontend и Backend
- ✅ Добавлен Redis для кэширования
- ✅ S3 для файлов (PDF отчеты, аватары)
- ✅ CDN для статики

**Стоимость:** ~$150-200/мес

---

### Оптимизации:

#### 1. Redis Caching

```typescript
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL);

// Cache aside pattern
async function getUserProfile(userId: string) {
  const cacheKey = `user:${userId}`;

  // 1. Проверяем cache
  const cached = await redis.get(cacheKey);
  if (cached) {
    return JSON.parse(cached);
  }

  // 2. Запрос к БД
  const user = await db.user.findUnique({
    where: { id: userId },
    include: { children: true }
  });

  // 3. Сохраняем в cache (5 минут)
  await redis.setex(cacheKey, 300, JSON.stringify(user));

  return user;
}

// Invalidate cache при обновлении
async function updateUserProfile(userId: string, data: any) {
  await db.user.update({
    where: { id: userId },
    data
  });

  // Удаляем из cache
  await redis.del(`user:${userId}`);
}
```

---

#### 2. Database Connection Pooling

```typescript
// Prisma pool configuration
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider        = "prisma-client-js"
  previewFeatures = ["metrics"]
}

// В коде
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  },
  log: ['query', 'error', 'warn'],
});

// Connection pool config в DATABASE_URL
// postgresql://user:password@host:5432/db?connection_limit=20&pool_timeout=10
```

---

#### 3. File Storage на S3

```typescript
import AWS from 'aws-sdk';

const s3 = new AWS.S3({
  endpoint: 'https://storage.yandexcloud.net',
  region: 'ru-central1',
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY,
    secretAccessKey: process.env.S3_SECRET_KEY
  }
});

async function uploadPDFReport(userId: string, buffer: Buffer) {
  const key = `reports/${userId}/${Date.now()}.pdf`;

  await s3.putObject({
    Bucket: 'zharqynbala-files',
    Key: key,
    Body: buffer,
    ContentType: 'application/pdf',
    ACL: 'private'
  }).promise();

  // Генерация signed URL (доступен 1 час)
  const url = s3.getSignedUrl('getObject', {
    Bucket: 'zharqynbala-files',
    Key: key,
    Expires: 3600 // 1 час
  });

  return url;
}
```

---

#### 4. Background Jobs

```typescript
import Bull from 'bull';

const reportQueue = new Bull('report-generation', {
  redis: process.env.REDIS_URL
});

// Добавление job в очередь
async function generateReportAsync(sessionId: string) {
  await reportQueue.add('generate', {
    sessionId
  }, {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000
    }
  });

  return { status: 'processing' };
}

// Worker для обработки jobs
reportQueue.process('generate', async (job) => {
  const { sessionId } = job.data;

  const result = await db.result.findUnique({
    where: { sessionId },
    include: { session: { include: { child: true } } }
  });

  const pdf = await generatePDF(result);
  const url = await uploadPDFReport(result.session.child.parent_id, pdf);

  await db.result.update({
    where: { id: result.id },
    data: { pdfUrl: url }
  });

  return { url };
});
```

---

## 🚀 STAGE 3: OPTIMIZATION 2 (10k-50k пользователей)

### Архитектура:

```
                   ┌─────────────┐
                   │  CloudFlare │
                   │     CDN     │
                   └──────┬──────┘
                          │
                          ▼
                  ┌───────────────┐
                  │ Load Balancer │
                  └───────┬───────┘
                          │
         ┌────────────────┼────────────────┐
         ▼                ▼                ▼
   ┌──────────┐    ┌──────────┐    ┌──────────┐
   │ Backend  │    │ Backend  │    │ Backend  │
   │ Server 1 │    │ Server 2 │    │ Server 3 │
   └────┬─────┘    └────┬─────┘    └────┬─────┘
        │               │               │
        └───────────────┼───────────────┘
                        │
        ┌───────────────┼───────────────┐
        ▼               ▼               ▼
  ┌──────────┐   ┌───────────┐   ┌──────────┐
  │PostgreSQL│   │Redis Cluster│   │    S3    │
  │(Primary +│   │  (3 nodes)  │   │          │
  │ Replica) │   └───────────┘   └──────────┘
  └──────────┘
```

**Изменения:**
- ✅ Горизонтальное масштабирование (3+ backend servers)
- ✅ Load Balancer
- ✅ PostgreSQL Read Replica
- ✅ Redis Cluster
- ✅ CDN (CloudFlare)

**Стоимость:** ~$500-800/мес

---

### Оптимизации:

#### 1. Database Read Replica

```typescript
// Prisma с read replica
import { PrismaClient } from '@prisma/client';

const prismaWrite = new PrismaClient({
  datasources: {
    db: { url: process.env.DATABASE_PRIMARY_URL }
  }
});

const prismaRead = new PrismaClient({
  datasources: {
    db: { url: process.env.DATABASE_REPLICA_URL }
  }
});

// Writes → Primary
async function createUser(data: CreateUserInput) {
  return await prismaWrite.user.create({ data });
}

// Reads → Replica
async function getUser(userId: string) {
  return await prismaRead.user.findUnique({
    where: { id: userId }
  });
}
```

---

#### 2. Advanced Caching Strategies

**Cache Warming:**
```typescript
// Предзагрузка популярных данных в cache
async function warmCache() {
  // Популярные тесты
  const popularTests = await db.test.findMany({
    where: { category: 'anxiety' },
    take: 10
  });

  for (const test of popularTests) {
    await redis.setex(
      `test:${test.id}`,
      3600,
      JSON.stringify(test)
    );
  }

  console.log('Cache warmed');
}

// Запускать при старте сервера
warmCache();
```

**Cache Stampede Prevention:**
```typescript
import { Mutex } from 'async-mutex';

const mutexes = new Map<string, Mutex>();

async function getCachedData(key: string, fetcher: () => Promise<any>) {
  // Проверяем cache
  const cached = await redis.get(key);
  if (cached) return JSON.parse(cached);

  // Получаем mutex для этого ключа
  if (!mutexes.has(key)) {
    mutexes.set(key, new Mutex());
  }
  const mutex = mutexes.get(key)!;

  // Lock - только один process будет делать fetch
  return await mutex.runExclusive(async () => {
    // Double-check после получения lock
    const cached = await redis.get(key);
    if (cached) return JSON.parse(cached);

    // Fetch data
    const data = await fetcher();

    // Save to cache
    await redis.setex(key, 300, JSON.stringify(data));

    return data;
  });
}
```

---

#### 3. Database Query Optimization

**Pagination:**
```typescript
// ❌ ПЛОХО - OFFSET pagination (медленно на больших объемах)
async function getTests(page: number, limit: number) {
  return await db.testSession.findMany({
    skip: page * limit,
    take: limit,
    orderBy: { createdAt: 'desc' }
  });
}

// ✅ ХОРОШО - Cursor pagination
async function getTests(cursor?: string, limit: number = 20) {
  return await db.testSession.findMany({
    take: limit,
    ...(cursor && {
      cursor: { id: cursor },
      skip: 1  // Skip cursor itself
    }),
    orderBy: { createdAt: 'desc' }
  });
}
```

**Aggregations:**
```sql
-- Материализованные представления для тяжелых аггрегаций
CREATE MATERIALIZED VIEW test_stats AS
SELECT
  test_id,
  COUNT(*) as total_completions,
  AVG(total_score) as avg_score,
  date_trunc('day', completed_at) as date
FROM test_sessions
WHERE status = 'completed'
GROUP BY test_id, date_trunc('day', completed_at);

-- Refresh каждый час
CREATE UNIQUE INDEX ON test_stats (test_id, date);
```

---

#### 4. API Rate Limiting (Advanced)

```typescript
import { RateLimiterRedis } from 'rate-limiter-flexible';

const rateLimiter = new RateLimiterRedis({
  storeClient: redis,
  points: 100, // Number of requests
  duration: 60, // Per 60 seconds
  blockDuration: 60, // Block for 60 seconds if exceeded
});

// Разные лимиты для разных эндпоинтов
const limitsPerEndpoint = {
  '/api/tests': 30,
  '/api/auth/login': 5,
  '/api/consultations': 20,
};

app.use(async (req, res, next) => {
  const endpoint = req.path;
  const limit = limitsPerEndpoint[endpoint] || 100;

  try {
    await rateLimiter.consume(req.ip, 1);
    next();
  } catch (error) {
    res.status(429).json({
      error: 'Too Many Requests',
      retryAfter: error.msBeforeNext / 1000
    });
  }
});
```

---

## 🏢 STAGE 4: ENTERPRISE SCALE (50k-100k+ пользователей)

### Архитектура:

```
                     ┌──────────────────┐
                     │   CloudFlare     │
                     │   CDN + DDoS     │
                     └────────┬─────────┘
                              │
                              ▼
                   ┌────────────────────┐
                   │  Load Balancer     │
                   │  (Auto-scaling)    │
                   └──────────┬─────────┘
                              │
              ┌───────────────┼───────────────┐
              ▼               ▼               ▼
        ┌──────────┐    ┌──────────┐   ┌──────────┐
        │ Backend  │    │ Backend  │   │  Backend │
        │ Service  │    │ Service  │   │  Service │
        │   Pool   │    │   Pool   │   │   Pool   │
        │ (5-10x)  │    │ (5-10x)  │   │ (5-10x)  │
        └────┬─────┘    └────┬─────┘   └────┬─────┘
             │               │               │
             └───────────────┼───────────────┘
                             │
         ┌───────────────────┼───────────────────┐
         │                   │                   │
         ▼                   ▼                   ▼
   ┌──────────┐      ┌─────────────┐     ┌──────────┐
   │PostgreSQL│      │Redis Cluster│     │Elasticsearch│
   │ Cluster  │      │  (6 nodes)  │     │  (search) │
   │(3 masters│      └─────────────┘     └──────────┘
   │ +replicas)│             │
   └──────────┘             ▼
        │           ┌──────────────┐
        │           │ Message Queue│
        │           │  (RabbitMQ)  │
        │           └──────────────┘
        │
        ▼
   ┌──────────────┐
   │ Microservices│
   │ - PDF Gen    │
   │ - ML Engine  │
   │ - Video Proc │
   └──────────────┘
```

**Изменения:**
- ✅ Microservices для тяжелых операций
- ✅ Message Queue (RabbitMQ/NATS)
- ✅ Elasticsearch для поиска
- ✅ PostgreSQL Cluster (3+ masters)
- ✅ Redis Cluster (6+ nodes)
- ✅ Kubernetes для оркестрации (опционально)

**Стоимость:** $2,000-5,000/мес

---

### Оптимизации:

#### 1. Microservices Architecture

**PDF Generation Service:**
```typescript
// Отдельный микросервис для генерации PDF
import express from 'express';
import puppeteer from 'puppeteer';

const app = express();

app.post('/generate-pdf', async (req, res) => {
  const { html, options } = req.body;

  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  await page.setContent(html);
  const pdf = await page.pdf(options);

  await browser.close();

  res.contentType('application/pdf');
  res.send(pdf);
});

app.listen(3001);
```

**Main API → PDF Service:**
```typescript
import axios from 'axios';

async function generateReport(resultId: string) {
  const result = await db.result.findUnique({
    where: { id: resultId },
    include: { session: { include: { child: true } } }
  });

  const html = renderReportTemplate(result);

  // Вызов микросервиса
  const response = await axios.post('http://pdf-service:3001/generate-pdf', {
    html,
    options: { format: 'A4' }
  });

  const pdfBuffer = response.data;
  const url = await uploadToS3(pdfBuffer);

  await db.result.update({
    where: { id: resultId },
    data: { pdfUrl: url }
  });
}
```

---

#### 2. Event-Driven Architecture

```typescript
// Message Queue для асинхронных задач
import amqp from 'amqplib';

const connection = await amqp.connect('amqp://localhost');
const channel = await connection.createChannel();

await channel.assertQueue('report-generation', { durable: true });

// Publisher (main API)
async function queueReportGeneration(sessionId: string) {
  channel.sendToQueue(
    'report-generation',
    Buffer.from(JSON.stringify({ sessionId })),
    { persistent: true }
  );
}

// Consumer (worker)
channel.consume('report-generation', async (msg) => {
  if (msg) {
    const { sessionId } = JSON.parse(msg.content.toString());

    try {
      await generateReport(sessionId);
      channel.ack(msg);
    } catch (error) {
      console.error(error);
      channel.nack(msg, false, true); // Requeue
    }
  }
});
```

---

#### 3. Database Sharding (для >100k users)

```typescript
// Sharding по userId
function getShardForUser(userId: string): number {
  const hash = hashCode(userId);
  return hash % NUMBER_OF_SHARDS;
}

function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

// Подключения к разным шардам
const shards = [
  new PrismaClient({ datasources: { db: { url: SHARD_0_URL } } }),
  new PrismaClient({ datasources: { db: { url: SHARD_1_URL } } }),
  new PrismaClient({ datasources: { db: { url: SHARD_2_URL } } }),
  new PrismaClient({ datasources: { db: { url: SHARD_3_URL } } }),
];

async function getUserData(userId: string) {
  const shardIndex = getShardForUser(userId);
  const prisma = shards[shardIndex];

  return await prisma.user.findUnique({
    where: { id: userId }
  });
}
```

---

#### 4. Full-Text Search (Elasticsearch)

```typescript
import { Client } from '@elastic/elasticsearch';

const esClient = new Client({
  node: 'http://localhost:9200'
});

// Индексация тестов
async function indexTest(test: Test) {
  await esClient.index({
    index: 'tests',
    id: test.id,
    document: {
      title_ru: test.titleRu,
      title_kz: test.titleKz,
      description_ru: test.descriptionRu,
      description_kz: test.descriptionKz,
      category: test.category,
      tags: test.tags
    }
  });
}

// Поиск
async function searchTests(query: string, language: 'ru' | 'kz') {
  const result = await esClient.search({
    index: 'tests',
    body: {
      query: {
        multi_match: {
          query,
          fields: [`title_${language}^2`, `description_${language}`],
          fuzziness: 'AUTO'
        }
      }
    }
  });

  return result.hits.hits.map(hit => hit._source);
}
```

---

## 📊 МОНИТОРИНГ И МЕТРИКИ

### Что отслеживать:

```typescript
// Application Metrics
interface Metrics {
  // Performance
  responseTime: {
    p50: number;
    p95: number;
    p99: number;
  };

  // Availability
  uptime: number;
  errorRate: number;

  // Traffic
  requestsPerSecond: number;
  activeUsers: number;

  // Database
  dbConnectionPool: {
    active: number;
    idle: number;
    waiting: number;
  };
  dbQueryTime: number;

  // Cache
  cacheHitRate: number;
  cacheSize: number;

  // Business
  testsCompleted: number;
  consultationsBooked: number;
  revenue: number;
}
```

**Инструменты:**
- **Prometheus** - метрики
- **Grafana** - визуализация
- **Sentry** - error tracking
- **DataDog** / **New Relic** - APM (платные, но мощные)

---

### Алерты:

```yaml
Alerts:
  - name: High Error Rate
    condition: error_rate > 5%
    severity: critical
    action: Page on-call engineer

  - name: Slow Response Time
    condition: p95_response_time > 2000ms
    severity: warning
    action: Notify team

  - name: Database Connection Pool Full
    condition: db_pool_usage > 90%
    severity: critical
    action: Scale database

  - name: Cache Hit Rate Low
    condition: cache_hit_rate < 70%
    severity: warning
    action: Investigate cache strategy
```

---

## 💰 СТОИМОСТЬ ИНФРАСТРУКТУРЫ

| Stage | Users | Cost/Month | Specs |
|-------|-------|------------|-------|
| MVP | 0-1k | $30-50 | 1 server (2 vCPU, 4 GB RAM) |
| Opt 1 | 1k-10k | $150-200 | 2 servers + Redis + S3 |
| Opt 2 | 10k-50k | $500-800 | 3+ servers, DB replica, Redis cluster |
| Enterprise | 50k-100k+ | $2k-5k | Microservices, K8s, advanced setup |

**Оптимизация стоимости:**
- Reserved instances (скидка 30-50%)
- Spot instances для batch jobs
- Автоматическое масштабирование (scale down ночью)
- CDN для статики (дешевле bandwidth)

---

## ✅ PERFORMANCE CHECKLIST

### Backend:
- [ ] Database indices на все WHERE/JOIN поля
- [ ] N+1 query проблемы устранены
- [ ] Connection pooling настроен
- [ ] Redis caching для частых запросов
- [ ] Background jobs для тяжелых операций
- [ ] API rate limiting
- [ ] Compression (gzip/brotli)
- [ ] Keep-alive connections

### Frontend:
- [ ] Code splitting
- [ ] Lazy loading
- [ ] Image optimization (WebP, lazy load)
- [ ] Минификация CSS/JS
- [ ] Tree shaking
- [ ] CDN для статики
- [ ] Service Worker (offline support)
- [ ] Prefetching критичных ресурсов

### Database:
- [ ] EXPLAIN ANALYZE для медленных запросов
- [ ] Vacuum и analyze регулярно
- [ ] Partitioning больших таблиц (опционально)
- [ ] Read replicas для read-heavy workload
- [ ] Connection pooling (PgBouncer)

---

## 🎯 ЦЕЛИ ПО ПРОИЗВОДИТЕЛЬНОСТИ

### MVP (Stage 1):
- Response time (p95): < 500ms
- Availability: 99.5%
- Time to First Byte: < 200ms
- Page Load Time: < 2s

### Optimized (Stage 2-3):
- Response time (p95): < 200ms
- Availability: 99.9%
- TTFB: < 100ms
- Page Load Time: < 1s

### Enterprise (Stage 4):
- Response time (p95): < 100ms
- Availability: 99.95%
- TTFB: < 50ms
- Page Load Time: < 500ms

---

## 📚 ДОПОЛНИТЕЛЬНЫЕ РЕСУРСЫ

- [High Performance Browser Networking](https://hpbn.co/)
- [Designing Data-Intensive Applications](https://dataintensive.net/)
- [System Design Primer](https://github.com/donnemartin/system-design-primer)
- [Database Internals](https://www.databass.dev/)

---

**Ключевой принцип:** Не оптимизируйте преждевременно! Начните с простой архитектуры, измеряйте, и масштабируйте по мере необходимости.

**Последнее обновление:** 05.12.2025
