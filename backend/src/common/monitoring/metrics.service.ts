import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface Metric {
  name: string;
  value: number;
  labels?: Record<string, string>;
  timestamp: Date;
}

interface MetricSummary {
  count: number;
  sum: number;
  min: number;
  max: number;
  avg: number;
}

@Injectable()
export class MetricsService implements OnModuleInit {
  private metrics: Map<string, Metric[]> = new Map();
  private counters: Map<string, number> = new Map();
  private gauges: Map<string, number> = new Map();
  private histograms: Map<string, number[]> = new Map();

  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    // Start periodic metrics cleanup (keep last hour)
    setInterval(() => this.cleanup(), 60 * 1000);
  }

  // Counter operations
  incrementCounter(name: string, value: number = 1, labels?: Record<string, string>): void {
    const key = this.getKey(name, labels);
    const current = this.counters.get(key) || 0;
    this.counters.set(key, current + value);
    this.record(name, current + value, labels);
  }

  getCounter(name: string, labels?: Record<string, string>): number {
    return this.counters.get(this.getKey(name, labels)) || 0;
  }

  // Gauge operations
  setGauge(name: string, value: number, labels?: Record<string, string>): void {
    const key = this.getKey(name, labels);
    this.gauges.set(key, value);
    this.record(name, value, labels);
  }

  getGauge(name: string, labels?: Record<string, string>): number {
    return this.gauges.get(this.getKey(name, labels)) || 0;
  }

  // Histogram operations
  observeHistogram(name: string, value: number, labels?: Record<string, string>): void {
    const key = this.getKey(name, labels);
    const values = this.histograms.get(key) || [];
    values.push(value);
    this.histograms.set(key, values);
    this.record(name, value, labels);
  }

  getHistogramSummary(name: string, labels?: Record<string, string>): MetricSummary | null {
    const key = this.getKey(name, labels);
    const values = this.histograms.get(key);

    if (!values || values.length === 0) return null;

    const sorted = [...values].sort((a, b) => a - b);
    return {
      count: values.length,
      sum: values.reduce((a, b) => a + b, 0),
      min: sorted[0],
      max: sorted[sorted.length - 1],
      avg: values.reduce((a, b) => a + b, 0) / values.length,
    };
  }

  // HTTP request metrics
  recordHttpRequest(
    method: string,
    path: string,
    statusCode: number,
    durationMs: number,
  ): void {
    this.incrementCounter('http_requests_total', 1, { method, path, status: String(statusCode) });
    this.observeHistogram('http_request_duration_ms', durationMs, { method, path });
  }

  // Database metrics
  recordDatabaseQuery(operation: string, table: string, durationMs: number): void {
    this.incrementCounter('database_queries_total', 1, { operation, table });
    this.observeHistogram('database_query_duration_ms', durationMs, { operation, table });
  }

  // Business metrics
  recordTestCompletion(testId: string, childAge: number): void {
    this.incrementCounter('tests_completed_total', 1, { testId });
    this.observeHistogram('test_child_age', childAge);
  }

  recordPayment(amount: number, status: string): void {
    this.incrementCounter('payments_total', 1, { status });
    if (status === 'completed') {
      this.incrementCounter('revenue_total_kzt', amount);
    }
  }

  recordUserRegistration(): void {
    this.incrementCounter('user_registrations_total');
  }

  recordActiveUsers(count: number): void {
    this.setGauge('active_users', count);
  }

  // Get all metrics in Prometheus format
  getPrometheusMetrics(): string {
    const lines: string[] = [];

    // Counters
    this.counters.forEach((value, key) => {
      lines.push(`# TYPE ${key.split('{')[0]} counter`);
      lines.push(`${key} ${value}`);
    });

    // Gauges
    this.gauges.forEach((value, key) => {
      lines.push(`# TYPE ${key.split('{')[0]} gauge`);
      lines.push(`${key} ${value}`);
    });

    // Histogram summaries
    this.histograms.forEach((values, key) => {
      if (values.length === 0) return;

      const sorted = [...values].sort((a, b) => a - b);
      const sum = values.reduce((a, b) => a + b, 0);
      const name = key.split('{')[0];
      const labels = key.includes('{') ? key.slice(key.indexOf('{')) : '';

      lines.push(`# TYPE ${name} histogram`);
      lines.push(`${name}_count${labels} ${values.length}`);
      lines.push(`${name}_sum${labels} ${sum}`);

      // Quantiles
      const p50 = sorted[Math.floor(values.length * 0.5)];
      const p90 = sorted[Math.floor(values.length * 0.9)];
      const p99 = sorted[Math.floor(values.length * 0.99)];

      lines.push(`${name}{quantile="0.5"${labels ? ',' + labels.slice(1) : '}'} ${p50}`);
      lines.push(`${name}{quantile="0.9"${labels ? ',' + labels.slice(1) : '}'} ${p90}`);
      lines.push(`${name}{quantile="0.99"${labels ? ',' + labels.slice(1) : '}'} ${p99}`);
    });

    return lines.join('\n');
  }

  // Get metrics as JSON for dashboard
  getMetricsJson(): Record<string, any> {
    const result: Record<string, any> = {
      counters: {},
      gauges: {},
      histograms: {},
    };

    this.counters.forEach((value, key) => {
      result.counters[key] = value;
    });

    this.gauges.forEach((value, key) => {
      result.gauges[key] = value;
    });

    this.histograms.forEach((values, key) => {
      result.histograms[key] = this.getHistogramSummary(key);
    });

    return result;
  }

  private record(name: string, value: number, labels?: Record<string, string>): void {
    const key = this.getKey(name, labels);
    const existing = this.metrics.get(key) || [];
    existing.push({ name, value, labels, timestamp: new Date() });
    this.metrics.set(key, existing);
  }

  private getKey(name: string, labels?: Record<string, string>): string {
    if (!labels || Object.keys(labels).length === 0) {
      return name;
    }

    const labelStr = Object.entries(labels)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}="${v}"`)
      .join(',');

    return `${name}{${labelStr}}`;
  }

  private cleanup(): void {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

    this.metrics.forEach((metrics, key) => {
      const filtered = metrics.filter((m) => m.timestamp > oneHourAgo);
      if (filtered.length === 0) {
        this.metrics.delete(key);
      } else {
        this.metrics.set(key, filtered);
      }
    });

    // Keep histogram values limited
    this.histograms.forEach((values, key) => {
      if (values.length > 10000) {
        this.histograms.set(key, values.slice(-5000));
      }
    });
  }
}
