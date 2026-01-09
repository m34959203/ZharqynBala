import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsBoolean, IsDateString, IsInt, Max, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class ScheduleSlotDto {
  @ApiProperty({ example: '2026-01-15', description: 'Дата слота (YYYY-MM-DD)' })
  @IsDateString()
  date: string;

  @ApiProperty({ example: 9, description: 'Час (0-23)' })
  @IsInt()
  @Min(0)
  @Max(23)
  hour: number;

  @ApiProperty({ example: true, description: 'Доступен ли слот' })
  @IsBoolean()
  isAvailable: boolean;
}

export class SaveScheduleDto {
  @ApiProperty({ type: [ScheduleSlotDto], description: 'Список слотов расписания' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ScheduleSlotDto)
  slots: ScheduleSlotDto[];
}

export class ScheduleSlotResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  date: string;

  @ApiProperty()
  hour: number;

  @ApiProperty()
  isAvailable: boolean;
}

export class ScheduleResponseDto {
  @ApiProperty({ type: [ScheduleSlotResponseDto] })
  slots: ScheduleSlotResponseDto[];
}
