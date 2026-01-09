import { IsString, IsArray, IsNumber, IsOptional, Min, Max, ArrayMinSize } from 'class-validator';

export class UpdatePsychologistProfileDto {
  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(1, { message: 'Укажите хотя бы одну специализацию' })
  specialization: string[];

  @IsNumber()
  @Min(0)
  @Max(50)
  experienceYears: number;

  @IsString()
  education: string;

  @IsOptional()
  @IsString()
  bio?: string;

  @IsNumber()
  @Min(1000)
  @Max(100000)
  hourlyRate: number;

  @IsOptional()
  @IsString()
  certificateUrl?: string;
}
