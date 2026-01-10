import { Module } from '@nestjs/common';
import { ConsultationsController } from './consultations.controller';
import { ConsultationsService } from './consultations.service';
import { JitsiService } from './jitsi.service';
import { PrismaModule } from '../../common/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ConsultationsController],
  providers: [ConsultationsService, JitsiService],
  exports: [ConsultationsService, JitsiService],
})
export class ConsultationsModule {}
