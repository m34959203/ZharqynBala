import {
  Controller,
  Get,
  Param,
  Res,
  UseGuards,
  Req,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Response, Request } from 'express';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PdfService } from './pdf.service';
import { PrismaService } from '../../common/prisma/prisma.service';

interface AuthenticatedRequest extends Request {
  user: { id: string; role: string };
}

@ApiTags('PDF')
@Controller('pdf')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class PdfController {
  constructor(
    private readonly pdfService: PdfService,
    private readonly prisma: PrismaService,
  ) {}

  @Get('result/:id')
  @ApiOperation({ summary: 'Generate PDF for test result' })
  async generateResultPdf(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
    @Res() res: Response,
  ) {
    // Verify the result belongs to the requesting user's child
    const result = await this.prisma.result.findFirst({
      where: {
        id,
        session: {
          child: { parentId: req.user.id },
        },
      },
    });

    if (!result) {
      throw new NotFoundException('Result not found');
    }

    const buffer = await this.pdfService.generateResultPdf(id);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="result-${id}.pdf"`,
      'Content-Length': buffer.length,
    });
    res.end(buffer);
  }

  @Get('child/:id/report')
  @ApiOperation({ summary: 'Generate child progress report PDF' })
  async generateChildReportPdf(
    @Param('id') childId: string,
    @Req() req: AuthenticatedRequest,
    @Res() res: Response,
  ) {
    // Verify the child belongs to the requesting user
    const child = await this.prisma.child.findFirst({
      where: { id: childId, parentId: req.user.id },
    });

    if (!child) {
      throw new NotFoundException('Child not found');
    }

    const buffer = await this.pdfService.generateChildReportPdf(childId);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="report-${child.firstName}_${child.lastName}.pdf"`,
      'Content-Length': buffer.length,
    });
    res.end(buffer);
  }

  @Get('school/:id/report')
  @ApiOperation({ summary: 'Generate school report PDF' })
  async generateSchoolReportPdf(
    @Param('id') schoolId: string,
    @Req() req: AuthenticatedRequest,
    @Res() res: Response,
  ) {
    // Verify admin or school role
    const user = await this.prisma.user.findUnique({
      where: { id: req.user.id },
    });

    if (!user || (user.role !== 'ADMIN' && user.role !== 'SCHOOL')) {
      throw new ForbiddenException('Access denied');
    }

    // Verify the school exists
    const school = await this.prisma.school.findUnique({
      where: { id: schoolId },
    });

    if (!school) {
      throw new NotFoundException('School not found');
    }

    const buffer = await this.pdfService.generateSchoolReportPdf(schoolId);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="school-report-${schoolId}.pdf"`,
      'Content-Length': buffer.length,
    });
    res.end(buffer);
  }
}
