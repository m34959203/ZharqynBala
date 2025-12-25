import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SentryService } from './sentry.config';
import { LoggerService } from './logger.service';
import { MetricsService } from './metrics.service';
import { HealthController } from './health.controller';

@Global()
@Module({
  imports: [ConfigModule],
  controllers: [HealthController],
  providers: [SentryService, LoggerService, MetricsService],
  exports: [SentryService, LoggerService, MetricsService],
})
export class MonitoringModule {}
