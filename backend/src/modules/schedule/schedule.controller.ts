import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Query,
  Param,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { ScheduleService } from './schedule.service';
import { SaveScheduleDto, ScheduleSlotResponseDto } from './dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('Schedule')
@ApiBearerAuth()
@Controller('schedule')
export class ScheduleController {
  constructor(private readonly scheduleService: ScheduleService) {}

  @Get()
  @Roles(UserRole.PSYCHOLOGIST)
  @ApiOperation({ summary: 'Получить своё расписание (для психолога)' })
  @ApiQuery({ name: 'startDate', required: false, example: '2026-01-01' })
  @ApiQuery({ name: 'endDate', required: false, example: '2026-01-31' })
  @ApiResponse({
    status: 200,
    description: 'Список доступных слотов',
    type: [ScheduleSlotResponseDto],
  })
  async getSchedule(
    @CurrentUser('id') userId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ): Promise<ScheduleSlotResponseDto[]> {
    return this.scheduleService.getSchedule(userId, startDate, endDate);
  }

  @Post()
  @Roles(UserRole.PSYCHOLOGIST)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Сохранить расписание (для психолога)' })
  @ApiResponse({
    status: 200,
    description: 'Расписание сохранено',
  })
  async saveSchedule(
    @CurrentUser('id') userId: string,
    @Body() dto: SaveScheduleDto,
  ): Promise<{ saved: number; deleted: number }> {
    return this.scheduleService.saveSchedule(userId, dto);
  }

  @Delete()
  @Roles(UserRole.PSYCHOLOGIST)
  @ApiOperation({ summary: 'Очистить расписание за период (для психолога)' })
  @ApiQuery({ name: 'startDate', required: true, example: '2026-01-01' })
  @ApiQuery({ name: 'endDate', required: true, example: '2026-01-07' })
  @ApiResponse({
    status: 200,
    description: 'Расписание очищено',
  })
  async clearSchedule(
    @CurrentUser('id') userId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ): Promise<{ deleted: number }> {
    return this.scheduleService.clearSchedule(userId, startDate, endDate);
  }

  @Get('psychologist/:psychologistId')
  @Public()
  @ApiOperation({ summary: 'Получить публичное расписание психолога (для клиентов)' })
  @ApiQuery({ name: 'startDate', required: true, example: '2026-01-01' })
  @ApiQuery({ name: 'endDate', required: true, example: '2026-01-31' })
  @ApiResponse({
    status: 200,
    description: 'Список доступных слотов',
    type: [ScheduleSlotResponseDto],
  })
  async getPublicSchedule(
    @Param('psychologistId') psychologistId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ): Promise<ScheduleSlotResponseDto[]> {
    return this.scheduleService.getPublicSchedule(psychologistId, startDate, endDate);
  }
}
