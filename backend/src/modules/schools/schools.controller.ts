import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { SchoolsService } from './schools.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import {
  CreateSchoolDto,
  UpdateSchoolDto,
  SchoolResponseDto,
  AddStudentDto,
  SchoolStatsDto,
} from './dto/school.dto';

@ApiTags('Schools')
@Controller('schools')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class SchoolsController {
  constructor(private readonly schoolsService: SchoolsService) {}

  @Post()
  @Roles('ADMIN', 'SCHOOL')
  @ApiOperation({ summary: 'Create a new school' })
  @ApiResponse({ status: 201, type: SchoolResponseDto })
  async create(@Body() dto: CreateSchoolDto): Promise<SchoolResponseDto> {
    return this.schoolsService.create(dto);
  }

  @Get()
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Get all schools' })
  @ApiResponse({ status: 200, type: [SchoolResponseDto] })
  async findAll(): Promise<SchoolResponseDto[]> {
    return this.schoolsService.findAll();
  }

  @Get(':id')
  @Roles('ADMIN', 'SCHOOL')
  @ApiOperation({ summary: 'Get school by ID' })
  @ApiResponse({ status: 200, type: SchoolResponseDto })
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<SchoolResponseDto> {
    return this.schoolsService.findOne(id);
  }

  @Patch(':id')
  @Roles('ADMIN', 'SCHOOL')
  @ApiOperation({ summary: 'Update school' })
  @ApiResponse({ status: 200, type: SchoolResponseDto })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateSchoolDto,
  ): Promise<SchoolResponseDto> {
    return this.schoolsService.update(id, dto);
  }

  @Delete(':id')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Delete school' })
  async delete(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.schoolsService.delete(id);
  }

  @Get(':id/stats')
  @Roles('ADMIN', 'SCHOOL')
  @ApiOperation({ summary: 'Get school statistics' })
  @ApiResponse({ status: 200, type: SchoolStatsDto })
  async getStats(@Param('id', ParseUUIDPipe) id: string): Promise<SchoolStatsDto> {
    return this.schoolsService.getStats(id);
  }

  @Get(':id/classes')
  @Roles('ADMIN', 'SCHOOL')
  @ApiOperation({ summary: 'Get school classes' })
  async getClasses(@Param('id', ParseUUIDPipe) id: string) {
    return this.schoolsService.getClasses(id);
  }

  @Post(':id/students')
  @Roles('ADMIN', 'SCHOOL')
  @ApiOperation({ summary: 'Add student to school' })
  async addStudent(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AddStudentDto,
  ) {
    return this.schoolsService.addStudent(id, dto);
  }

  @Post(':id/import')
  @Roles('ADMIN', 'SCHOOL')
  @ApiOperation({ summary: 'Import students from Excel' })
  async importStudents(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() data: { students: any[] },
  ) {
    return this.schoolsService.importStudents(id, data.students);
  }

  @Get(':id/reports')
  @Roles('ADMIN', 'SCHOOL')
  @ApiOperation({ summary: 'Get school reports' })
  async getReports(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('type') type?: string,
  ) {
    return this.schoolsService.getReports(id, type);
  }
}
