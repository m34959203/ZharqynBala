import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsEnum,
  IsInt,
  IsBoolean,
  IsOptional,
  IsArray,
  ValidateNested,
  Min,
  Max,
  MinLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { TestCategory, QuestionType } from '@prisma/client';

// DTO for creating answer options
export class CreateAnswerOptionDto {
  @ApiProperty({ description: 'Option text in Russian' })
  @IsString()
  @MinLength(1)
  optionTextRu: string;

  @ApiProperty({ description: 'Option text in Kazakh' })
  @IsString()
  @MinLength(1)
  optionTextKz: string;

  @ApiProperty({ description: 'Score for this option' })
  @IsInt()
  @Min(0)
  score: number;

  @ApiProperty({ description: 'Display order' })
  @IsInt()
  @Min(0)
  order: number;
}

// DTO for creating questions
export class CreateQuestionDto {
  @ApiProperty({ description: 'Question text in Russian' })
  @IsString()
  @MinLength(1)
  questionTextRu: string;

  @ApiProperty({ description: 'Question text in Kazakh' })
  @IsString()
  @MinLength(1)
  questionTextKz: string;

  @ApiProperty({ enum: QuestionType, description: 'Type of question' })
  @IsEnum(QuestionType)
  questionType: QuestionType;

  @ApiProperty({ description: 'Display order' })
  @IsInt()
  @Min(0)
  order: number;

  @ApiPropertyOptional({ description: 'Is question required' })
  @IsBoolean()
  @IsOptional()
  isRequired?: boolean;

  @ApiProperty({ type: [CreateAnswerOptionDto], description: 'Answer options' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateAnswerOptionDto)
  options: CreateAnswerOptionDto[];
}

// DTO for creating a new test
export class CreateTestDto {
  @ApiProperty({ description: 'Test title in Russian' })
  @IsString()
  @MinLength(1)
  titleRu: string;

  @ApiProperty({ description: 'Test title in Kazakh' })
  @IsString()
  @MinLength(1)
  titleKz: string;

  @ApiProperty({ description: 'Test description in Russian' })
  @IsString()
  @MinLength(1)
  descriptionRu: string;

  @ApiProperty({ description: 'Test description in Kazakh' })
  @IsString()
  @MinLength(1)
  descriptionKz: string;

  @ApiProperty({ enum: TestCategory, description: 'Test category' })
  @IsEnum(TestCategory)
  category: TestCategory;

  @ApiProperty({ description: 'Minimum age' })
  @IsInt()
  @Min(1)
  @Max(99)
  ageMin: number;

  @ApiProperty({ description: 'Maximum age' })
  @IsInt()
  @Min(1)
  @Max(99)
  ageMax: number;

  @ApiProperty({ description: 'Duration in minutes' })
  @IsInt()
  @Min(1)
  durationMinutes: number;

  @ApiPropertyOptional({ description: 'Price in KZT' })
  @IsInt()
  @Min(0)
  @IsOptional()
  price?: number;

  @ApiPropertyOptional({ description: 'Is premium test' })
  @IsBoolean()
  @IsOptional()
  isPremium?: boolean;

  @ApiPropertyOptional({ description: 'Is test active' })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'Display order' })
  @IsInt()
  @IsOptional()
  order?: number;

  @ApiPropertyOptional({ type: [CreateQuestionDto], description: 'Questions with options' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateQuestionDto)
  @IsOptional()
  questions?: CreateQuestionDto[];
}

// DTO for updating a test
export class UpdateTestDto {
  @ApiPropertyOptional({ description: 'Test title in Russian' })
  @IsString()
  @MinLength(1)
  @IsOptional()
  titleRu?: string;

  @ApiPropertyOptional({ description: 'Test title in Kazakh' })
  @IsString()
  @MinLength(1)
  @IsOptional()
  titleKz?: string;

  @ApiPropertyOptional({ description: 'Test description in Russian' })
  @IsString()
  @MinLength(1)
  @IsOptional()
  descriptionRu?: string;

  @ApiPropertyOptional({ description: 'Test description in Kazakh' })
  @IsString()
  @MinLength(1)
  @IsOptional()
  descriptionKz?: string;

  @ApiPropertyOptional({ enum: TestCategory, description: 'Test category' })
  @IsEnum(TestCategory)
  @IsOptional()
  category?: TestCategory;

  @ApiPropertyOptional({ description: 'Minimum age' })
  @IsInt()
  @Min(1)
  @Max(99)
  @IsOptional()
  ageMin?: number;

  @ApiPropertyOptional({ description: 'Maximum age' })
  @IsInt()
  @Min(1)
  @Max(99)
  @IsOptional()
  ageMax?: number;

  @ApiPropertyOptional({ description: 'Duration in minutes' })
  @IsInt()
  @Min(1)
  @IsOptional()
  durationMinutes?: number;

  @ApiPropertyOptional({ description: 'Price in KZT' })
  @IsInt()
  @Min(0)
  @IsOptional()
  price?: number;

  @ApiPropertyOptional({ description: 'Is premium test' })
  @IsBoolean()
  @IsOptional()
  isPremium?: boolean;

  @ApiPropertyOptional({ description: 'Is test active' })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'Display order' })
  @IsInt()
  @IsOptional()
  order?: number;
}

export class DashboardStatsDto {
  @ApiProperty()
  totalUsers: number;

  @ApiProperty()
  totalChildren: number;

  @ApiProperty()
  totalTests: number;

  @ApiProperty()
  completedSessions: number;

  @ApiProperty()
  totalRevenue: number;

  @ApiProperty()
  newUsersToday: number;

  @ApiProperty()
  testsToday: number;
}

export class UserListDto {
  @ApiProperty()
  users: any[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  totalPages: number;
}

export class TestManagementDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  title: string;

  @ApiProperty()
  category: string;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty()
  isPremium: boolean;

  @ApiProperty()
  questionCount: number;

  @ApiProperty()
  sessionCount: number;
}

export class SystemSettingsDto {
  @ApiProperty()
  siteName: string;

  @ApiProperty()
  supportEmail: string;

  @ApiProperty()
  defaultLanguage: string;

  @ApiProperty()
  enablePayments: boolean;

  @ApiProperty()
  enableConsultations: boolean;

  @ApiProperty()
  maintenanceMode: boolean;

  @ApiProperty()
  freeTestsLimit: number;

  @ApiProperty()
  premiumPrice: number;
}
