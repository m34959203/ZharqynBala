import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class SentryService implements OnModuleInit {
  private readonly logger = new Logger(SentryService.name);
  private initialized = false;

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit() {
    const dsn = this.configService.get<string>('SENTRY_DSN');
    if (!dsn) {
      this.logger.log('Sentry DSN not configured, skipping initialization');
      return;
    }

    try {
      const Sentry = await import('@sentry/node');
      Sentry.init({
        dsn,
        environment: this.configService.get('NODE_ENV') || 'development',
        tracesSampleRate: this.configService.get('NODE_ENV') === 'production' ? 0.2 : 1.0,
        beforeSend(event) {
          // Don't send events in test environment
          if (process.env.NODE_ENV === 'test') return null;
          return event;
        },
      });
      this.initialized = true;
      this.logger.log('Sentry initialized successfully');
    } catch (error) {
      this.logger.warn('Failed to initialize Sentry:', error);
    }
  }

  async captureException(error: Error, context?: Record<string, any>) {
    if (!this.initialized) return;
    try {
      const Sentry = await import('@sentry/node');
      if (context) {
        Sentry.withScope((scope) => {
          for (const [key, value] of Object.entries(context)) {
            scope.setExtra(key, value);
          }
          Sentry.captureException(error);
        });
      } else {
        Sentry.captureException(error);
      }
    } catch {}
  }

  async captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info') {
    if (!this.initialized) return;
    try {
      const Sentry = await import('@sentry/node');
      Sentry.captureMessage(message, level);
    } catch {}
  }
}
