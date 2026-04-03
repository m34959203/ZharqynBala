import { Controller, Get, Param, Query, Res, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Response } from 'express';
import { ExportService } from './export.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Export')
@Controller('export')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class ExportController {
  constructor(private readonly exportService: ExportService) {}

  @Get('results')
  @Roles('PARENT', 'PSYCHOLOGIST', 'ADMIN')
  @ApiOperation({ summary: 'Export all results for current user as Excel' })
  async exportMyResults(@CurrentUser('id') userId: string, @Res() res: Response) {
    const buffer = await this.exportService.exportUserResults(userId);
    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="results-${new Date().toISOString().split('T')[0]}.xlsx"`,
      'Content-Length': buffer.length,
    });
    res.end(buffer);
  }

  @Get('child/:childId/results')
  @Roles('PARENT', 'PSYCHOLOGIST', 'ADMIN')
  @ApiOperation({ summary: 'Export child test results as Excel' })
  async exportChildResults(@Param('childId') childId: string, @Res() res: Response) {
    const buffer = await this.exportService.exportChildResults(childId);
    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="results-${childId}.xlsx"`,
      'Content-Length': buffer.length,
    });
    res.end(buffer);
  }

  @Get('school/:schoolId/report')
  @Roles('SCHOOL', 'ADMIN')
  @ApiOperation({ summary: 'Export school report as Excel' })
  async exportSchoolReport(@Param('schoolId') schoolId: string, @Res() res: Response) {
    const buffer = await this.exportService.exportSchoolReport(schoolId);
    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="school-${schoolId}.xlsx"`,
      'Content-Length': buffer.length,
    });
    res.end(buffer);
  }

  @Get('users')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Export all users as Excel' })
  async exportUsers(@Res() res: Response) {
    const buffer = await this.exportService.exportUsers();
    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="users-${new Date().toISOString().split('T')[0]}.xlsx"`,
      'Content-Length': buffer.length,
    });
    res.end(buffer);
  }

  @Get('payments')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Export payments as Excel' })
  async exportPayments(
    @Query('from') from: string,
    @Query('to') to: string,
    @Res() res: Response,
  ) {
    const buffer = await this.exportService.exportPayments(from, to);
    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="payments-${new Date().toISOString().split('T')[0]}.xlsx"`,
      'Content-Length': buffer.length,
    });
    res.end(buffer);
  }
}
