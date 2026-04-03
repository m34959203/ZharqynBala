import {
  Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JournalService } from './journal.service';
import { CreateActivityLogDto, UpdateActivityLogDto } from './dto/journal.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Activity Journal')
@Controller('journal')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class JournalController {
  constructor(private readonly journalService: JournalService) {}

  @Post()
  @Roles('PSYCHOLOGIST')
  @ApiOperation({ summary: 'Create activity log entry' })
  async create(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateActivityLogDto,
  ) {
    return this.journalService.create(userId, dto);
  }

  @Get('stats')
  @Roles('PSYCHOLOGIST', 'SCHOOL', 'ADMIN')
  @ApiOperation({ summary: 'Get activity journal statistics' })
  async getStats(
    @CurrentUser('id') userId: string,
    @CurrentUser('role') role: string,
  ) {
    return this.journalService.getStats(userId, role);
  }

  @Get()
  @Roles('PSYCHOLOGIST', 'SCHOOL', 'ADMIN')
  @ApiOperation({ summary: 'List activity log entries with filters' })
  async findAll(
    @CurrentUser('id') userId: string,
    @CurrentUser('role') role: string,
    @Query('type') type?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
    @Query('classGrade') classGrade?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.journalService.findAll({
      userId,
      role,
      type,
      dateFrom,
      dateTo,
      classGrade: classGrade ? parseInt(classGrade) : undefined,
      page: parseInt(page || '1'),
      limit: parseInt(limit || '20'),
    });
  }

  @Get(':id')
  @Roles('PSYCHOLOGIST', 'SCHOOL', 'ADMIN')
  @ApiOperation({ summary: 'Get activity log entry' })
  async findOne(@Param('id') id: string) {
    return this.journalService.findOne(id);
  }

  @Patch(':id')
  @Roles('PSYCHOLOGIST')
  @ApiOperation({ summary: 'Update activity log entry' })
  async update(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateActivityLogDto,
  ) {
    return this.journalService.update(id, userId, dto);
  }

  @Delete(':id')
  @Roles('PSYCHOLOGIST')
  @ApiOperation({ summary: 'Delete activity log entry' })
  async delete(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.journalService.delete(id, userId);
  }
}
