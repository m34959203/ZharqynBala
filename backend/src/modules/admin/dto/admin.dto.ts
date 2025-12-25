import { ApiProperty } from '@nestjs/swagger';

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
