import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';

interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
}

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

@Injectable()
export class RateLimitGuard implements CanActivate {
  private readonly store = new Map<string, RateLimitEntry>();
  private readonly defaultConfig: RateLimitConfig;

  constructor(
    private readonly reflector: Reflector,
    private readonly configService: ConfigService,
  ) {
    this.defaultConfig = {
      windowMs: 60 * 1000, // 1 minute
      maxRequests: parseInt(this.configService.get('RATE_LIMIT_MAX') || '100', 10),
    };

    // Cleanup expired entries every minute
    setInterval(() => this.cleanup(), 60 * 1000);
  }

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const config = this.getConfig(context);
    const key = this.getKey(request);

    const now = Date.now();
    const entry = this.store.get(key);

    if (!entry || now > entry.resetAt) {
      this.store.set(key, {
        count: 1,
        resetAt: now + config.windowMs,
      });
      this.setHeaders(context, config, 1);
      return true;
    }

    entry.count++;

    if (entry.count > config.maxRequests) {
      const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
      this.setHeaders(context, config, entry.count, retryAfter);

      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          message: 'Слишком много запросов. Попробуйте позже.',
          retryAfter,
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    this.setHeaders(context, config, entry.count);
    return true;
  }

  private getKey(request: any): string {
    // Use user ID if authenticated, otherwise use IP
    const userId = request.user?.id;
    const ip = request.ip || request.connection?.remoteAddress || 'unknown';
    const path = request.route?.path || request.path;

    return userId ? `user:${userId}:${path}` : `ip:${ip}:${path}`;
  }

  private getConfig(context: ExecutionContext): RateLimitConfig {
    const custom = this.reflector.get<RateLimitConfig>('rateLimit', context.getHandler());
    return custom || this.defaultConfig;
  }

  private setHeaders(
    context: ExecutionContext,
    config: RateLimitConfig,
    count: number,
    retryAfter?: number,
  ): void {
    const response = context.switchToHttp().getResponse();
    response.setHeader('X-RateLimit-Limit', config.maxRequests);
    response.setHeader('X-RateLimit-Remaining', Math.max(0, config.maxRequests - count));
    response.setHeader('X-RateLimit-Reset', Math.ceil(Date.now() / 1000 + config.windowMs / 1000));

    if (retryAfter) {
      response.setHeader('Retry-After', retryAfter);
    }
  }

  private cleanup(): void {
    const now = Date.now();
    this.store.forEach((entry, key) => {
      if (now > entry.resetAt) {
        this.store.delete(key);
      }
    });
  }
}

// Decorator for custom rate limits
export const RateLimit = (config: RateLimitConfig) => {
  return (target: any, key: string, descriptor: PropertyDescriptor) => {
    Reflect.defineMetadata('rateLimit', config, descriptor.value);
    return descriptor;
  };
};
