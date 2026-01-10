import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import {
  PsychologistResponseDto,
  PsychologistDetailResponseDto,
  PsychologistListResponseDto,
  UpdatePsychologistProfileDto,
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
      languages: psychologist.languages,
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
   * Получить собственный профиль психолога
   */
  async getMyProfile(userId: string): Promise<PsychologistDetailResponseDto & { isProfileComplete: boolean }> {
    const psychologist = await this.prisma.psychologist.findUnique({
      where: { userId },
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
      throw new NotFoundException('Профиль психолога не найден');
    }

    // Проверяем заполненность профиля
    const isProfileComplete =
      psychologist.specialization.length > 0 &&
      psychologist.experienceYears > 0 &&
      psychologist.education !== 'Не указано' &&
      psychologist.bio !== null;

    return {
      id: psychologist.id,
      firstName: psychologist.user.firstName,
      lastName: psychologist.user.lastName || '',
      avatarUrl: psychologist.user.avatarUrl,
      specialization: psychologist.specialization,
      languages: psychologist.languages,
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
      isProfileComplete,
    };
  }

  /**
   * Обновить профиль психолога
   */
  async updateMyProfile(
    userId: string,
    dto: UpdatePsychologistProfileDto,
  ): Promise<PsychologistDetailResponseDto> {
    const psychologist = await this.prisma.psychologist.findUnique({
      where: { userId },
    });

    if (!psychologist) {
      throw new NotFoundException('Профиль психолога не найден');
    }

    const updated = await this.prisma.psychologist.update({
      where: { userId },
      data: {
        specialization: dto.specialization,
        languages: dto.languages,
        experienceYears: dto.experienceYears,
        education: dto.education,
        bio: dto.bio,
        hourlyRate: dto.hourlyRate,
        certificateUrl: dto.certificateUrl,
      },
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

    return {
      id: updated.id,
      firstName: updated.user.firstName,
      lastName: updated.user.lastName || '',
      avatarUrl: updated.user.avatarUrl,
      specialization: updated.specialization,
      languages: updated.languages,
      experienceYears: updated.experienceYears,
      education: updated.education,
      bio: updated.bio,
      hourlyRate: updated.hourlyRate,
      rating: updated.rating,
      totalConsultations: updated.totalConsultations,
      isAvailable: updated.isAvailable,
      certificateUrl: updated.certificateUrl,
      availability: updated.availability.map((a) => ({
        dayOfWeek: a.dayOfWeek,
        startTime: a.startTime,
        endTime: a.endTime,
      })),
    };
  }

  /**
   * Получить клиентов психолога (из истории консультаций)
   */
  async getMyClients(userId: string) {
    const psychologist = await this.prisma.psychologist.findUnique({
      where: { userId },
    });

    if (!psychologist) {
      throw new NotFoundException('Профиль психолога не найден');
    }

    // Получаем уникальных клиентов из консультаций
    const consultations = await this.prisma.consultation.findMany({
      where: {
        psychologistId: psychologist.id,
        status: { in: ['COMPLETED', 'CONFIRMED', 'IN_PROGRESS'] },
      },
      include: {
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            children: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                birthDate: true,
              },
            },
          },
        },
      },
      orderBy: { scheduledAt: 'desc' },
    });

    // Группируем по клиенту
    const clientsMap = new Map<string, {
      id: string;
      name: string;
      email: string;
      phone: string;
      children: { id: string; name: string; age: number }[];
      lastConsultation: string;
      totalConsultations: number;
      status: 'ACTIVE' | 'INACTIVE';
    }>();

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    consultations.forEach((c) => {
      if (!c.client) return;

      const existing = clientsMap.get(c.client.id);
      const consultationDate = new Date(c.scheduledAt);

      if (existing) {
        existing.totalConsultations++;
        if (new Date(existing.lastConsultation) < consultationDate) {
          existing.lastConsultation = c.scheduledAt.toISOString();
        }
      } else {
        const children = c.client.children.map((child) => ({
          id: child.id,
          name: `${child.firstName} ${child.lastName || ''}`.trim(),
          age: Math.floor((now.getTime() - new Date(child.birthDate).getTime()) / (365.25 * 24 * 60 * 60 * 1000)),
        }));

        clientsMap.set(c.client.id, {
          id: c.client.id,
          name: `${c.client.firstName} ${c.client.lastName || ''}`.trim(),
          email: c.client.email,
          phone: c.client.phone || '',
          children,
          lastConsultation: c.scheduledAt.toISOString(),
          totalConsultations: 1,
          status: consultationDate > thirtyDaysAgo ? 'ACTIVE' : 'INACTIVE',
        });
      }
    });

    return Array.from(clientsMap.values()).sort(
      (a, b) => new Date(b.lastConsultation).getTime() - new Date(a.lastConsultation).getTime()
    );
  }

  /**
   * Получить статистику доходов психолога
   */
  async getMyEarnings(userId: string, period: 'week' | 'month' | 'year' = 'month') {
    const psychologist = await this.prisma.psychologist.findUnique({
      where: { userId },
    });

    if (!psychologist) {
      throw new NotFoundException('Профиль психолога не найден');
    }

    const now = new Date();
    let startDate: Date;

    switch (period) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
    }

    // Получаем завершённые консультации за период
    const completedConsultations = await this.prisma.consultation.findMany({
      where: {
        psychologistId: psychologist.id,
        status: 'COMPLETED',
        scheduledAt: { gte: startDate },
      },
      include: {
        client: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { scheduledAt: 'desc' },
    });

    // Получаем все завершённые консультации для общего баланса
    const allCompleted = await this.prisma.consultation.findMany({
      where: {
        psychologistId: psychologist.id,
        status: 'COMPLETED',
      },
    });

    // Ожидающие подтверждения
    const pendingConsultations = await this.prisma.consultation.findMany({
      where: {
        psychologistId: psychologist.id,
        status: 'CONFIRMED',
      },
    });

    // Рассчитываем статистику (15% комиссия платформы)
    const commissionRate = 0.15;
    const hourlyRate = psychologist.hourlyRate;

    const periodEarnings = completedConsultations.length * hourlyRate * (1 - commissionRate);
    const totalBalance = allCompleted.length * hourlyRate * (1 - commissionRate);
    const pending = pendingConsultations.length * hourlyRate * (1 - commissionRate);

    // Формируем историю транзакций
    const transactions = completedConsultations.map((c) => ({
      id: c.id,
      date: c.scheduledAt.toISOString(),
      clientName: `${c.client?.firstName || ''} ${c.client?.lastName || ''}`.trim() || 'Клиент',
      type: 'CONSULTATION' as const,
      amount: hourlyRate * (1 - commissionRate),
      status: 'COMPLETED' as const,
    }));

    return {
      stats: {
        balance: Math.round(totalBalance),
        monthEarnings: Math.round(periodEarnings),
        consultations: completedConsultations.length,
        avgPerConsultation: Math.round(hourlyRate * (1 - commissionRate)),
        pending: Math.round(pending),
      },
      transactions,
    };
  }

  /**
   * Маппинг в DTO ответа
   */
  private mapToResponse(psychologist: {
    id: string;
    specialization: string[];
    languages: string[];
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
      languages: psychologist.languages,
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
