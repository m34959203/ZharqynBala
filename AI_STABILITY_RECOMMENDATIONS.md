# Рекомендации по стабильности AI сервисов

## Выявленные проблемы

### 1. Rate Limiting (Groq)
```
Error: Rate limit reached for model `llama-3.3-70b-versatile`
Limit 12000 TPM, Used 9505, Requested 3336
```

### 2. Устаревшие модели
- `llama-3.1-70b-versatile` - **DECOMMISSIONED**
- `gemma2-9b-it` - **DECOMMISSIONED**

---

## Решения

### 1. Обновить список fallback моделей

```typescript
// БЫЛО (устаревшее):
const GROQ_MODELS = [
  'llama-3.3-70b-versatile',  // primary
  'llama-3.1-70b-versatile',  // ❌ decommissioned
  'gemma2-9b-it'              // ❌ decommissioned
];

// ДОЛЖНО БЫТЬ:
const GROQ_MODELS = [
  'llama-3.3-70b-versatile',       // primary (70B)
  'llama-3.2-90b-text-preview',    // fallback 1 (90B)
  'llama-3.2-11b-text-preview',    // fallback 2 (11B, быстрее)
  'mixtral-8x7b-32768',            // fallback 3 (Mixtral)
  'llama-guard-3-8b'               // fallback 4 (safety)
];
```

### 2. Улучшить Rate Limiting логику

```typescript
// ai-service.ts или подобный файл

interface RateLimitConfig {
  provider: string;
  tokensPerMinute: number;
  requestsPerMinute: number;
  currentTokens: number;
  resetTime: number;
}

class SmartRateLimiter {
  private limits: Map<string, RateLimitConfig> = new Map();

  constructor() {
    // Groq Free tier limits
    this.limits.set('groq', {
      provider: 'groq',
      tokensPerMinute: 12000,  // TPM limit
      requestsPerMinute: 30,   // RPM limit
      currentTokens: 0,
      resetTime: Date.now()
    });

    // OpenRouter limits (более щедрые)
    this.limits.set('openrouter', {
      provider: 'openrouter',
      tokensPerMinute: 100000,
      requestsPerMinute: 200,
      currentTokens: 0,
      resetTime: Date.now()
    });
  }

  async waitForCapacity(provider: string, estimatedTokens: number): Promise<void> {
    const config = this.limits.get(provider);
    if (!config) return;

    // Reset если прошла минута
    if (Date.now() - config.resetTime > 60000) {
      config.currentTokens = 0;
      config.resetTime = Date.now();
    }

    // Если не хватает capacity - ждём
    if (config.currentTokens + estimatedTokens > config.tokensPerMinute) {
      const waitTime = 60000 - (Date.now() - config.resetTime) + 1000;
      console.log(`Rate limiting (${provider}): waiting ${waitTime}ms...`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
      config.currentTokens = 0;
      config.resetTime = Date.now();
    }

    config.currentTokens += estimatedTokens;
  }

  // Предварительная оценка токенов
  estimateTokens(text: string): number {
    // ~4 символа = 1 токен для кириллицы
    return Math.ceil(text.length / 3);
  }
}
```

### 3. Multi-Provider Strategy

```typescript
// Стратегия выбора провайдера

interface AIProvider {
  name: string;
  priority: number;
  isAvailable: boolean;
  lastError?: Date;
  consecutiveFailures: number;
}

class MultiProviderAI {
  private providers: AIProvider[] = [
    { name: 'groq', priority: 1, isAvailable: true, consecutiveFailures: 0 },
    { name: 'openrouter', priority: 2, isAvailable: true, consecutiveFailures: 0 },
    { name: 'anthropic', priority: 3, isAvailable: true, consecutiveFailures: 0 },
    { name: 'openai', priority: 4, isAvailable: true, consecutiveFailures: 0 }
  ];

  async request(prompt: string, task: string): Promise<string> {
    // Сортируем по приоритету и доступности
    const available = this.providers
      .filter(p => p.isAvailable)
      .sort((a, b) => a.priority - b.priority);

    for (const provider of available) {
      try {
        const result = await this.callProvider(provider.name, prompt, task);
        provider.consecutiveFailures = 0;
        return result;
      } catch (error) {
        provider.consecutiveFailures++;

        // После 3 неудач - временно отключаем на 5 минут
        if (provider.consecutiveFailures >= 3) {
          provider.isAvailable = false;
          provider.lastError = new Date();

          // Авто-восстановление через 5 минут
          setTimeout(() => {
            provider.isAvailable = true;
            provider.consecutiveFailures = 0;
          }, 5 * 60 * 1000);
        }

        console.error(`Provider ${provider.name} failed:`, error.message);
        continue;
      }
    }

    throw new Error('All AI providers unavailable');
  }

  private async callProvider(name: string, prompt: string, task: string): Promise<string> {
    switch (name) {
      case 'groq':
        return this.callGroq(prompt, task);
      case 'openrouter':
        return this.callOpenRouter(prompt, task);
      case 'anthropic':
        return this.callAnthropic(prompt, task);
      default:
        throw new Error(`Unknown provider: ${name}`);
    }
  }
}
```

### 4. Request Batching

```typescript
// Группировка запросов для экономии токенов

class RequestBatcher {
  private queue: Array<{
    prompt: string;
    resolve: (result: string) => void;
    reject: (error: Error) => void;
  }> = [];

  private batchTimeout: NodeJS.Timeout | null = null;
  private readonly BATCH_DELAY = 500; // ms
  private readonly MAX_BATCH_SIZE = 5;

  async addRequest(prompt: string): Promise<string> {
    return new Promise((resolve, reject) => {
      this.queue.push({ prompt, resolve, reject });

      if (this.queue.length >= this.MAX_BATCH_SIZE) {
        this.processBatch();
      } else if (!this.batchTimeout) {
        this.batchTimeout = setTimeout(() => this.processBatch(), this.BATCH_DELAY);
      }
    });
  }

  private async processBatch() {
    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout);
      this.batchTimeout = null;
    }

    const batch = this.queue.splice(0, this.MAX_BATCH_SIZE);
    if (batch.length === 0) return;

    // Объединяем промпты в один запрос
    const combinedPrompt = batch.map((item, i) =>
      `[REQUEST ${i + 1}]:\n${item.prompt}`
    ).join('\n\n---\n\n');

    try {
      const result = await this.ai.request(combinedPrompt, 'batch');

      // Парсим ответы и распределяем по запросам
      const responses = this.parseResponses(result, batch.length);
      batch.forEach((item, i) => {
        item.resolve(responses[i] || 'No response');
      });
    } catch (error) {
      batch.forEach(item => item.reject(error));
    }
  }
}
```

### 5. Caching Strategy

```typescript
// Кэширование для повторяющихся запросов

import { createHash } from 'crypto';

class AICache {
  private cache: Map<string, { result: string; timestamp: number }> = new Map();
  private readonly TTL = 60 * 60 * 1000; // 1 час

  private getKey(prompt: string, task: string): string {
    return createHash('md5')
      .update(`${task}:${prompt}`)
      .digest('hex');
  }

  get(prompt: string, task: string): string | null {
    const key = this.getKey(prompt, task);
    const cached = this.cache.get(key);

    if (cached && Date.now() - cached.timestamp < this.TTL) {
      console.log('Cache hit for AI request');
      return cached.result;
    }

    return null;
  }

  set(prompt: string, task: string, result: string): void {
    const key = this.getKey(prompt, task);
    this.cache.set(key, { result, timestamp: Date.now() });

    // Очистка старых записей
    this.cleanup();
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, value] of this.cache.entries()) {
      if (now - value.timestamp > this.TTL) {
        this.cache.delete(key);
      }
    }
  }
}
```

### 6. Graceful Degradation

```typescript
// Упрощённая обработка при недоступности AI

async function processWithFallback(text: string, task: string): Promise<ProcessResult> {
  try {
    // Попытка использовать AI
    return await aiService.process(text, task);
  } catch (error) {
    console.warn('AI unavailable, using fallback:', error.message);

    // Fallback логика без AI
    switch (task) {
      case 'spelling':
        // Базовая проверка орфографии через словарь
        return {
          result: text,
          corrected: false,
          note: 'AI недоступен, проверка не выполнена'
        };

      case 'section':
        // Определение секции по ключевым словам
        return detectSectionByKeywords(text);

      case 'batch':
        // Обработка без AI анализа
        return {
          result: text,
          analyzed: false,
          note: 'Анализ отложен до восстановления AI'
        };

      default:
        return { result: text, processed: false };
    }
  }
}
```

---

## Конфигурация для продакшена

```typescript
// config/ai.config.ts

export const AI_CONFIG = {
  // Провайдеры в порядке приоритета
  providers: {
    primary: {
      name: 'groq',
      models: [
        'llama-3.3-70b-versatile',
        'llama-3.2-90b-text-preview',
        'mixtral-8x7b-32768'
      ],
      rateLimits: {
        tpm: 12000,
        rpm: 30
      }
    },
    fallback: {
      name: 'openrouter',
      models: [
        'tngtech/deepseek-r1t2-chimera:free',
        'meta-llama/llama-3.2-3b-instruct:free',
        'google/gemma-2-9b-it:free'
      ],
      rateLimits: {
        tpm: 100000,
        rpm: 200
      }
    },
    premium: {
      name: 'anthropic',
      models: ['claude-sonnet-4-20250514'],
      rateLimits: {
        tpm: 100000,
        rpm: 1000
      }
    }
  },

  // Стратегии
  retryConfig: {
    maxRetries: 3,
    baseDelay: 1000,
    maxDelay: 30000,
    backoffMultiplier: 2
  },

  // Кэширование
  cache: {
    enabled: true,
    ttl: 3600000, // 1 час
    maxSize: 1000
  },

  // Batching
  batch: {
    enabled: true,
    maxSize: 5,
    delayMs: 500
  }
};
```

---

## Мониторинг

```typescript
// Метрики для отслеживания

interface AIMetrics {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  cacheHits: number;
  averageLatency: number;
  providerUsage: Record<string, number>;
  rateLimitHits: number;
}

class AIMonitor {
  private metrics: AIMetrics = {
    totalRequests: 0,
    successfulRequests: 0,
    failedRequests: 0,
    cacheHits: 0,
    averageLatency: 0,
    providerUsage: {},
    rateLimitHits: 0
  };

  recordRequest(provider: string, success: boolean, latency: number): void {
    this.metrics.totalRequests++;

    if (success) {
      this.metrics.successfulRequests++;
    } else {
      this.metrics.failedRequests++;
    }

    this.metrics.providerUsage[provider] =
      (this.metrics.providerUsage[provider] || 0) + 1;

    // Running average
    this.metrics.averageLatency =
      (this.metrics.averageLatency * (this.metrics.totalRequests - 1) + latency)
      / this.metrics.totalRequests;
  }

  recordRateLimit(): void {
    this.metrics.rateLimitHits++;
  }

  recordCacheHit(): void {
    this.metrics.cacheHits++;
  }

  getStats(): AIMetrics & { successRate: number; cacheRate: number } {
    return {
      ...this.metrics,
      successRate: this.metrics.successfulRequests / this.metrics.totalRequests,
      cacheRate: this.metrics.cacheHits / this.metrics.totalRequests
    };
  }
}
```

---

## Рекомендации по апгрейду

| Проблема | Текущее решение | Рекомендация |
|----------|-----------------|--------------|
| Rate Limit Groq | Ожидание | Апгрейд до Dev Tier ($100/мес) |
| Устаревшие модели | Fallback | Обновить список моделей |
| Один провайдер | Переключение | Multi-provider стратегия |
| Нет кэширования | - | Добавить Redis/in-memory cache |
| Нет мониторинга | Логи | Добавить метрики и алерты |

---

*Документ создан: 26.12.2025*
