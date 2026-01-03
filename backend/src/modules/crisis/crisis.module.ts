import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CrisisService } from './crisis.service';
import { CrisisController } from './crisis.controller';
import { PrismaModule } from '../../common/prisma/prisma.module';

@Module({
  imports: [PrismaModule, ConfigModule],
  controllers: [CrisisController],
  providers: [CrisisService],
  exports: [CrisisService],
})
export class CrisisModule {}
