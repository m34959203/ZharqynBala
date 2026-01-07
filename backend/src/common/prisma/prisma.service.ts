import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);
  private isConnected = false;

  async onModuleInit() {
    await this.connectWithRetry();
  }

  private async connectWithRetry(maxRetries = 5, delayMs = 2000) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        this.logger.log(`Database connection attempt ${attempt}/${maxRetries}...`);
        await this.$connect();
        this.isConnected = true;
        this.logger.log('✅ Database connected successfully');
        return;
      } catch (error) {
        this.logger.warn(`❌ Database connection attempt ${attempt} failed: ${error.message}`);

        if (attempt === maxRetries) {
          this.logger.error(`Failed to connect to database after ${maxRetries} attempts`);
          // Don't throw - let the app start for healthcheck
          // Database operations will fail but app will be responsive
          return;
        }

        this.logger.log(`Retrying in ${delayMs / 1000} seconds...`);
        await this.delay(delayMs);
        // Exponential backoff with cap at 30 seconds
        delayMs = Math.min(delayMs * 1.5, 30000);
      }
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  getConnectionStatus(): boolean {
    return this.isConnected;
  }

  async onModuleDestroy() {
    await this.$disconnect();
    this.logger.log('👋 Database disconnected');
  }

  async cleanDatabase() {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Cannot clean database in production!');
    }

    const models = Reflect.ownKeys(this).filter(
      (key) => {
        if (typeof key !== 'string') return false;
        return key[0] !== '_' && key[0] !== '$';
      },
    ) as string[];

    return Promise.all(
      models.map((modelKey) => (this as any)[modelKey].deleteMany()),
    );
  }
}
