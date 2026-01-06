import { NestFactory } from '@nestjs/core';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import * as compression from 'compression';
import * as cookieParser from 'cookie-parser';
import { Request, Response, NextFunction } from 'express';

import { AppModule } from './app.module';

async function bootstrap() {
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
  const corsOrigins = corsOrigin
    ? corsOrigin.split(',').map((o: string) => o.trim())
    : ['http://localhost:3000'];

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

  const port = configService.get('PORT') || 8080;
  await app.listen(port);

  console.log(`🚀 Application is running on: http://localhost:${port}`);
  console.log(`📚 API Documentation: http://localhost:${port}/api/docs`);
}

bootstrap();
