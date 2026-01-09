import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import {
  PsychologistResponseDto,
  PsychologistDetailResponseDto,
  PsychologistListResponseDto,
} from './dto';

@Injectable()
export class PsychologistsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Получить список одобренных и доступных психологов
   */
  async findAll(params: {
    page?: number;
    limit?: number;
    specialization?: string;
  }): Promise<PsychologistListResponseDto> {
    const { page = 1, limit = 10, specialization } = params;
    const skip = (page - 1) * limit;

    const where = {
      isApproved: true,
      isAvailable: true,
      ...(specialization && {
        specialization: {
          has: specialization,
        },
      }),
    };

    const [psychologists, total] = await Promise.all([
      this.prisma.psychologist.findMany({
        where,
        skip,
        take: limit,
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true,
              avatarUrl: true,
            },
          },
        },
        orderBy: [
          { rating: 'desc' },
          { totalConsultations: 'desc' },
        ],
      }),
      this.prisma.psychologist.count({ where }),
    ]);

    return {
      psychologists: psychologists.map((p) => this.mapToResponse(p)),
      total,
      page,
      limit,
    };
  }

  /**
   * Получить психолога по ID с детальной информацией
   */
  async findOne(id: string): Promise<PsychologistDetailResponseDto> {
    const psychologist = await this.prisma.psychologist.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            avatarUrl: true,
          },
        },
        availability: true,
      },
    });

    if (!psychologist) {
      throw new NotFoundException('Психолог не найден');
    }

    if (!psychologist.isApproved) {
      throw new NotFoundException('Психолог не найден');
    }

    return {
      id: psychologist.id,
      firstName: psychologist.user.firstName,
      lastName: psychologist.user.lastName || '',
      avatarUrl: psychologist.user.avatarUrl,
      specialization: psychologist.specialization,
      experienceYears: psychologist.experienceYears,
      education: psychologist.education,
      bio: psychologist.bio,
      hourlyRate: psychologist.hourlyRate,
      rating: psychologist.rating,
      totalConsultations: psychologist.totalConsultations,
      isAvailable: psychologist.isAvailable,
      certificateUrl: psychologist.certificateUrl,
      availability: psychologist.availability.map((a) => ({
        dayOfWeek: a.dayOfWeek,
        startTime: a.startTime,
        endTime: a.endTime,
      })),
    };
  }

  /**
   * Получить доступные слоты психолога на определенный период
   */
  async getAvailableSlots(
    psychologistId: string,
    startDate: string,
    endDate: string,
  ): Promise<{ date: string; hour: number }[]> {
    const psychologist = await this.prisma.psychologist.findUnique({
      where: { id: psychologistId },
    });

    if (!psychologist || !psychologist.isApproved) {
      throw new NotFoundException('Психолог не найден');
    }

    const slots = await this.prisma.scheduleSlot.findMany({
      where: {
        psychologistId,
        isAvailable: true,
        date: {
          gte: new Date(startDate),
          lte: new Date(endDate),
        },
      },
      orderBy: [{ date: 'asc' }, { hour: 'asc' }],
    });

    return slots.map((s) => ({
      date: s.date.toISOString().split('T')[0],
      hour: s.hour,
    }));
  }

  /**
   * Маппинг в DTO ответа
   */
  private mapToResponse(psychologist: {
    id: string;
    specialization: string[];
    experienceYears: number;
    education: string;
    bio: string | null;
    hourlyRate: number;
    rating: number;
    totalConsultations: number;
    isAvailable: boolean;
    user: {
      firstName: string;
      lastName: string | null;
      avatarUrl: string | null;
    };
  }): PsychologistResponseDto {
    return {
      id: psychologist.id,
      firstName: psychologist.user.firstName,
      lastName: psychologist.user.lastName || '',
      avatarUrl: psychologist.user.avatarUrl,
      specialization: psychologist.specialization,
      experienceYears: psychologist.experienceYears,
      education: psychologist.education,
      bio: psychologist.bio,
      hourlyRate: psychologist.hourlyRate,
      rating: psychologist.rating,
      totalConsultations: psychologist.totalConsultations,
      isAvailable: psychologist.isAvailable,
    };
  }
}
