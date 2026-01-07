import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ResultResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  sessionId: string;

  @ApiProperty()
  totalScore: number;

  @ApiProperty()
  maxScore: number;

  @ApiProperty()
  percentage: number;

  @ApiProperty()
  interpretation: string;

  @ApiProperty()
  recommendations: string;

  @ApiPropertyOptional()
  pdfUrl?: string;

  @ApiProperty()
  createdAt: Date;

  // Test info
  @ApiPropertyOptional()
  testTitle?: string;

  @ApiPropertyOptional()
  testCategory?: string;

  @ApiPropertyOptional({ description: 'Scoring type: percentage or absolute' })
  scoringType?: 'percentage' | 'absolute';

  // Child info
  @ApiPropertyOptional()
  childName?: string;
}

export class ResultDetailDto extends ResultResponseDto {
  @ApiPropertyOptional()
  aiInterpretation?: {
    summary: string;
    strengths: string[];
    areasForDevelopment: string[];
    recommendations: { title: string; description: string; priority: string }[];
    needSpecialist: boolean;
    specialistReason?: string;
  };

  @ApiPropertyOptional()
  answers?: {
    questionText: string;
    answerText: string;
    score: number;
  }[];
}

export class ResultsHistoryDto {
  @ApiProperty({ type: [ResultResponseDto] })
  results: ResultResponseDto[];

  @ApiProperty()
  total: number;
}
