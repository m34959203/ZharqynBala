import { ApiProperty } from '@nestjs/swagger';

class ParentInfoDto {
  @ApiProperty() id!: string;
  @ApiProperty() firstName!: string;
  @ApiProperty() lastName!: string;
}

class ParentChildDto {
  @ApiProperty() id!: string;
  @ApiProperty() firstName!: string;
  @ApiProperty() lastName!: string;
  @ApiProperty() ageYears!: number;
  @ApiProperty({ nullable: true }) gradeLevel!: number | null;
  @ApiProperty() joinedAt!: string;
  @ApiProperty({ description: '% от рекомендованных тестов (30)' }) progressPct!: number;
  @ApiProperty() testsInProgress!: number;
  @ApiProperty() avatarTone!: string;
}

class ParentTotalsDto {
  @ApiProperty() childrenCount!: number;
  @ApiProperty() testsPassed!: number;
  @ApiProperty() testsPassedDeltaMonth!: number;
  @ApiProperty({ nullable: true }) avgScore!: number | null;
  @ApiProperty({ nullable: true }) avgScoreDeltaMonth!: number | null;
  @ApiProperty() consultationsTotal!: number;
  @ApiProperty() consultationsThisMonth!: number;
}

class RecentResultDto {
  @ApiProperty() id!: string;
  @ApiProperty() testName!: string;
  @ApiProperty() category!: string;
  @ApiProperty() completedAt!: string;
  @ApiProperty() scorePct!: number;
  @ApiProperty() riskZone!: 'GREEN' | 'YELLOW' | 'RED';
  @ApiProperty() childName!: string;
  @ApiProperty() childId!: string;
}

class AttentionItemDto {
  @ApiProperty() resultId!: string;
  @ApiProperty() testName!: string;
  @ApiProperty() shortLabel!: string;
  @ApiProperty() scorePct!: number;
  @ApiProperty() riskZone!: 'YELLOW' | 'RED';
  @ApiProperty() childId!: string;
  @ApiProperty() childName!: string;
}

class AiRecommendationDto {
  @ApiProperty() testId!: string;
  @ApiProperty() testName!: string;
  @ApiProperty() reason!: string;
  @ApiProperty() childId!: string;
  @ApiProperty() childName!: string;
  @ApiProperty({ enum: ['rule_v1', 'llm_v1'] }) source!: 'rule_v1' | 'llm_v1';
  @ApiProperty() generatedAt!: string;
}

class UpcomingConsultationPsyDto {
  @ApiProperty() id!: string;
  @ApiProperty() fullName!: string;
  @ApiProperty({ nullable: true }) avatarUrl!: string | null;
}

class UpcomingConsultationDto {
  @ApiProperty() id!: string;
  @ApiProperty() startsAt!: string;
  @ApiProperty({ type: UpcomingConsultationPsyDto }) psychologist!: UpcomingConsultationPsyDto;
  @ApiProperty() topic!: string;
}

export class ParentOverviewDto {
  @ApiProperty({ type: ParentInfoDto }) parent!: ParentInfoDto;
  @ApiProperty({ type: [ParentChildDto] }) children!: ParentChildDto[];
  @ApiProperty({ type: ParentTotalsDto }) totals!: ParentTotalsDto;
  @ApiProperty({ type: [RecentResultDto] }) recentResults!: RecentResultDto[];
  @ApiProperty({ type: [AttentionItemDto] }) attentionZone!: AttentionItemDto[];
  @ApiProperty({ type: AiRecommendationDto, nullable: true }) aiRecommendation!: AiRecommendationDto | null;
  @ApiProperty({ type: UpcomingConsultationDto, nullable: true }) upcomingConsultation!: UpcomingConsultationDto | null;
}
