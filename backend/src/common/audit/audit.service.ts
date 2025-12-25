import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export enum AuditAction {
  // Authentication
  LOGIN = 'LOGIN',
  LOGOUT = 'LOGOUT',
  REGISTER = 'REGISTER',
  PASSWORD_RESET = 'PASSWORD_RESET',
  PASSWORD_CHANGE = 'PASSWORD_CHANGE',

  // User actions
  PROFILE_UPDATE = 'PROFILE_UPDATE',
  ACCOUNT_DELETE = 'ACCOUNT_DELETE',

  // Children
  CHILD_CREATE = 'CHILD_CREATE',
  CHILD_UPDATE = 'CHILD_UPDATE',
  CHILD_DELETE = 'CHILD_DELETE',

  // Tests
  TEST_START = 'TEST_START',
  TEST_COMPLETE = 'TEST_COMPLETE',
  TEST_ABANDON = 'TEST_ABANDON',

  // Payments
  PAYMENT_INITIATE = 'PAYMENT_INITIATE',
  PAYMENT_COMPLETE = 'PAYMENT_COMPLETE',
  PAYMENT_FAIL = 'PAYMENT_FAIL',
  PAYMENT_REFUND = 'PAYMENT_REFUND',
  SUBSCRIPTION_ACTIVATE = 'SUBSCRIPTION_ACTIVATE',
  SUBSCRIPTION_CANCEL = 'SUBSCRIPTION_CANCEL',

  // Consultations
  CONSULTATION_BOOK = 'CONSULTATION_BOOK',
  CONSULTATION_CANCEL = 'CONSULTATION_CANCEL',
  CONSULTATION_COMPLETE = 'CONSULTATION_COMPLETE',

  // Admin actions
  ADMIN_USER_UPDATE = 'ADMIN_USER_UPDATE',
  ADMIN_USER_DELETE = 'ADMIN_USER_DELETE',
  ADMIN_SETTINGS_UPDATE = 'ADMIN_SETTINGS_UPDATE',
  ADMIN_TEST_CREATE = 'ADMIN_TEST_CREATE',
  ADMIN_TEST_UPDATE = 'ADMIN_TEST_UPDATE',
  ADMIN_TEST_DELETE = 'ADMIN_TEST_DELETE',

  // Data access
  DATA_EXPORT = 'DATA_EXPORT',
  RESULT_VIEW = 'RESULT_VIEW',
  RESULT_SHARE = 'RESULT_SHARE',
}

interface AuditLogEntry {
  userId?: string;
  action: AuditAction;
  resource?: string;
  resourceId?: string;
  details?: Record<string, any>;
  ip?: string;
  userAgent?: string;
  success?: boolean;
  errorMessage?: string;
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private readonly prisma: PrismaService) {}

  async log(entry: AuditLogEntry): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: {
          userId: entry.userId,
          action: entry.action,
          resource: entry.resource,
          resourceId: entry.resourceId,
          details: entry.details || {},
          ip: entry.ip,
          userAgent: entry.userAgent,
          success: entry.success ?? true,
          errorMessage: entry.errorMessage,
          createdAt: new Date(),
        },
      });

      this.logger.log(
        `Audit: ${entry.action} by ${entry.userId || 'anonymous'} on ${entry.resource || 'system'}`,
      );
    } catch (error) {
      this.logger.error(`Failed to write audit log: ${error.message}`);
      // Don't throw - audit failures shouldn't break the application
    }
  }

  async getAuditLogs(filters: {
    userId?: string;
    action?: AuditAction;
    resource?: string;
    startDate?: Date;
    endDate?: Date;
    page?: number;
    limit?: number;
  }): Promise<{ data: any[]; total: number }> {
    const where: any = {};

    if (filters.userId) where.userId = filters.userId;
    if (filters.action) where.action = filters.action;
    if (filters.resource) where.resource = filters.resource;

    if (filters.startDate || filters.endDate) {
      where.createdAt = {};
      if (filters.startDate) where.createdAt.gte = filters.startDate;
      if (filters.endDate) where.createdAt.lte = filters.endDate;
    }

    const page = filters.page || 1;
    const limit = filters.limit || 50;

    const [data, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          user: {
            select: { id: true, email: true, name: true },
          },
        },
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return { data, total };
  }

  async getUserActivity(userId: string, days: number = 30): Promise<any[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    return this.prisma.auditLog.findMany({
      where: {
        userId,
        createdAt: { gte: startDate },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  async getSecurityEvents(hours: number = 24): Promise<any[]> {
    const startDate = new Date();
    startDate.setHours(startDate.getHours() - hours);

    return this.prisma.auditLog.findMany({
      where: {
        createdAt: { gte: startDate },
        action: {
          in: [
            AuditAction.LOGIN,
            AuditAction.PASSWORD_RESET,
            AuditAction.PASSWORD_CHANGE,
            AuditAction.ACCOUNT_DELETE,
          ],
        },
      },
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: { id: true, email: true, name: true },
        },
      },
    });
  }

  async getFailedAttempts(ip: string, minutes: number = 15): Promise<number> {
    const startDate = new Date();
    startDate.setMinutes(startDate.getMinutes() - minutes);

    return this.prisma.auditLog.count({
      where: {
        ip,
        success: false,
        action: AuditAction.LOGIN,
        createdAt: { gte: startDate },
      },
    });
  }

  async getSuspiciousActivity(): Promise<any[]> {
    const oneHourAgo = new Date();
    oneHourAgo.setHours(oneHourAgo.getHours() - 1);

    // Find IPs with multiple failed logins
    const failedLogins = await this.prisma.auditLog.groupBy({
      by: ['ip'],
      where: {
        action: AuditAction.LOGIN,
        success: false,
        createdAt: { gte: oneHourAgo },
      },
      _count: { id: true },
      having: {
        id: { _count: { gte: 5 } },
      },
    });

    // Find users with unusual activity patterns
    const unusualPatterns = await this.prisma.auditLog.groupBy({
      by: ['userId'],
      where: {
        createdAt: { gte: oneHourAgo },
      },
      _count: { id: true },
      having: {
        id: { _count: { gte: 100 } },
      },
    });

    return [
      ...failedLogins.map((f) => ({
        type: 'failed_logins',
        ip: f.ip,
        count: f._count.id,
      })),
      ...unusualPatterns.map((u) => ({
        type: 'high_activity',
        userId: u.userId,
        count: u._count.id,
      })),
    ];
  }

  // Cleanup old audit logs
  async cleanupOldLogs(retentionDays: number = 90): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    const result = await this.prisma.auditLog.deleteMany({
      where: {
        createdAt: { lt: cutoffDate },
      },
    });

    this.logger.log(`Cleaned up ${result.count} old audit logs`);
    return result.count;
  }
}
