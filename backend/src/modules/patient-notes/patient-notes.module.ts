import { Module } from '@nestjs/common';
import { PatientNotesController } from './patient-notes.controller';
import { PatientNotesService } from './patient-notes.service';
import { PrismaModule } from '../../common/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [PatientNotesController],
  providers: [PatientNotesService],
  exports: [PatientNotesService],
})
export class PatientNotesModule {}
