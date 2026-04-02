import { IsString, IsOptional, IsBoolean, IsInt, IsEnum, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum BullyingTypeDto {
  PHYSICAL = 'PHYSICAL',
  VERBAL = 'VERBAL',
  SOCIAL = 'SOCIAL',
  CYBER = 'CYBER',
  OTHER = 'OTHER',
}

export class CreateBullyingReportDto {
  @ApiProperty({ enum: BullyingTypeDto })
  @IsEnum(BullyingTypeDto)
  type: BullyingTypeDto;

  @ApiProperty({ description: 'Description of the incident' })
  @IsString()
  description: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  schoolId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  anonymous?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  reporterName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  reporterContact?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(12)
  victimGrade?: number;
}

export class UpdateReportStatusDto {
  @ApiProperty({ enum: ['NEW', 'IN_PROGRESS', 'RESOLVED', 'DISMISSED'] })
  @IsEnum({ NEW: 'NEW', IN_PROGRESS: 'IN_PROGRESS', RESOLVED: 'RESOLVED', DISMISSED: 'DISMISSED' })
  status: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  resolution?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  assignedTo?: string;
}
