import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateEventDto, UpdateEventDto } from './dto/calendar.dto';

@Injectable()
export class CalendarService {
  private readonly logger = new Logger(CalendarService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateEventDto) {
    return this.prisma.scheduledEvent.create({
      data: {
        schoolId: dto.schoolId,
        testId: dto.testId,
        classId: dto.classId || null,
        title: dto.title,
        description: dto.description,
        quarter: dto.quarter,
        academicYear: dto.academicYear,
        startDate: new Date(dto.startDate),
        endDate: new Date(dto.endDate),
        createdBy: userId,
      },
      include: { test: true, class: true },
    });
  }

  async findAll(filters: {
    schoolId?: string;
    quarter?: number;
    academicYear?: string;
    status?: string;
    from?: string;
    to?: string;
  }) {
    const where: any = {};
    if (filters.schoolId) where.schoolId = filters.schoolId;
    if (filters.quarter) where.quarter = filters.quarter;
    if (filters.academicYear) where.academicYear = filters.academicYear;
    if (filters.status) where.status = filters.status;
    if (filters.from || filters.to) {
      where.startDate = {};
      if (filters.from) where.startDate.gte = new Date(filters.from);
      if (filters.to) where.startDate.lte = new Date(filters.to);
    }

    return this.prisma.scheduledEvent.findMany({
      where,
      include: {
        test: { select: { titleRu: true, titleKz: true, category: true } },
        class: { select: { grade: true, letter: true } },
      },
      orderBy: { startDate: 'asc' },
    });
  }

  async findOne(id: string) {
    const event = await this.prisma.scheduledEvent.findUnique({
      where: { id },
      include: { test: true, class: true, school: true },
    });
    if (!event) throw new NotFoundException('Event not found');
    return event;
  }

  async update(id: string, dto: UpdateEventDto) {
    const event = await this.prisma.scheduledEvent.findUnique({ where: { id } });
    if (!event) throw new NotFoundException('Event not found');

    const data: any = {};
    if (dto.title) data.title = dto.title;
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.status) data.status = dto.status;
    if (dto.startDate) data.startDate = new Date(dto.startDate);
    if (dto.endDate) data.endDate = new Date(dto.endDate);

    return this.prisma.scheduledEvent.update({
      where: { id },
      data,
      include: { test: true, class: true },
    });
  }

  async remove(id: string) {
    const event = await this.prisma.scheduledEvent.findUnique({ where: { id } });
    if (!event) throw new NotFoundException('Event not found');
    return this.prisma.scheduledEvent.delete({ where: { id } });
  }

  async getBySchool(schoolId: string, academicYear?: string) {
    const where: any = { schoolId };
    if (academicYear) where.academicYear = academicYear;

    const events = await this.prisma.scheduledEvent.findMany({
      where,
      include: {
        test: { select: { titleRu: true, titleKz: true, category: true } },
        class: { select: { grade: true, letter: true } },
      },
      orderBy: { startDate: 'asc' },
    });

    // Group by quarter
    const byQuarter: Record<number, typeof events> = { 1: [], 2: [], 3: [], 4: [] };
    for (const e of events) {
      const q = e.quarter || 1;
      if (!byQuarter[q]) byQuarter[q] = [];
      byQuarter[q].push(e);
    }

    return { events, byQuarter, total: events.length };
  }
}
