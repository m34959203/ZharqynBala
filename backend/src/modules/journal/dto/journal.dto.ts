import { IsString, IsOptional, IsEnum, IsInt, IsDateString, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export enum ActivityTypeEnum {
  DIAGNOSTIC = 'DIAGNOSTIC',
  CONSULTATION = 'CONSULTATION',
  CORRECTION = 'CORRECTION',
  EDUCATION = 'EDUCATION',
  METHODOLOGY = 'METHODOLOGY',
  OTHER = 'OTHER',
}

export class CreateActivityLogDto {
  @ApiProperty({ enum: ActivityTypeEnum })
  @IsEnum(ActivityTypeEnum)
  type: ActivityTypeEnum;

  @ApiProperty()
  @IsString()
  title: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty()
  @IsDateString()
  date: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  schoolId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(12)
  classGrade?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  classLetter?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  studentsCount?: number;

  @ApiPropertyOptional({ description: 'Duration in minutes' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  duration?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  result?: string;
}

export class UpdateActivityLogDto {
  @ApiPropertyOptional({ enum: ActivityTypeEnum })
  @IsOptional()
  @IsEnum(ActivityTypeEnum)
  type?: ActivityTypeEnum;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  date?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  schoolId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(12)
  classGrade?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  classLetter?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  studentsCount?: number;

  @ApiPropertyOptional({ description: 'Duration in minutes' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  duration?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  result?: string;
}
