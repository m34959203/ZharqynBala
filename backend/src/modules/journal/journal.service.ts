import { Injectable, Logger, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateActivityLogDto, UpdateActivityLogDto } from './dto/journal.dto';

@Injectable()
export class JournalService {
  private readonly logger = new Logger(JournalService.name);

  constructor(private readonly prisma: PrismaService) {}

  private async getPsychologistId(userId: string): Promise<string> {
    const psychologist = await this.prisma.psychologist.findUnique({
      where: { userId },
    });
    if (!psychologist) {
      throw new ForbiddenException('Psychologist profile not found');
    }
    return psychologist.id;
  }

  async create(userId: string, dto: CreateActivityLogDto) {
    const psychologistId = await this.getPsychologistId(userId);

    return this.prisma.activityLog.create({
      data: {
        psychologistId,
        type: dto.type,
        title: dto.title,
        description: dto.description,
        date: new Date(dto.date),
        schoolId: dto.schoolId,
        classGrade: dto.classGrade,
        classLetter: dto.classLetter,
        studentsCount: dto.studentsCount,
        duration: dto.duration,
        result: dto.result,
      },
    });
  }

  async findAll(filters: {
    userId: string;
    role: string;
    type?: string;
    dateFrom?: string;
    dateTo?: string;
    classGrade?: number;
    page?: number;
    limit?: number;
  }) {
    const where: any = {};

    // Psychologists can only see their own entries
    if (filters.role === 'PSYCHOLOGIST') {
      const psychologistId = await this.getPsychologistId(filters.userId);
      where.psychologistId = psychologistId;
    }

    if (filters.type) {
      where.type = filters.type;
    }

    if (filters.dateFrom || filters.dateTo) {
      where.date = {};
      if (filters.dateFrom) where.date.gte = new Date(filters.dateFrom);
      if (filters.dateTo) where.date.lte = new Date(filters.dateTo);
    }

    if (filters.classGrade) {
      where.classGrade = filters.classGrade;
    }

    const page = filters.page || 1;
    const limit = filters.limit || 20;

    const [entries, total] = await Promise.all([
      this.prisma.activityLog.findMany({
        where,
        include: {
          psychologist: {
            include: {
              user: { select: { firstName: true, lastName: true } },
            },
          },
        },
        orderBy: { date: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.activityLog.count({ where }),
    ]);

    return { entries, total, page, limit };
  }

  async findOne(id: string) {
    const entry = await this.prisma.activityLog.findUnique({
      where: { id },
      include: {
        psychologist: {
          include: {
            user: { select: { firstName: true, lastName: true } },
          },
        },
      },
    });
    if (!entry) throw new NotFoundException('Activity log entry not found');
    return entry;
  }

  async update(id: string, userId: string, dto: UpdateActivityLogDto) {
    const psychologistId = await this.getPsychologistId(userId);

    const entry = await this.prisma.activityLog.findUnique({ where: { id } });
    if (!entry) throw new NotFoundException('Activity log entry not found');
    if (entry.psychologistId !== psychologistId) {
      throw new ForbiddenException('You can only edit your own entries');
    }

    const data: any = {};
    if (dto.type !== undefined) data.type = dto.type;
    if (dto.title !== undefined) data.title = dto.title;
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.date !== undefined) data.date = new Date(dto.date);
    if (dto.schoolId !== undefined) data.schoolId = dto.schoolId;
    if (dto.classGrade !== undefined) data.classGrade = dto.classGrade;
    if (dto.classLetter !== undefined) data.classLetter = dto.classLetter;
    if (dto.studentsCount !== undefined) data.studentsCount = dto.studentsCount;
    if (dto.duration !== undefined) data.duration = dto.duration;
    if (dto.result !== undefined) data.result = dto.result;

    return this.prisma.activityLog.update({
      where: { id },
      data,
    });
  }

  async delete(id: string, userId: string) {
    const psychologistId = await this.getPsychologistId(userId);

    const entry = await this.prisma.activityLog.findUnique({ where: { id } });
    if (!entry) throw new NotFoundException('Activity log entry not found');
    if (entry.psychologistId !== psychologistId) {
      throw new ForbiddenException('You can only delete your own entries');
    }

    return this.prisma.activityLog.delete({ where: { id } });
  }

  async getStats(userId: string, role: string) {
    const where: any = {};

    if (role === 'PSYCHOLOGIST') {
      const psychologistId = await this.getPsychologistId(userId);
      where.psychologistId = psychologistId;
    }

    const [total, byType, totalDuration] = await Promise.all([
      this.prisma.activityLog.count({ where }),
      this.prisma.activityLog.groupBy({
        by: ['type'],
        where,
        _count: true,
        _sum: { duration: true },
      }),
      this.prisma.activityLog.aggregate({
        where,
        _sum: { duration: true, studentsCount: true },
      }),
    ]);

    return {
      total,
      totalHours: Math.round((totalDuration._sum.duration || 0) / 60 * 10) / 10,
      totalStudents: totalDuration._sum.studentsCount || 0,
      byType: Object.fromEntries(
        byType.map(t => [t.type, { count: t._count, hours: Math.round((t._sum.duration || 0) / 60 * 10) / 10 }]),
      ),
    };
  }
}
