import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsEnum, IsNotEmpty, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { TestCategory } from '@prisma/client';

export class StartTestDto {
  @ApiProperty({ description: 'ID of the child taking the test' })
  @IsString()
  @IsNotEmpty()
  childId: string;
}

export class SubmitAnswerDto {
  @ApiProperty({ description: 'ID of the question being answered' })
  @IsString()
  @IsNotEmpty()
  questionId: string;

  @ApiPropertyOptional({ description: 'ID of selected answer option' })
  @IsString()
  @IsOptional()
  answerOptionId?: string;

  @ApiPropertyOptional({ description: 'Text answer for TEXT type questions' })
  @IsString()
  @IsOptional()
  textAnswer?: string;
}

export class TestFilterDto {
  @ApiPropertyOptional({ enum: TestCategory })
  @IsEnum(TestCategory)
  @IsOptional()
  category?: TestCategory;

  @ApiPropertyOptional()
  @IsOptional()
  ageMin?: number;

  @ApiPropertyOptional()
  @IsOptional()
  ageMax?: number;

  @ApiPropertyOptional()
  @IsOptional()
  isPremium?: boolean;

  @ApiPropertyOptional({ description: 'Class grade (1-11) to filter age-appropriate tests' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(11)
  grade?: number;
}
