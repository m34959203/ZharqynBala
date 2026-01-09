import {
  Controller,
  Get,
  Post,
  Put,
  Param,
  Body,
  Query,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ConsultationsService } from './consultations.service';
import {
  CreateConsultationDto,
  ConfirmConsultationDto,
  RejectConsultationDto,
  CancelConsultationDto,
  RateConsultationDto,
} from './dto';
import { UserRole, ConsultationStatus } from '@prisma/client';

@ApiTags('Консультации')
@Controller('consultations')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class ConsultationsController {
  constructor(private readonly consultationsService: ConsultationsService) {}

  // ========== Клиентские эндпоинты ==========

  @Post()
  @Roles(UserRole.PARENT)
  @ApiOperation({ summary: 'Записаться на консультацию' })
  async create(
    @CurrentUser('id') clientId: string,
    @Body() dto: CreateConsultationDto,
  ) {
    return this.consultationsService.create(clientId, dto);
  }

  @Get('my')
  @Roles(UserRole.PARENT)
  @ApiOperation({ summary: 'Мои консультации (клиент)' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'status', required: false, enum: ConsultationStatus })
  async findMyConsultations(
    @CurrentUser('id') clientId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: ConsultationStatus,
  ) {
    return this.consultationsService.findAllForClient(clientId, {
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
      status,
    });
  }

  @Put(':id/cancel')
  @Roles(UserRole.PARENT)
  @ApiOperation({ summary: 'Отменить консультацию (клиент)' })
  async cancel(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') clientId: string,
    @Body() dto: CancelConsultationDto,
  ) {
    return this.consultationsService.cancel(id, clientId, dto);
  }

  @Put(':id/rate')
  @Roles(UserRole.PARENT)
  @ApiOperation({ summary: 'Оставить отзыв о консультации' })
  async rate(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') clientId: string,
    @Body() dto: RateConsultationDto,
  ) {
    return this.consultationsService.rate(id, clientId, dto);
  }

  // ========== Эндпоинты для психолога ==========

  @Get('psychologist')
  @Roles(UserRole.PSYCHOLOGIST)
  @ApiOperation({ summary: 'Консультации психолога' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'status', required: false, enum: ConsultationStatus })
  async findPsychologistConsultations(
    @CurrentUser('id') userId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: ConsultationStatus,
  ) {
    return this.consultationsService.findAllForPsychologist(userId, {
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
      status,
    });
  }

  @Put(':id/confirm')
  @Roles(UserRole.PSYCHOLOGIST)
  @ApiOperation({ summary: 'Подтвердить консультацию' })
  async confirm(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
    @Body() dto: ConfirmConsultationDto,
  ) {
    return this.consultationsService.confirm(id, userId, dto);
  }

  @Put(':id/reject')
  @Roles(UserRole.PSYCHOLOGIST)
  @ApiOperation({ summary: 'Отклонить консультацию' })
  async reject(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
    @Body() dto: RejectConsultationDto,
  ) {
    return this.consultationsService.reject(id, userId, dto);
  }

  @Put(':id/complete')
  @Roles(UserRole.PSYCHOLOGIST)
  @ApiOperation({ summary: 'Завершить консультацию' })
  async complete(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.consultationsService.complete(id, userId);
  }

  @Put(':id/no-show')
  @Roles(UserRole.PSYCHOLOGIST)
  @ApiOperation({ summary: 'Отметить неявку клиента' })
  async markNoShow(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.consultationsService.markNoShow(id, userId);
  }

  // ========== Общие эндпоинты ==========

  @Get(':id')
  @Roles(UserRole.PARENT, UserRole.PSYCHOLOGIST, UserRole.ADMIN)
  @ApiOperation({ summary: 'Получить консультацию по ID' })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: UserRole,
  ) {
    return this.consultationsService.findOne(id, userId, userRole);
  }

  @Put(':id/start')
  @Roles(UserRole.PARENT, UserRole.PSYCHOLOGIST)
  @ApiOperation({ summary: 'Начать консультацию' })
  async start(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.consultationsService.start(id, userId);
  }

  @Get(':id/jitsi-config')
  @Roles(UserRole.PARENT, UserRole.PSYCHOLOGIST)
  @ApiOperation({ summary: 'Получить конфигурацию Jitsi для видеозвонка' })
  async getJitsiConfig(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.consultationsService.getJitsiConfig(id, userId);
  }
}
