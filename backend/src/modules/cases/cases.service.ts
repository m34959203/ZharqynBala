import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateCaseDto, UpdateCaseDto, AddCaseNoteDto } from './dto/cases.dto';

@Injectable()
export class CasesService {
  private readonly logger = new Logger(CasesService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateCaseDto) {
    const psychologist = await this.prisma.psychologist.findUnique({
      where: { userId },
    });

    return this.prisma.studentCase.create({
      data: {
        childId: dto.childId,
        psychologistId: psychologist?.id || null,
        title: dto.title,
        description: dto.description,
        priority: (dto.priority as any) || 'MEDIUM',
        category: dto.category,
        linkedResultIds: dto.linkedResultIds || [],
      },
      include: { child: true, caseNotes: true },
    });
  }

  async findAll(filters: {
    psychologistUserId?: string;
    schoolId?: string;
    status?: string;
    priority?: string;
    page?: number;
    limit?: number;
  }) {
    const where: any = {};

    if (filters.psychologistUserId) {
      const psych = await this.prisma.psychologist.findUnique({
        where: { userId: filters.psychologistUserId },
      });
      if (psych) where.psychologistId = psych.id;
    }
    if (filters.schoolId) where.schoolId = filters.schoolId;
    if (filters.status) where.status = filters.status;
    if (filters.priority) where.priority = filters.priority;

    const page = filters.page || 1;
    const limit = filters.limit || 20;

    const [cases, total] = await Promise.all([
      this.prisma.studentCase.findMany({
        where,
        include: {
          child: true,
          psychologist: { include: { user: { select: { firstName: true, lastName: true } } } },
          caseNotes: { orderBy: { createdAt: 'desc' }, take: 3 },
        },
        orderBy: [
          { priority: 'asc' },
          { openedAt: 'desc' },
        ],
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.studentCase.count({ where }),
    ]);

    return { cases, total, page, limit };
  }

  async findOne(id: string) {
    const studentCase = await this.prisma.studentCase.findUnique({
      where: { id },
      include: {
        child: true,
        psychologist: { include: { user: { select: { firstName: true, lastName: true, email: true } } } },
        caseNotes: {
          include: { author: { select: { firstName: true, lastName: true, role: true } } },
          orderBy: { createdAt: 'desc' },
        },
      },
    });
    if (!studentCase) throw new NotFoundException('Case not found');
    return studentCase;
  }

  async update(id: string, dto: UpdateCaseDto) {
    const existing = await this.prisma.studentCase.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Case not found');

    const data: any = {};
    if (dto.title) data.title = dto.title;
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.priority) data.priority = dto.priority;
    if (dto.status) {
      data.status = dto.status;
      if (dto.status === 'RESOLVED') data.resolvedAt = new Date();
      if (dto.status === 'CLOSED') data.closedAt = new Date();
    }
    if (dto.resolution !== undefined) data.resolution = dto.resolution;
    if (dto.linkedResultIds) data.linkedResultIds = dto.linkedResultIds;

    return this.prisma.studentCase.update({
      where: { id },
      data,
      include: { child: true, caseNotes: true },
    });
  }

  async addNote(caseId: string, authorId: string, dto: AddCaseNoteDto) {
    const studentCase = await this.prisma.studentCase.findUnique({ where: { id: caseId } });
    if (!studentCase) throw new NotFoundException('Case not found');

    return this.prisma.caseNote.create({
      data: {
        caseId,
        authorId,
        content: dto.content,
      },
      include: { author: { select: { firstName: true, lastName: true, role: true } } },
    });
  }

  async getStats(psychologistUserId?: string) {
    const where: any = {};
    if (psychologistUserId) {
      const psych = await this.prisma.psychologist.findUnique({ where: { userId: psychologistUserId } });
      if (psych) where.psychologistId = psych.id;
    }

    const [total, byStatus, byPriority] = await Promise.all([
      this.prisma.studentCase.count({ where }),
      this.prisma.studentCase.groupBy({ by: ['status'], where, _count: true }),
      this.prisma.studentCase.groupBy({ by: ['priority'], where, _count: true }),
    ]);

    return {
      total,
      byStatus: Object.fromEntries(byStatus.map(s => [s.status, s._count])),
      byPriority: Object.fromEntries(byPriority.map(p => [p.priority, p._count])),
    };
  }
}
