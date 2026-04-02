import { Module } from '@nestjs/common';
import { BullyingController } from './bullying.controller';
import { BullyingService } from './bullying.service';
import { PrismaModule } from '../../common/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [BullyingController],
  providers: [BullyingService],
  exports: [BullyingService],
})
export class BullyingModule {}
