import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsUUID, IsBoolean, IsObject } from 'class-validator';

export class CreatePatientNoteDto {
  @ApiProperty({ description: 'ID клиента' })
  @IsUUID()
  clientId: string;

  @ApiPropertyOptional({ description: 'ID ребёнка' })
  @IsOptional()
  @IsUUID()
  childId?: string;

  @ApiPropertyOptional({ description: 'ID консультации' })
  @IsOptional()
  @IsUUID()
  consultationId?: string;

  @ApiProperty({ description: 'Заголовок заметки' })
  @IsString()
  title: string;

  @ApiProperty({ description: 'Содержание заметки' })
  @IsString()
  content: string;

  @ApiPropertyOptional({ description: 'Основная жалоба' })
  @IsOptional()
  @IsString()
  chiefComplaint?: string;

  @ApiPropertyOptional({ description: 'История болезни' })
  @IsOptional()
  @IsString()
  historyOfIllness?: string;

  @ApiPropertyOptional({ description: 'Психический статус' })
  @IsOptional()
  @IsString()
  mentalStatus?: string;

  @ApiPropertyOptional({ description: 'Диагноз/заключение' })
  @IsOptional()
  @IsString()
  diagnosis?: string;

  @ApiPropertyOptional({ description: 'Рекомендации' })
  @IsOptional()
  @IsString()
  recommendations?: string;

  @ApiPropertyOptional({ description: 'План лечения' })
  @IsOptional()
  @IsString()
  treatmentPlan?: string;

  @ApiPropertyOptional({ description: 'Дополнительные данные' })
  @IsOptional()
  @IsObject()
  additionalData?: Record<string, unknown>;

  @ApiPropertyOptional({ description: 'Приватная заметка (видна только психологу)' })
  @IsOptional()
  @IsBoolean()
  isPrivate?: boolean;
}

export class UpdatePatientNoteDto {
  @ApiPropertyOptional({ description: 'Заголовок заметки' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({ description: 'Содержание заметки' })
  @IsOptional()
  @IsString()
  content?: string;

  @ApiPropertyOptional({ description: 'Основная жалоба' })
  @IsOptional()
  @IsString()
  chiefComplaint?: string;

  @ApiPropertyOptional({ description: 'История болезни' })
  @IsOptional()
  @IsString()
  historyOfIllness?: string;

  @ApiPropertyOptional({ description: 'Психический статус' })
  @IsOptional()
  @IsString()
  mentalStatus?: string;

  @ApiPropertyOptional({ description: 'Диагноз/заключение' })
  @IsOptional()
  @IsString()
  diagnosis?: string;

  @ApiPropertyOptional({ description: 'Рекомендации' })
  @IsOptional()
  @IsString()
  recommendations?: string;

  @ApiPropertyOptional({ description: 'План лечения' })
  @IsOptional()
  @IsString()
  treatmentPlan?: string;

  @ApiPropertyOptional({ description: 'Дополнительные данные' })
  @IsOptional()
  @IsObject()
  additionalData?: Record<string, unknown>;

  @ApiPropertyOptional({ description: 'Приватная заметка (видна только психологу)' })
  @IsOptional()
  @IsBoolean()
  isPrivate?: boolean;
}

export class PatientNoteResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  psychologistId: string;

  @ApiProperty()
  psychologistName: string;

  @ApiProperty()
  clientId: string;

  @ApiProperty()
  clientName: string;

  @ApiPropertyOptional()
  childId?: string;

  @ApiPropertyOptional()
  childName?: string;

  @ApiPropertyOptional()
  consultationId?: string;

  @ApiProperty()
  title: string;

  @ApiProperty()
  content: string;

  @ApiPropertyOptional()
  chiefComplaint?: string;

  @ApiPropertyOptional()
  historyOfIllness?: string;

  @ApiPropertyOptional()
  mentalStatus?: string;

  @ApiPropertyOptional()
  diagnosis?: string;

  @ApiPropertyOptional()
  recommendations?: string;

  @ApiPropertyOptional()
  treatmentPlan?: string;

  @ApiPropertyOptional()
  additionalData?: Record<string, unknown>;

  @ApiProperty()
  isPrivate: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
