import { ApiProperty } from '@nestjs/swagger';

class UsersOverviewDto {
  @ApiProperty({ example: 146 }) total!: number;
  @ApiProperty({ example: 121 }) parents!: number;
  @ApiProperty({ example: 20 }) psychologists!: number;
  @ApiProperty({ example: 4 }) schools!: number;
  @ApiProperty({ example: 1 }) admins!: number;
  @ApiProperty({ example: 11, description: 'Прирост за последние 7 дней' })
  deltaWeek!: number;
}

class ChildrenOverviewDto {
  @ApiProperty({ example: 175 }) total!: number;
  @ApiProperty({ example: 1.46, nullable: true, description: 'Среднее число детей на родителя; null если parents = 0' })
  perParent!: number | null;
  @ApiProperty({ example: 14 }) deltaWeek!: number;
}

class PsychologistsOverviewDto {
  @ApiProperty({ example: 15 }) approved!: number;
  @ApiProperty({ example: 2 }) pending!: number;
  @ApiProperty({ example: 1 }) rejected!: number;
  @ApiProperty({ example: 3 }) deltaWeek!: number;
}

class TestsOverviewDto {
  @ApiProperty({ example: 488, description: 'Завершённые прохождения тестов' })
  passed!: number;
  @ApiProperty({ example: 0.27, description: 'Доля премиум-прохождений (0..1)' })
  premiumShare!: number;
  @ApiProperty({ example: 42 }) deltaWeek!: number;
}

class RevenueOverviewDto {
  @ApiProperty({ example: 18450000, description: 'KZT за текущий календарный месяц' })
  monthAmountKzt!: number;
  @ApiProperty({ example: 2767500, description: 'Комиссия платформы (15%)' })
  commissionKzt!: number;
  @ApiProperty({ example: 23.4, description: 'Прирост vs прошлый полный месяц, %' })
  deltaMomPct!: number;
}

class ConversionOverviewDto {
  @ApiProperty({ example: 11.8, description: 'Диагностика → консультация, %' })
  diagnosticToConsultPct!: number;
  @ApiProperty({ example: 1.4, description: 'Дельта в процентных пунктах vs прошлого периода' })
  deltaPp!: number;
  @ApiProperty({ example: 8, description: 'Целевое значение, %' })
  target!: number;
  @ApiProperty({ example: 10.4, description: 'Конверсия за прошлый месяц, %' })
  previousMonthPct!: number;
}

class HealthOverviewDto {
  @ApiProperty({ example: 12 }) servicesOnline!: number;
  @ApiProperty({ example: 12 }) servicesTotal!: number;
  @ApiProperty({ example: null, nullable: true, type: String })
  lastIncidentAt!: string | null;
}

export class PsychologistInModerationDto {
  @ApiProperty() id!: string;
  @ApiProperty({ example: 'Аяна Каримова' }) fullName!: string;
  @ApiProperty({ example: 'АК' }) initials!: string;
  @ApiProperty({ example: 'tone-rose' }) tone!: string;
  @ApiProperty({ example: 6 }) experienceYears!: number;
  @ApiProperty({ example: 'КазНУ им. аль-Фараби' }) education!: string;
  @ApiProperty({ example: '2026-05-12T10:00:00Z' }) appliedAt!: string;
}

export class TopTestDto {
  @ApiProperty({ example: 1 }) rank!: number;
  @ApiProperty({ example: 'Школьная мотивация' }) name!: string;
  @ApiProperty({ example: 'Лусканова Н. Г.' }) author!: string;
  @ApiProperty({ example: 8142 }) count!: number;
  @ApiProperty({ example: 8142, description: 'Максимум из всех топов для нормирования прогресс-бара' })
  max!: number;
}

export class RegionStatDto {
  @ApiProperty({ example: 'Алматы' }) name!: string;
  @ApiProperty({ example: 250 }) count!: number;
  @ApiProperty({ example: 42, description: 'Доля от total в %' }) percent!: number;
}

export class RevenueTimeseriesPointDto {
  @ApiProperty({ example: 'Май' }) label!: string;
  @ApiProperty({ example: 18450000 }) value!: number;
  @ApiProperty({ example: true }) current!: boolean;
}

export class RevenueTimeseriesDto {
  @ApiProperty({ enum: ['week', 'month', 'year'] }) range!: 'week' | 'month' | 'year';
  @ApiProperty({ example: 'KZT' }) unit!: string;
  @ApiProperty({ example: 20000000, description: 'Округлённый максимум для Y-оси' })
  max!: number;
  @ApiProperty({ type: [RevenueTimeseriesPointDto] }) data!: RevenueTimeseriesPointDto[];
}

export class AdminOverviewDto {
  @ApiProperty({ type: UsersOverviewDto }) users!: UsersOverviewDto;
  @ApiProperty({ type: ChildrenOverviewDto }) children!: ChildrenOverviewDto;
  @ApiProperty({ type: PsychologistsOverviewDto }) psychologists!: PsychologistsOverviewDto;
  @ApiProperty({ type: TestsOverviewDto }) tests!: TestsOverviewDto;
  @ApiProperty({ type: RevenueOverviewDto }) revenue!: RevenueOverviewDto;
  @ApiProperty({ type: ConversionOverviewDto }) conversion!: ConversionOverviewDto;
  @ApiProperty({ type: HealthOverviewDto }) health!: HealthOverviewDto;
}
