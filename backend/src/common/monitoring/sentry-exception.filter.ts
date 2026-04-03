import { Catch, ArgumentsHost, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';
import { SentryService } from './sentry.service';

@Catch()
export class SentryExceptionFilter extends BaseExceptionFilter {
  private readonly logger = new Logger(SentryExceptionFilter.name);

  constructor(private readonly sentryService: SentryService) {
    super();
  }

  catch(exception: unknown, host: ArgumentsHost) {
    const status = exception instanceof HttpException
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;

    // Only report server errors to Sentry (5xx), not client errors (4xx)
    if (status >= 500 && exception instanceof Error) {
      const ctx = host.switchToHttp();
      const request = ctx.getRequest();
      this.sentryService.captureException(exception, {
        url: request.url,
        method: request.method,
        userId: request.user?.id,
        statusCode: status,
      });
    }

    super.catch(exception, host);
  }
}
