import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class SentryService implements OnModuleInit {
  private readonly logger = new Logger(SentryService.name);
  private sentry: any;

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit() {
    const dsn = this.configService.get('SENTRY_DSN');
    const environment = this.configService.get('NODE_ENV') || 'development';

    if (!dsn) {
      this.logger.warn('Sentry DSN not configured, error tracking disabled');
      return;
    }

    try {
      // Dynamic import to avoid build error if @sentry/node is not installed
      // @ts-ignore - Module might not be installed
      this.sentry = await import('@sentry/node').catch(() => null);

      if (!this.sentry) {
        this.logger.warn('Sentry package not installed, error tracking disabled');
        return;
      }

      this.sentry.init({
        dsn,
        environment,
        tracesSampleRate: environment === 'production' ? 0.1 : 1.0,
        profilesSampleRate: 0.1,
        integrations: [
          new this.sentry.Integrations.Http({ tracing: true }),
        ],
        beforeSend(event: any) {
          // Filter out sensitive data
          if (event.request?.headers) {
            delete event.request.headers.authorization;
            delete event.request.headers.cookie;
          }
          return event;
        },
      });

      this.logger.log('Sentry initialized successfully');
    } catch (error) {
      this.logger.error(`Failed to initialize Sentry: ${error.message}`);
    }
  }

  captureException(exception: Error, context?: Record<string, any>): void {
    if (!this.sentry) return;

    this.sentry.captureException(exception, {
      extra: context,
    });
  }

  captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info'): void {
    if (!this.sentry) return;

    this.sentry.captureMessage(message, level);
  }

  setUser(user: { id: string; email?: string; name?: string }): void {
    if (!this.sentry) return;

    this.sentry.setUser(user);
  }

  clearUser(): void {
    if (!this.sentry) return;

    this.sentry.setUser(null);
  }

  addBreadcrumb(breadcrumb: {
    category: string;
    message: string;
    level?: 'debug' | 'info' | 'warning' | 'error';
    data?: Record<string, any>;
  }): void {
    if (!this.sentry) return;

    this.sentry.addBreadcrumb(breadcrumb);
  }
}
