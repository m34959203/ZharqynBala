import {
  Controller, Get, Post, Patch, Param, Body, Query, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CasesService } from './cases.service';
import { CreateCaseDto, UpdateCaseDto, AddCaseNoteDto } from './dto/cases.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Case Management')
@Controller('cases')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class CasesController {
  constructor(private readonly casesService: CasesService) {}

  @Post()
  @Roles('PSYCHOLOGIST', 'ADMIN')
  @ApiOperation({ summary: 'Create a new student case' })
  async create(@CurrentUser('id') userId: string, @Body() dto: CreateCaseDto) {
    return this.casesService.create(userId, dto);
  }

  @Get()
  @Roles('PSYCHOLOGIST', 'ADMIN', 'SCHOOL')
  @ApiOperation({ summary: 'List cases with filters' })
  async findAll(
    @CurrentUser('id') userId: string,
    @CurrentUser('role') role: string,
    @Query('status') status?: string,
    @Query('priority') priority?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.casesService.findAll({
      psychologistUserId: role === 'PSYCHOLOGIST' ? userId : undefined,
      status,
      priority,
      page: parseInt(page || '1'),
      limit: parseInt(limit || '20'),
    });
  }

  @Get('stats')
  @Roles('PSYCHOLOGIST', 'ADMIN', 'SCHOOL')
  @ApiOperation({ summary: 'Get case statistics' })
  async getStats(@CurrentUser('id') userId: string, @CurrentUser('role') role: string) {
    return this.casesService.getStats(role === 'PSYCHOLOGIST' ? userId : undefined);
  }

  @Get(':id')
  @Roles('PSYCHOLOGIST', 'ADMIN', 'SCHOOL')
  @ApiOperation({ summary: 'Get case details with notes' })
  async findOne(@Param('id') id: string) {
    return this.casesService.findOne(id);
  }

  @Patch(':id')
  @Roles('PSYCHOLOGIST', 'ADMIN')
  @ApiOperation({ summary: 'Update case' })
  async update(@Param('id') id: string, @Body() dto: UpdateCaseDto) {
    return this.casesService.update(id, dto);
  }

  @Post(':id/notes')
  @Roles('PSYCHOLOGIST', 'ADMIN', 'SCHOOL')
  @ApiOperation({ summary: 'Add note to case' })
  async addNote(
    @Param('id') caseId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: AddCaseNoteDto,
  ) {
    return this.casesService.addNote(caseId, userId, dto);
  }
}
