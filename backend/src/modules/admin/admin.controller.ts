import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import {
  DashboardStatsDto,
  UserListDto,
  TestManagementDto,
  SystemSettingsDto,
} from './dto/admin.dto';

@ApiTags('Admin')
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
@ApiBearerAuth()
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  // Dashboard
  @Get('dashboard')
  @ApiOperation({ summary: 'Get admin dashboard stats' })
  @ApiResponse({ status: 200, type: DashboardStatsDto })
  async getDashboardStats(): Promise<DashboardStatsDto> {
    return this.adminService.getDashboardStats();
  }

  @Get('dashboard/activity')
  @ApiOperation({ summary: 'Get recent activity' })
  async getRecentActivity(@Query('limit') limit?: number) {
    return this.adminService.getRecentActivity(limit || 10);
  }

  // Users Management
  @Get('users')
  @ApiOperation({ summary: 'Get all users with filters' })
  async getUsers(
    @Query('role') role?: string,
    @Query('search') search?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.adminService.getUsers({ role, search, page: page || 1, limit: limit || 20 });
  }

  @Patch('users/:id')
  @ApiOperation({ summary: 'Update user' })
  async updateUser(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() data: any,
  ) {
    return this.adminService.updateUser(id, data);
  }

  @Delete('users/:id')
  @ApiOperation({ summary: 'Delete user' })
  async deleteUser(@Param('id', ParseUUIDPipe) id: string) {
    return this.adminService.deleteUser(id);
  }

  @Post('users/:id/ban')
  @ApiOperation({ summary: 'Ban user' })
  async banUser(@Param('id', ParseUUIDPipe) id: string) {
    return this.adminService.banUser(id);
  }

  @Post('users/:id/unban')
  @ApiOperation({ summary: 'Unban user' })
  async unbanUser(@Param('id', ParseUUIDPipe) id: string) {
    return this.adminService.unbanUser(id);
  }

  // Tests Management
  @Get('tests')
  @ApiOperation({ summary: 'Get all tests for management' })
  async getTests() {
    return this.adminService.getTests();
  }

  @Patch('tests/:id')
  @ApiOperation({ summary: 'Update test' })
  async updateTest(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() data: any,
  ) {
    return this.adminService.updateTest(id, data);
  }

  @Post('tests/:id/toggle')
  @ApiOperation({ summary: 'Toggle test active status' })
  async toggleTest(@Param('id', ParseUUIDPipe) id: string) {
    return this.adminService.toggleTest(id);
  }

  // Payments Management
  @Get('payments')
  @ApiOperation({ summary: 'Get all payments' })
  async getPayments(
    @Query('status') status?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('page') page?: number,
  ) {
    return this.adminService.getPayments({ status, from, to, page: page || 1 });
  }

  @Post('payments/:id/refund')
  @ApiOperation({ summary: 'Refund payment' })
  async refundPayment(@Param('id', ParseUUIDPipe) id: string) {
    return this.adminService.refundPayment(id);
  }

  // Psychologists Management
  @Get('psychologists')
  @ApiOperation({ summary: 'Get all psychologists' })
  async getPsychologists() {
    return this.adminService.getPsychologists();
  }

  @Post('psychologists/:id/verify')
  @ApiOperation({ summary: 'Verify psychologist' })
  async verifyPsychologist(@Param('id', ParseUUIDPipe) id: string) {
    return this.adminService.verifyPsychologist(id);
  }

  // System Settings
  @Get('settings')
  @ApiOperation({ summary: 'Get system settings' })
  async getSettings() {
    return this.adminService.getSettings();
  }

  @Patch('settings')
  @ApiOperation({ summary: 'Update system settings' })
  async updateSettings(@Body() data: any) {
    return this.adminService.updateSettings(data);
  }

  // Reports
  @Get('reports/revenue')
  @ApiOperation({ summary: 'Get revenue report' })
  async getRevenueReport(
    @Query('period') period?: 'day' | 'week' | 'month' | 'year',
  ) {
    return this.adminService.getRevenueReport(period || 'month');
  }

  @Get('reports/users')
  @ApiOperation({ summary: 'Get user growth report' })
  async getUserGrowthReport(@Query('period') period?: string) {
    return this.adminService.getUserGrowthReport(period || 'month');
  }

  @Get('reports/tests')
  @ApiOperation({ summary: 'Get tests analytics report' })
  async getTestsReport() {
    return this.adminService.getTestsReport();
  }
}
