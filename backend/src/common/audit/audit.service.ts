import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

// Map our audit actions to SecurityEventType enum
export enum AuditAction {
  LOGIN = 'LOGIN',
  LOGOUT = 'LOGOUT',
  FAILED_LOGIN = 'FAILED_LOGIN',
  PASSWORD_CHANGE = 'PASSWORD_CHANGE',
  DATA_ACCESS = 'DATA_ACCESS',
  PERMISSION_CHANGE = 'PERMISSION_CHANGE',
  MFA_DISABLED = 'MFA_DISABLED',
}

interface AuditLogEntry {
  userId?: string;
  action: AuditAction;
  ip: string;
  userAgent: string;
  metadata?: Record<string, any>;
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private readonly prisma: PrismaService) {}

  async log(entry: AuditLogEntry): Promise<void> {
    try {
      // Use SecurityLog model which exists in schema
      await this.prisma.securityLog.create({
        data: {
          userId: entry.userId,
          eventType: entry.action as any, // Maps to SecurityEventType enum
          ipAddress: entry.ip,
          userAgent: entry.userAgent,
          metadata: entry.metadata || {},
        },
      });

      this.logger.log(
        `Audit: ${entry.action} by ${entry.userId || 'anonymous'}`,
      );
    } catch (error) {
      this.logger.error(`Failed to write audit log: ${error.message}`);
      // Don't throw - audit failures shouldn't break the application
    }
  }

  async getAuditLogs(filters: {
    userId?: string;
    action?: AuditAction;
    startDate?: Date;
    endDate?: Date;
    page?: number;
    limit?: number;
  }): Promise<{ data: any[]; total: number }> {
    const where: any = {};

    if (filters.userId) where.userId = filters.userId;
    if (filters.action) where.eventType = filters.action;

    if (filters.startDate || filters.endDate) {
      where.createdAt = {};
      if (filters.startDate) where.createdAt.gte = filters.startDate;
      if (filters.endDate) where.createdAt.lte = filters.endDate;
    }

    const page = filters.page || 1;
    const limit = filters.limit || 50;

    const [data, total] = await Promise.all([
      this.prisma.securityLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          user: {
            select: { id: true, email: true, firstName: true, lastName: true },
          },
        },
      }),
      this.prisma.securityLog.count({ where }),
    ]);

    return { data, total };
  }

  async getUserActivity(userId: string, days: number = 30): Promise<any[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    return this.prisma.securityLog.findMany({
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

    return this.prisma.securityLog.findMany({
      where: {
        createdAt: { gte: startDate },
        eventType: {
          in: ['LOGIN', 'FAILED_LOGIN', 'PASSWORD_CHANGE'],
        },
      },
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: { id: true, email: true, firstName: true, lastName: true },
        },
      },
    });
  }

  async getFailedAttempts(ip: string, minutes: number = 15): Promise<number> {
    const startDate = new Date();
    startDate.setMinutes(startDate.getMinutes() - minutes);

    return this.prisma.securityLog.count({
      where: {
        ipAddress: ip,
        eventType: 'FAILED_LOGIN',
        createdAt: { gte: startDate },
      },
    });
  }

  async getSuspiciousActivity(): Promise<any[]> {
    const oneHourAgo = new Date();
    oneHourAgo.setHours(oneHourAgo.getHours() - 1);

    // Find IPs with multiple failed logins
    const failedLogins = await this.prisma.securityLog.groupBy({
      by: ['ipAddress'],
      where: {
        eventType: 'FAILED_LOGIN',
        createdAt: { gte: oneHourAgo },
      },
      _count: { id: true },
      having: {
        id: { _count: { gte: 5 } },
      },
    });

    // Find users with unusual activity patterns
    const unusualPatterns = await this.prisma.securityLog.groupBy({
      by: ['userId'],
      where: {
        createdAt: { gte: oneHourAgo },
        userId: { not: null },
      },
      _count: { id: true },
      having: {
        id: { _count: { gte: 100 } },
      },
    });

    return [
      ...failedLogins.map((f: any) => ({
        type: 'failed_logins',
        ip: f.ipAddress,
        count: f._count.id,
      })),
      ...unusualPatterns.map((u: any) => ({
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

    const result = await this.prisma.securityLog.deleteMany({
      where: {
        createdAt: { lt: cutoffDate },
      },
    });

    this.logger.log(`Cleaned up ${result.count} old audit logs`);
    return result.count;
  }
}
