import { NestFactory } from '@nestjs/core';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import * as compression from 'compression';
import * as cookieParser from 'cookie-parser';
import { Request, Response, NextFunction } from 'express';

import { AppModule } from './app.module';
import { SentryService } from './common/monitoring/sentry.service';
import { SentryExceptionFilter } from './common/monitoring/sentry-exception.filter';

async function bootstrap() {
  // Startup diagnostics
  console.log('🔧 Starting Zharqyn Bala Backend...');
  console.log('📊 Environment:', process.env.NODE_ENV || 'development');
  console.log('🔌 PORT:', process.env.PORT || '8080 (default)');
  console.log('🗄️ DATABASE_URL:', process.env.DATABASE_URL ? 'configured' : 'NOT SET');

  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug', 'verbose'],
  });

  const configService = app.get(ConfigService);

  // Root redirect middleware (before other middleware)
  app.use((req: Request, res: Response, next: NextFunction) => {
    if (req.path === '/' || req.path === '') {
      return res.redirect('/api/docs');
    }
    next();
  });

  // Security
  app.use(helmet());

  // CORS configuration - supports multiple origins
  const corsOrigin = configService.get('CORS_ORIGIN');

  // Sanitize CORS origins - remove any invalid characters that could break HTTP headers
  const sanitizeOrigin = (origin: string): string => {
    return origin
      .trim()
      .replace(/[\r\n\t]/g, '') // Remove newlines, carriage returns, tabs
      .replace(/[^\x20-\x7E]/g, ''); // Keep only printable ASCII characters
  };

  const corsOrigins = corsOrigin
    ? corsOrigin
        .split(',')
        .map((o: string) => sanitizeOrigin(o))
        .filter((o: string) => o.length > 0 && o.startsWith('http'))
    : ['http://localhost:3000'];

  console.log('CORS origins configured:', corsOrigins);

  app.enableCors({
    origin: corsOrigins.length === 1 ? corsOrigins[0] : corsOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  });

  // Compression
  app.use(compression());

  // Cookies
  app.use(cookieParser());

  // Global prefix (exclude health endpoint for Railway healthcheck)
  app.setGlobalPrefix(configService.get('API_PREFIX') || 'api', {
    exclude: ['health'],
  });

  // Versioning
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Swagger documentation (enabled in all environments)
  const config = new DocumentBuilder()
    .setTitle('Zharqyn Bala API')
    .setDescription('Онлайн-платформа психологической диагностики детей')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('auth', 'Аутентификация и авторизация')
    .addTag('users', 'Управление пользователями')
    .addTag('children', 'Управление профилями детей')
    .addTag('tests', 'Психологические тесты')
    .addTag('results', 'Результаты тестирования')
    .addTag('payments', 'Платежи')
    .addTag('ai', 'AI интерпретация')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  // Sentry error monitoring
  const sentryService = app.get(SentryService);
  app.useGlobalFilters(new SentryExceptionFilter(sentryService));

  const port = configService.get('PORT') || 8080;
  // Bind to 0.0.0.0 for Docker/Railway - important for healthcheck!
  await app.listen(port, '0.0.0.0');

  console.log(`🚀 Application is running on port ${port}`);
  console.log(`📚 API Documentation: http://localhost:${port}/api/docs`);
}

bootstrap();
