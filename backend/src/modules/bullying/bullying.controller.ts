import {
  Controller, Get, Post, Patch, Param, Body, Query, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { BullyingService } from './bullying.service';
import { CreateBullyingReportDto, UpdateReportStatusDto } from './dto/bullying.dto';
import { Public } from '../auth/decorators/public.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Bullying Reports')
@Controller('bullying')
export class BullyingController {
  constructor(private readonly bullyingService: BullyingService) {}

  @Post('report')
  @Public()
  @ApiOperation({ summary: 'Submit anonymous bullying report (no auth required)' })
  @ApiResponse({ status: 201, description: 'Report submitted' })
  async submitReport(@Body() dto: CreateBullyingReportDto) {
    return this.bullyingService.createReport(dto);
  }

  @Get('reports')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SCHOOL')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all bullying reports (admin/school)' })
  async getReports(
    @Query('schoolId') schoolId?: string,
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.bullyingService.getReports(
      schoolId, status, parseInt(page || '1'), parseInt(limit || '20'),
    );
  }

  @Get('reports/stats')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SCHOOL')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get bullying report statistics' })
  async getStats(@Query('schoolId') schoolId?: string) {
    return this.bullyingService.getStats(schoolId);
  }

  @Get('reports/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SCHOOL')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get specific report' })
  async getReport(@Param('id') id: string) {
    return this.bullyingService.getReport(id);
  }

  @Patch('reports/:id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SCHOOL')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update report status' })
  async updateStatus(@Param('id') id: string, @Body() dto: UpdateReportStatusDto) {
    return this.bullyingService.updateStatus(id, dto);
  }
}
