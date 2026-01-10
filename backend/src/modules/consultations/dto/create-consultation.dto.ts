import { IsString, IsUUID, IsOptional, IsDateString, IsNumber, Min, Max } from 'class-validator';

export class CreateConsultationDto {
  @IsUUID()
  psychologistId: string;

  @IsOptional()
  @IsUUID()
  childId?: string;

  @IsDateString()
  scheduledAt: string;

  @IsOptional()
  @IsNumber()
  @Min(30)
  @Max(120)
  durationMinutes?: number;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class ConfirmConsultationDto {
  @IsOptional()
  @IsString()
  notes?: string;
}

export class RejectConsultationDto {
  @IsString()
  reason: string;
}

export class CancelConsultationDto {
  @IsString()
  reason: string;
}

export class RateConsultationDto {
  @IsNumber()
  @Min(1)
  @Max(5)
  rating: number;

  @IsOptional()
  @IsString()
  review?: string;
}
