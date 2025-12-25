import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsUUID, IsOptional, IsString, IsEnum } from 'class-validator';
import { TestCategory } from '@prisma/client';

export class StartTestDto {
  @ApiProperty({ description: 'ID of the child taking the test' })
  @IsUUID()
  childId: string;
}

export class SubmitAnswerDto {
  @ApiProperty({ description: 'ID of the question being answered' })
  @IsUUID()
  questionId: string;

  @ApiPropertyOptional({ description: 'ID of selected answer option' })
  @IsUUID()
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
}
