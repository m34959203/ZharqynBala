import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { PrismaService } from '../prisma/prisma.service';
import { MetricsService } from './metrics.service';

interface HealthCheck {
  status: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: string;
  version: string;
  uptime: number;
  checks: {
    database: { status: string; latencyMs?: number };
    memory: { status: string; usedMb: number; totalMb: number };
    disk?: { status: string; usedPercent: number };
  };
}

@ApiTags('Health')
@Controller('health')
export class HealthController {
  private readonly startTime = Date.now();

  constructor(
    private readonly prisma: PrismaService,
    private readonly metrics: MetricsService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Health check endpoint' })
  async check(): Promise<HealthCheck> {
    const dbCheck = await this.checkDatabase();
    const memoryCheck = this.checkMemory();

    const status =
      dbCheck.status === 'healthy' && memoryCheck.status === 'healthy'
        ? 'healthy'
        : dbCheck.status === 'unhealthy' || memoryCheck.status === 'unhealthy'
          ? 'unhealthy'
          : 'degraded';

    return {
      status,
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      uptime: Math.floor((Date.now() - this.startTime) / 1000),
      checks: {
        database: dbCheck,
        memory: memoryCheck,
      },
    };
  }

  @Get('ready')
  @ApiOperation({ summary: 'Readiness probe' })
  async ready(): Promise<{ ready: boolean }> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return { ready: true };
    } catch {
      return { ready: false };
    }
  }

  @Get('live')
  @ApiOperation({ summary: 'Liveness probe' })
  live(): { alive: boolean } {
    return { alive: true };
  }

  @Get('metrics')
  @ApiOperation({ summary: 'Prometheus metrics' })
  getMetrics(): string {
    return this.metrics.getPrometheusMetrics();
  }

  @Get('metrics/json')
  @ApiOperation({ summary: 'Metrics as JSON' })
  getMetricsJson(): Record<string, any> {
    return this.metrics.getMetricsJson();
  }

  private async checkDatabase(): Promise<{ status: string; latencyMs?: number }> {
    try {
      const start = Date.now();
      await this.prisma.$queryRaw`SELECT 1`;
      const latencyMs = Date.now() - start;

      this.metrics.recordDatabaseQuery('health_check', 'system', latencyMs);

      return {
        status: latencyMs < 1000 ? 'healthy' : 'degraded',
        latencyMs,
      };
    } catch (error) {
      return { status: 'unhealthy' };
    }
  }

  private checkMemory(): { status: string; usedMb: number; totalMb: number } {
    const used = process.memoryUsage();
    const usedMb = Math.round(used.heapUsed / 1024 / 1024);
    const totalMb = Math.round(used.heapTotal / 1024 / 1024);
    const usedPercent = (usedMb / totalMb) * 100;

    this.metrics.setGauge('memory_used_mb', usedMb);
    this.metrics.setGauge('memory_total_mb', totalMb);

    return {
      status: usedPercent < 90 ? 'healthy' : usedPercent < 95 ? 'degraded' : 'unhealthy',
      usedMb,
      totalMb,
    };
  }
}
