import {
  Controller,
  Get,
  Param,
  Query,
} from '@nestjs/common';
import { PsychologistsService } from './psychologists.service';
import {
  PsychologistListResponseDto,
  PsychologistDetailResponseDto,
} from './dto';

@Controller('psychologists')
export class PsychologistsController {
  constructor(private readonly psychologistsService: PsychologistsService) {}

  /**
   * Получить список психологов (публичный эндпоинт)
   */
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
  @Get(':id')
  async findOne(@Param('id') id: string): Promise<PsychologistDetailResponseDto> {
    return this.psychologistsService.findOne(id);
  }

  /**
   * Получить доступные слоты психолога
   */
  @Get(':id/slots')
  async getSlots(
    @Param('id') id: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ): Promise<{ date: string; hour: number }[]> {
    return this.psychologistsService.getAvailableSlots(id, startDate, endDate);
  }
}
