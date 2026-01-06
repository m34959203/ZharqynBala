import { Module } from '@nestjs/common';
import { ResultsController } from './results.controller';
import { ResultsService } from './results.service';
import { ScoringService } from './scoring.service';
import { PrismaModule } from '../../common/prisma/prisma.module';
import { PdfModule } from '../pdf/pdf.module';

@Module({
  imports: [PrismaModule, PdfModule],
  controllers: [ResultsController],
  providers: [ResultsService, ScoringService],
  exports: [ResultsService, ScoringService],
})
export class ResultsModule {}
