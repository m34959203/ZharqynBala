import { Controller, Get, Query, UseGuards, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { AnalyticsService } from './analytics.service';

@ApiTags('Analytics')
@Controller('analytics')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('dashboard')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Get dashboard metrics' })
  async getDashboard() {
    return this.analyticsService.getDashboardMetrics();
  }

  @Get('users')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Get user analytics' })
  async getUserAnalytics(@Query('days') days?: string) {
    return this.analyticsService.getUserAnalytics(
      days ? parseInt(days, 10) : 30,
    );
  }

  @Get('tests')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Get test analytics' })
  async getTestAnalytics(@Query('testId') testId?: string) {
    return this.analyticsService.getTestAnalytics(testId);
  }

  @Get('children')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Get children analytics' })
  async getChildAnalytics(@Query('userId') userId?: string) {
    return this.analyticsService.getChildAnalytics(userId);
  }

  @Get('revenue')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Get revenue analytics' })
  async getRevenueAnalytics(@Query('months') months?: string) {
    return this.analyticsService.getRevenueAnalytics(
      months ? parseInt(months, 10) : 12,
    );
  }

  @Get('export')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Export analytics data' })
  async exportAnalytics(
    @Query('type') type: 'users' | 'tests' | 'revenue' | 'children',
    @Query('format') format: 'json' | 'csv' = 'json',
  ) {
    let data: any;

    switch (type) {
      case 'users':
        data = await this.analyticsService.getUserAnalytics();
        break;
      case 'tests':
        data = await this.analyticsService.getTestAnalytics();
        break;
      case 'revenue':
        data = await this.analyticsService.getRevenueAnalytics();
        break;
      case 'children':
        data = await this.analyticsService.getChildAnalytics();
        break;
      default:
        data = await this.analyticsService.getDashboardMetrics();
    }

    if (format === 'csv') {
      return this.convertToCsv(data);
    }

    return data;
  }

  private convertToCsv(data: any): string {
    if (Array.isArray(data)) {
      if (data.length === 0) return '';
      const headers = Object.keys(data[0]).join(',');
      const rows = data.map((item) =>
        Object.values(item)
          .map((v) => `"${String(v).replace(/"/g, '""')}"`)
          .join(','),
      );
      return [headers, ...rows].join('\n');
    }

    // For objects, flatten and convert
    const flattened = this.flattenObject(data);
    const headers = Object.keys(flattened).join(',');
    const values = Object.values(flattened)
      .map((v) => `"${String(v).replace(/"/g, '""')}"`)
      .join(',');
    return `${headers}\n${values}`;
  }

  private flattenObject(obj: any, prefix = ''): Record<string, any> {
    const result: Record<string, any> = {};

    for (const key in obj) {
      const newKey = prefix ? `${prefix}_${key}` : key;

      if (typeof obj[key] === 'object' && !Array.isArray(obj[key])) {
        Object.assign(result, this.flattenObject(obj[key], newKey));
      } else if (Array.isArray(obj[key])) {
        result[newKey] = JSON.stringify(obj[key]);
      } else {
        result[newKey] = obj[key];
      }
    }

    return result;
  }
}
