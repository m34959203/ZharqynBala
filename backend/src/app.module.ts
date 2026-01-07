import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';

import { PrismaModule } from './common/prisma/prisma.module';
import { HealthModule } from './health/health.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { TestsModule } from './modules/tests/tests.module';
import { ResultsModule } from './modules/results/results.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { AiModule } from './modules/ai/ai.module';
import { SchoolsModule } from './modules/schools/schools.module';
import { AdminModule } from './modules/admin/admin.module';
import { PdfModule } from './modules/pdf/pdf.module';
import { CrisisModule } from './modules/crisis/crisis.module';

@Module({
  imports: [
    // Configuration
    // In production (Docker), env vars come from container environment, not .env file
    ConfigModule.forRoot({
      isGlobal: true,
      ignoreEnvFile: process.env.NODE_ENV === 'production',
      envFilePath: '.env',
    }),

    // Rate limiting
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 60 seconds
        limit: 100, // 100 requests per TTL
      },
    ]),

    // Database
    PrismaModule,

    // Health check
    HealthModule,

    // Feature modules
    AuthModule,
    UsersModule,
    TestsModule,
    ResultsModule,
    PaymentsModule,
    AiModule,
    SchoolsModule,
    AdminModule,
    PdfModule,
    CrisisModule,
  ],
})
export class AppModule {}
