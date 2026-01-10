import {
  Controller,
  Get,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { PsychologistsService } from './psychologists.service';
import {
  PsychologistListResponseDto,
  PsychologistDetailResponseDto,
  UpdatePsychologistProfileDto,
} from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { UserRole } from '@prisma/client';

@Controller('psychologists')
export class PsychologistsController {
  constructor(private readonly psychologistsService: PsychologistsService) {}

  /**
   * Получить собственный профиль психолога (требует авторизации)
   */
  @Get('me')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PSYCHOLOGIST)
  async getMyProfile(@Request() req: any) {
    return this.psychologistsService.getMyProfile(req.user.id);
  }

  /**
   * Обновить собственный профиль психолога (требует авторизации)
   */
  @Put('me')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PSYCHOLOGIST)
  async updateMyProfile(
    @Request() req: any,
    @Body() dto: UpdatePsychologistProfileDto,
  ): Promise<PsychologistDetailResponseDto> {
    return this.psychologistsService.updateMyProfile(req.user.id, dto);
  }

  /**
   * Получить клиентов психолога (требует авторизации)
   */
  @Get('me/clients')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PSYCHOLOGIST)
  async getMyClients(@Request() req: any) {
    return this.psychologistsService.getMyClients(req.user.id);
  }

  /**
   * Получить статистику доходов психолога (требует авторизации)
   */
  @Get('me/earnings')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PSYCHOLOGIST)
  async getMyEarnings(
    @Request() req: any,
    @Query('period') period?: 'week' | 'month' | 'year',
  ) {
    return this.psychologistsService.getMyEarnings(req.user.id, period || 'month');
  }

  /**
   * Получить список психологов (публичный эндпоинт)
   */
  @Public()
  @Get()
  async findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('specialization') specialization?: string,
  ): Promise<PsychologistListResponseDto> {
    return this.psychologistsService.findAll({
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 10,
      specialization,
    });
  }

  /**
   * Получить психолога по ID (публичный эндпоинт)
   */
  @Public()
  @Get(':id')
  async findOne(@Param('id') id: string): Promise<PsychologistDetailResponseDto> {
    return this.psychologistsService.findOne(id);
  }

  /**
   * Получить доступные слоты психолога
   */
  @Public()
  @Get(':id/slots')
  async getSlots(
    @Param('id') id: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ): Promise<{ date: string; hour: number }[]> {
    return this.psychologistsService.getAvailableSlots(id, startDate, endDate);
  }
}
