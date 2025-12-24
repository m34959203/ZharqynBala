import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TestCategory, QuestionType } from '@prisma/client';

export class AnswerOptionDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  optionTextRu: string;

  @ApiProperty()
  optionTextKz: string;

  @ApiProperty()
  order: number;
}

export class QuestionDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  questionTextRu: string;

  @ApiProperty()
  questionTextKz: string;

  @ApiProperty({ enum: QuestionType })
  questionType: QuestionType;

  @ApiProperty()
  order: number;

  @ApiProperty()
  isRequired: boolean;

  @ApiProperty({ type: [AnswerOptionDto] })
  options: AnswerOptionDto[];
}

export class TestResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  titleRu: string;

  @ApiProperty()
  titleKz: string;

  @ApiProperty()
  descriptionRu: string;

  @ApiProperty()
  descriptionKz: string;

  @ApiProperty({ enum: TestCategory })
  category: TestCategory;

  @ApiProperty()
  ageMin: number;

  @ApiProperty()
  ageMax: number;

  @ApiProperty()
  durationMinutes: number;

  @ApiProperty()
  price: number;

  @ApiProperty()
  isPremium: boolean;

  @ApiProperty()
  isActive: boolean;

  @ApiPropertyOptional()
  questionsCount?: number;
}

export class TestDetailDto extends TestResponseDto {
  @ApiProperty({ type: [QuestionDto] })
  questions: QuestionDto[];
}

export class TestSessionResponseDto {
  @ApiProperty()
  sessionId: string;

  @ApiProperty()
  testId: string;

  @ApiProperty()
  childId: string;

  @ApiProperty()
  status: string;

  @ApiProperty()
  currentQuestionIndex: number;

  @ApiProperty()
  totalQuestions: number;

  @ApiProperty()
  progress: number;

  @ApiPropertyOptional({ type: QuestionDto })
  currentQuestion?: QuestionDto;
}

export class AnswerResponseDto {
  @ApiProperty()
  success: boolean;

  @ApiProperty()
  isComplete: boolean;

  @ApiProperty()
  progress: number;

  @ApiPropertyOptional({ type: QuestionDto })
  nextQuestion?: QuestionDto;

  @ApiPropertyOptional()
  resultId?: string;
}
