import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateBullyingReportDto, UpdateReportStatusDto } from './dto/bullying.dto';

@Injectable()
export class BullyingService {
  private readonly logger = new Logger(BullyingService.name);

  constructor(private readonly prisma: PrismaService) {}

  async createReport(dto: CreateBullyingReportDto) {
    this.logger.log(`New bullying report: type=${dto.type}, anonymous=${dto.anonymous !== false}`);
    return this.prisma.bullyingReport.create({
      data: {
        type: dto.type,
        description: dto.description,
        schoolId: dto.schoolId || null,
        location: dto.location,
        anonymous: dto.anonymous !== false,
        reporterName: dto.anonymous !== false ? null : dto.reporterName,
        reporterContact: dto.anonymous !== false ? null : dto.reporterContact,
        victimGrade: dto.victimGrade,
      },
    });
  }

  async getReports(schoolId?: string, status?: string, page = 1, limit = 20) {
    const where: any = {};
    if (schoolId) where.schoolId = schoolId;
    if (status) where.status = status;

    const [reports, total] = await Promise.all([
      this.prisma.bullyingReport.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.bullyingReport.count({ where }),
    ]);

    return { reports, total, page, limit };
  }

  async getReport(id: string) {
    const report = await this.prisma.bullyingReport.findUnique({ where: { id } });
    if (!report) throw new NotFoundException('Report not found');
    return report;
  }

  async updateStatus(id: string, dto: UpdateReportStatusDto) {
    const report = await this.prisma.bullyingReport.findUnique({ where: { id } });
    if (!report) throw new NotFoundException('Report not found');

    return this.prisma.bullyingReport.update({
      where: { id },
      data: {
        status: dto.status as any,
        resolution: dto.resolution,
        assignedTo: dto.assignedTo,
        resolvedAt: ['RESOLVED', 'DISMISSED'].includes(dto.status) ? new Date() : null,
      },
    });
  }

  async getStats(schoolId?: string) {
    const where: any = {};
    if (schoolId) where.schoolId = schoolId;

    const [total, byStatus, byType] = await Promise.all([
      this.prisma.bullyingReport.count({ where }),
      this.prisma.bullyingReport.groupBy({
        by: ['status'],
        where,
        _count: true,
      }),
      this.prisma.bullyingReport.groupBy({
        by: ['type'],
        where,
        _count: true,
      }),
    ]);

    return {
      total,
      byStatus: Object.fromEntries(byStatus.map(s => [s.status, s._count])),
      byType: Object.fromEntries(byType.map(t => [t.type, t._count])),
    };
  }
}
