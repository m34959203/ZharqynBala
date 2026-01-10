import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { JitsiService } from './jitsi.service';
import {
  CreateConsultationDto,
  ConfirmConsultationDto,
  RejectConsultationDto,
  CancelConsultationDto,
  RateConsultationDto,
  ConsultationResponseDto,
  ConsultationListResponseDto,
  ConsultationDetailResponseDto,
} from './dto';
import { ConsultationStatus, PaymentStatus, UserRole } from '@prisma/client';

@Injectable()
export class ConsultationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jitsiService: JitsiService,
  ) {}

  /**
   * Создать консультацию (клиент записывается к психологу)
   */
  async create(
    clientId: string,
    dto: CreateConsultationDto,
  ): Promise<ConsultationResponseDto> {
    // Проверяем существование психолога
    const psychologist = await this.prisma.psychologist.findUnique({
      where: { id: dto.psychologistId },
      include: { user: true },
    });

    if (!psychologist || !psychologist.isApproved) {
      throw new NotFoundException('Психолог не найден');
    }

    if (!psychologist.isAvailable) {
      throw new BadRequestException('Психолог временно не принимает записи');
    }

    // Проверяем ребёнка, если указан
    if (dto.childId) {
      const child = await this.prisma.child.findFirst({
        where: {
          id: dto.childId,
          parentId: clientId,
        },
      });

      if (!child) {
        throw new NotFoundException('Ребёнок не найден');
      }
    }

    // Проверяем доступность слота
    const scheduledAt = new Date(dto.scheduledAt);
    const existingConsultation = await this.prisma.consultation.findFirst({
      where: {
        psychologistId: dto.psychologistId,
        scheduledAt,
        status: {
          in: [ConsultationStatus.PENDING, ConsultationStatus.CONFIRMED],
        },
      },
    });

    if (existingConsultation) {
      throw new BadRequestException('Это время уже занято');
    }

    // Создаём консультацию
    const consultation = await this.prisma.consultation.create({
      data: {
        psychologistId: dto.psychologistId,
        clientId,
        childId: dto.childId || null,
        scheduledAt,
        durationMinutes: dto.durationMinutes || 50,
        status: ConsultationStatus.PENDING,
        price: psychologist.hourlyRate,
        paymentStatus: PaymentStatus.PENDING,
        notes: dto.notes,
      },
      include: {
        psychologist: {
          include: { user: true },
        },
        client: true,
        child: true,
      },
    });

    return this.mapToResponse(consultation);
  }

  /**
   * Получить список консультаций для клиента
   */
  async findAllForClient(
    clientId: string,
    params: { page?: number; limit?: number; status?: ConsultationStatus },
  ): Promise<ConsultationListResponseDto> {
    const { page = 1, limit = 10, status } = params;
    const skip = (page - 1) * limit;

    const where = {
      clientId,
      ...(status && { status }),
    };

    const [consultations, total] = await Promise.all([
      this.prisma.consultation.findMany({
        where,
        skip,
        take: limit,
        include: {
          psychologist: {
            include: { user: true },
          },
          client: true,
          child: true,
        },
        orderBy: { scheduledAt: 'desc' },
      }),
      this.prisma.consultation.count({ where }),
    ]);

    return {
      consultations: consultations.map((c) => this.mapToResponse(c)),
      total,
      page,
      limit,
    };
  }

  /**
   * Получить список консультаций для психолога
   */
  async findAllForPsychologist(
    userId: string,
    params: { page?: number; limit?: number; status?: ConsultationStatus },
  ): Promise<ConsultationListResponseDto> {
    const { page = 1, limit = 10, status } = params;
    const skip = (page - 1) * limit;

    console.log('[ConsultationsService] findAllForPsychologist - userId:', userId);

    const psychologist = await this.prisma.psychologist.findUnique({
      where: { userId },
    });

    console.log('[ConsultationsService] Found psychologist:', psychologist?.id || 'NOT FOUND');

    if (!psychologist) {
      throw new NotFoundException('Профиль психолога не найден');
    }

    const where = {
      psychologistId: psychologist.id,
      ...(status && { status }),
    };

    console.log('[ConsultationsService] Query where:', JSON.stringify(where));

    const [consultations, total] = await Promise.all([
      this.prisma.consultation.findMany({
        where,
        skip,
        take: limit,
        include: {
          psychologist: {
            include: { user: true },
          },
          client: true,
          child: true,
        },
        orderBy: { scheduledAt: 'desc' },
      }),
      this.prisma.consultation.count({ where }),
    ]);

    console.log('[ConsultationsService] Found consultations:', consultations.length, 'total:', total);

    return {
      consultations: consultations.map((c) => this.mapToResponse(c)),
      total,
      page,
      limit,
    };
  }

  /**
   * Получить консультацию по ID
   */
  async findOne(
    id: string,
    userId: string,
    userRole: UserRole,
  ): Promise<ConsultationDetailResponseDto> {
    const consultation = await this.prisma.consultation.findUnique({
      where: { id },
      include: {
        psychologist: {
          include: { user: true },
        },
        client: true,
        child: true,
      },
    });

    if (!consultation) {
      throw new NotFoundException('Консультация не найдена');
    }

    // Проверяем права доступа
    const isClient = consultation.clientId === userId;
    const isPsychologist = consultation.psychologist.userId === userId;
    const isAdmin = userRole === UserRole.ADMIN;

    if (!isClient && !isPsychologist && !isAdmin) {
      throw new ForbiddenException('Нет доступа к этой консультации');
    }

    return {
      ...this.mapToResponse(consultation),
      roomName: consultation.roomName,
    };
  }

  /**
   * Подтвердить консультацию (психолог)
   */
  async confirm(
    id: string,
    userId: string,
    dto: ConfirmConsultationDto,
  ): Promise<ConsultationDetailResponseDto> {
    const consultation = await this.getConsultationForPsychologist(id, userId);

    if (consultation.status !== ConsultationStatus.PENDING) {
      throw new BadRequestException('Консультация не может быть подтверждена');
    }

    // Создаём видеокомнату
    const { roomName, roomUrl } = await this.jitsiService.createRoom(id);

    const updated = await this.prisma.consultation.update({
      where: { id },
      data: {
        status: ConsultationStatus.CONFIRMED,
        roomName,
        roomUrl,
        notes: dto.notes || consultation.notes,
      },
      include: {
        psychologist: {
          include: { user: true },
        },
        client: true,
        child: true,
      },
    });

    return {
      ...this.mapToResponse(updated),
      roomName: updated.roomName,
    };
  }

  /**
   * Отклонить консультацию (психолог)
   */
  async reject(
    id: string,
    userId: string,
    dto: RejectConsultationDto,
  ): Promise<ConsultationResponseDto> {
    const consultation = await this.getConsultationForPsychologist(id, userId);

    if (consultation.status !== ConsultationStatus.PENDING) {
      throw new BadRequestException('Консультация не может быть отклонена');
    }

    const updated = await this.prisma.consultation.update({
      where: { id },
      data: {
        status: ConsultationStatus.REJECTED,
        cancelReason: dto.reason,
      },
      include: {
        psychologist: {
          include: { user: true },
        },
        client: true,
        child: true,
      },
    });

    return this.mapToResponse(updated);
  }

  /**
   * Отменить консультацию (клиент)
   */
  async cancel(
    id: string,
    clientId: string,
    dto: CancelConsultationDto,
  ): Promise<ConsultationResponseDto> {
    const consultation = await this.prisma.consultation.findUnique({
      where: { id },
      include: {
        psychologist: {
          include: { user: true },
        },
        client: true,
        child: true,
      },
    });

    if (!consultation) {
      throw new NotFoundException('Консультация не найдена');
    }

    if (consultation.clientId !== clientId) {
      throw new ForbiddenException('Нет доступа к этой консультации');
    }

    if (
      consultation.status !== ConsultationStatus.PENDING &&
      consultation.status !== ConsultationStatus.CONFIRMED
    ) {
      throw new BadRequestException('Консультация не может быть отменена');
    }

    const updated = await this.prisma.consultation.update({
      where: { id },
      data: {
        status: ConsultationStatus.CANCELLED,
        cancelReason: dto.reason,
      },
      include: {
        psychologist: {
          include: { user: true },
        },
        client: true,
        child: true,
      },
    });

    return this.mapToResponse(updated);
  }

  /**
   * Начать консультацию (изменить статус на IN_PROGRESS)
   */
  async start(id: string, userId: string): Promise<ConsultationDetailResponseDto> {
    const consultation = await this.prisma.consultation.findUnique({
      where: { id },
      include: {
        psychologist: {
          include: { user: true },
        },
        client: true,
        child: true,
      },
    });

    if (!consultation) {
      throw new NotFoundException('Консультация не найдена');
    }

    const isClient = consultation.clientId === userId;
    const isPsychologist = consultation.psychologist.userId === userId;

    if (!isClient && !isPsychologist) {
      throw new ForbiddenException('Нет доступа к этой консультации');
    }

    if (consultation.status !== ConsultationStatus.CONFIRMED) {
      throw new BadRequestException('Консультация не подтверждена');
    }

    const updated = await this.prisma.consultation.update({
      where: { id },
      data: {
        status: ConsultationStatus.IN_PROGRESS,
      },
      include: {
        psychologist: {
          include: { user: true },
        },
        client: true,
        child: true,
      },
    });

    return {
      ...this.mapToResponse(updated),
      roomName: updated.roomName,
    };
  }

  /**
   * Завершить консультацию (психолог)
   */
  async complete(id: string, userId: string): Promise<ConsultationResponseDto> {
    const consultation = await this.getConsultationForPsychologist(id, userId);

    if (
      consultation.status !== ConsultationStatus.IN_PROGRESS &&
      consultation.status !== ConsultationStatus.CONFIRMED
    ) {
      throw new BadRequestException('Консультация не может быть завершена');
    }

    const updated = await this.prisma.consultation.update({
      where: { id },
      data: {
        status: ConsultationStatus.COMPLETED,
        completedAt: new Date(),
      },
      include: {
        psychologist: {
          include: { user: true },
        },
        client: true,
        child: true,
      },
    });

    // Увеличиваем счётчик консультаций психолога
    await this.prisma.psychologist.update({
      where: { id: consultation.psychologistId },
      data: {
        totalConsultations: {
          increment: 1,
        },
      },
    });

    return this.mapToResponse(updated);
  }

  /**
   * Отметить неявку клиента (психолог)
   */
  async markNoShow(id: string, userId: string): Promise<ConsultationResponseDto> {
    const consultation = await this.getConsultationForPsychologist(id, userId);

    if (consultation.status !== ConsultationStatus.CONFIRMED) {
      throw new BadRequestException('Неявка может быть отмечена только для подтверждённой консультации');
    }

    const updated = await this.prisma.consultation.update({
      where: { id },
      data: {
        status: ConsultationStatus.NO_SHOW,
        completedAt: new Date(),
      },
      include: {
        psychologist: {
          include: { user: true },
        },
        client: true,
        child: true,
      },
    });

    return this.mapToResponse(updated);
  }

  /**
   * Оставить отзыв (клиент)
   */
  async rate(
    id: string,
    clientId: string,
    dto: RateConsultationDto,
  ): Promise<ConsultationResponseDto> {
    const consultation = await this.prisma.consultation.findUnique({
      where: { id },
      include: {
        psychologist: {
          include: { user: true },
        },
        client: true,
        child: true,
      },
    });

    if (!consultation) {
      throw new NotFoundException('Консультация не найдена');
    }

    if (consultation.clientId !== clientId) {
      throw new ForbiddenException('Нет доступа к этой консультации');
    }

    if (consultation.status !== ConsultationStatus.COMPLETED) {
      throw new BadRequestException('Оценка возможна только для завершённых консультаций');
    }

    if (consultation.rating !== null) {
      throw new BadRequestException('Оценка уже была оставлена');
    }

    const updated = await this.prisma.consultation.update({
      where: { id },
      data: {
        rating: dto.rating,
        review: dto.review,
      },
      include: {
        psychologist: {
          include: { user: true },
        },
        client: true,
        child: true,
      },
    });

    // Обновляем рейтинг психолога
    await this.updatePsychologistRating(consultation.psychologistId);

    return this.mapToResponse(updated);
  }

  /**
   * Получить конфигурацию Jitsi для встраивания
   */
  async getJitsiConfig(id: string, userId: string) {
    const consultation = await this.prisma.consultation.findUnique({
      where: { id },
      include: {
        psychologist: {
          include: { user: true },
        },
        client: true,
      },
    });

    if (!consultation) {
      throw new NotFoundException('Консультация не найдена');
    }

    const isClient = consultation.clientId === userId;
    const isPsychologist = consultation.psychologist.userId === userId;

    if (!isClient && !isPsychologist) {
      throw new ForbiddenException('Нет доступа к этой консультации');
    }

    if (!consultation.roomName) {
      throw new BadRequestException('Видеокомната ещё не создана');
    }

    // Определяем имя пользователя
    let userName: string;
    let userEmail: string;

    if (isClient) {
      userName = `${consultation.client.firstName} ${consultation.client.lastName || ''}`.trim();
      userEmail = consultation.client.email;
    } else {
      userName = `${consultation.psychologist.user.firstName} ${consultation.psychologist.user.lastName || ''}`.trim();
      userEmail = consultation.psychologist.user.email;
    }

    return this.jitsiService.getEmbedConfig(consultation.roomName, userName, userEmail);
  }

  // ========== Вспомогательные методы ==========

  private async getConsultationForPsychologist(id: string, userId: string) {
    const psychologist = await this.prisma.psychologist.findUnique({
      where: { userId },
    });

    if (!psychologist) {
      throw new NotFoundException('Профиль психолога не найден');
    }

    const consultation = await this.prisma.consultation.findUnique({
      where: { id },
    });

    if (!consultation) {
      throw new NotFoundException('Консультация не найдена');
    }

    if (consultation.psychologistId !== psychologist.id) {
      throw new ForbiddenException('Нет доступа к этой консультации');
    }

    return consultation;
  }

  private async updatePsychologistRating(psychologistId: string) {
    const result = await this.prisma.consultation.aggregate({
      where: {
        psychologistId,
        rating: { not: null },
      },
      _avg: {
        rating: true,
      },
    });

    if (result._avg.rating !== null) {
      await this.prisma.psychologist.update({
        where: { id: psychologistId },
        data: {
          rating: Math.round(result._avg.rating * 10) / 10,
        },
      });
    }
  }

  private mapToResponse(consultation: {
    id: string;
    psychologistId: string;
    clientId: string;
    childId: string | null;
    scheduledAt: Date;
    durationMinutes: number;
    status: ConsultationStatus;
    roomUrl: string | null;
    price: number;
    paymentStatus: PaymentStatus;
    notes: string | null;
    cancelReason: string | null;
    rating: number | null;
    review: string | null;
    createdAt: Date;
    psychologist: {
      user: {
        firstName: string;
        lastName: string | null;
        avatarUrl: string | null;
      };
    };
    client: {
      firstName: string;
      lastName: string | null;
    };
    child: {
      firstName: string;
      lastName: string;
    } | null;
  }): ConsultationResponseDto {
    return {
      id: consultation.id,
      psychologistId: consultation.psychologistId,
      psychologistName: `${consultation.psychologist.user.firstName} ${consultation.psychologist.user.lastName || ''}`.trim(),
      psychologistAvatarUrl: consultation.psychologist.user.avatarUrl,
      clientId: consultation.clientId,
      clientName: `${consultation.client.firstName} ${consultation.client.lastName || ''}`.trim(),
      childId: consultation.childId,
      childName: consultation.child
        ? `${consultation.child.firstName} ${consultation.child.lastName}`
        : null,
      scheduledAt: consultation.scheduledAt,
      durationMinutes: consultation.durationMinutes,
      status: consultation.status,
      roomUrl: consultation.roomUrl,
      price: consultation.price,
      paymentStatus: consultation.paymentStatus,
      notes: consultation.notes,
      cancelReason: consultation.cancelReason,
      rating: consultation.rating,
      review: consultation.review,
      createdAt: consultation.createdAt,
    };
  }
}
