import {
  Controller,
  Get,
  Post,
  Put,
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
import { PatientNotesService } from './patient-notes.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';
import {
  CreatePatientNoteDto,
  UpdatePatientNoteDto,
  PatientNoteResponseDto,
} from './dto/patient-note.dto';

@ApiTags('Patient Notes')
@Controller('patient-notes')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.PSYCHOLOGIST)
@ApiBearerAuth()
export class PatientNotesController {
  constructor(private readonly patientNotesService: PatientNotesService) {}

  @Post()
  @ApiOperation({ summary: 'Создать заметку о пациенте' })
  @ApiResponse({ status: 201, type: PatientNoteResponseDto })
  async create(
    @CurrentUser('id') userId: string,
    @Body() dto: CreatePatientNoteDto,
  ): Promise<PatientNoteResponseDto> {
    return this.patientNotesService.create(userId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Получить все заметки психолога' })
  @ApiResponse({ status: 200, type: [PatientNoteResponseDto] })
  async findAll(
    @CurrentUser('id') userId: string,
    @Query('clientId') clientId?: string,
  ): Promise<PatientNoteResponseDto[]> {
    return this.patientNotesService.findAllForPsychologist(userId, clientId);
  }

  @Get('consultation/:consultationId')
  @ApiOperation({ summary: 'Получить заметки по консультации' })
  @ApiResponse({ status: 200, type: [PatientNoteResponseDto] })
  async findByConsultation(
    @CurrentUser('id') userId: string,
    @Param('consultationId', ParseUUIDPipe) consultationId: string,
  ): Promise<PatientNoteResponseDto[]> {
    return this.patientNotesService.findByConsultation(userId, consultationId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Получить заметку по ID' })
  @ApiResponse({ status: 200, type: PatientNoteResponseDto })
  async findOne(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<PatientNoteResponseDto> {
    return this.patientNotesService.findOne(userId, id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Обновить заметку' })
  @ApiResponse({ status: 200, type: PatientNoteResponseDto })
  async update(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdatePatientNoteDto,
  ): Promise<PatientNoteResponseDto> {
    return this.patientNotesService.update(userId, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Удалить заметку' })
  @ApiResponse({ status: 200, description: 'Заметка удалена' })
  async delete(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<{ message: string }> {
    await this.patientNotesService.delete(userId, id);
    return { message: 'Заметка удалена' };
  }
}
