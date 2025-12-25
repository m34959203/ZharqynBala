import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class SecurityMiddleware implements NestMiddleware {
  constructor(private readonly configService: ConfigService) {}

  use(req: Request, res: Response, next: NextFunction) {
    // Set security headers
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

    // Content Security Policy
    const cspDirectives = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https:",
      "font-src 'self' data:",
      "connect-src 'self' https://api.zharqynbala.kz wss:",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ];
    res.setHeader('Content-Security-Policy', cspDirectives.join('; '));

    // HSTS (only in production)
    if (this.configService.get('NODE_ENV') === 'production') {
      res.setHeader(
        'Strict-Transport-Security',
        'max-age=31536000; includeSubDomains; preload',
      );
    }

    // Remove fingerprinting headers
    res.removeHeader('X-Powered-By');

    next();
  }
}

@Injectable()
export class CsrfMiddleware implements NestMiddleware {
  private readonly trustedOrigins: string[];

  constructor(private readonly configService: ConfigService) {
    this.trustedOrigins = [
      this.configService.get('FRONTEND_URL') || 'http://localhost:3000',
      this.configService.get('API_URL') || 'http://localhost:3001',
    ];
  }

  use(req: Request, res: Response, next: NextFunction) {
    // Skip for safe methods
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
      return next();
    }

    const origin = req.headers.origin;
    const referer = req.headers.referer;

    // Check origin header
    if (origin && !this.trustedOrigins.some((t) => origin.startsWith(t))) {
      return res.status(403).json({
        statusCode: 403,
        message: 'Forbidden: Invalid origin',
      });
    }

    // Check referer header for same-origin requests
    if (!origin && referer) {
      const refererUrl = new URL(referer);
      if (!this.trustedOrigins.some((t) => referer.startsWith(t))) {
        return res.status(403).json({
          statusCode: 403,
          message: 'Forbidden: Invalid referer',
        });
      }
    }

    next();
  }
}

@Injectable()
export class RequestSanitizerMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    // Sanitize query parameters
    if (req.query) {
      req.query = this.sanitizeObject(req.query);
    }

    // Sanitize body
    if (req.body) {
      req.body = this.sanitizeObject(req.body);
    }

    next();
  }

  private sanitizeObject(obj: any): any {
    if (typeof obj !== 'object' || obj === null) {
      return this.sanitizeValue(obj);
    }

    if (Array.isArray(obj)) {
      return obj.map((item) => this.sanitizeObject(item));
    }

    const sanitized: Record<string, any> = {};
    for (const [key, value] of Object.entries(obj)) {
      // Skip prototype pollution attempts
      if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
        continue;
      }
      sanitized[key] = this.sanitizeObject(value);
    }
    return sanitized;
  }

  private sanitizeValue(value: any): any {
    if (typeof value !== 'string') {
      return value;
    }

    // Remove potential XSS vectors
    return value
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+=/gi, '')
      .trim();
  }
}
