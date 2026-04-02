import {
  Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CalendarService } from './calendar.service';
import { CreateEventDto, UpdateEventDto } from './dto/calendar.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Calendar')
@Controller('calendar')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class CalendarController {
  constructor(private readonly calendarService: CalendarService) {}

  @Post()
  @Roles('SCHOOL', 'ADMIN')
  @ApiOperation({ summary: 'Schedule a new test event' })
  async create(@CurrentUser('id') userId: string, @Body() dto: CreateEventDto) {
    return this.calendarService.create(userId, dto);
  }

  @Get()
  @Roles('SCHOOL', 'ADMIN')
  @ApiOperation({ summary: 'List events with filters' })
  async findAll(
    @Query('schoolId') schoolId?: string,
    @Query('quarter') quarter?: string,
    @Query('academicYear') academicYear?: string,
    @Query('status') status?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.calendarService.findAll({
      schoolId, quarter: quarter ? parseInt(quarter) : undefined,
      academicYear, status, from, to,
    });
  }

  @Get('school/:schoolId')
  @Roles('SCHOOL', 'ADMIN')
  @ApiOperation({ summary: 'Get school calendar grouped by quarter' })
  async getBySchool(
    @Param('schoolId') schoolId: string,
    @Query('academicYear') academicYear?: string,
  ) {
    return this.calendarService.getBySchool(schoolId, academicYear);
  }

  @Get(':id')
  @Roles('SCHOOL', 'ADMIN')
  @ApiOperation({ summary: 'Get event details' })
  async findOne(@Param('id') id: string) {
    return this.calendarService.findOne(id);
  }

  @Patch(':id')
  @Roles('SCHOOL', 'ADMIN')
  @ApiOperation({ summary: 'Update event' })
  async update(@Param('id') id: string, @Body() dto: UpdateEventDto) {
    return this.calendarService.update(id, dto);
  }

  @Delete(':id')
  @Roles('SCHOOL', 'ADMIN')
  @ApiOperation({ summary: 'Delete event' })
  async remove(@Param('id') id: string) {
    return this.calendarService.remove(id);
  }
}
