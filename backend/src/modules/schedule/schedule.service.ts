import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { SaveScheduleDto, ScheduleSlotResponseDto } from './dto';

@Injectable()
export class ScheduleService {
  constructor(private prisma: PrismaService) {}

  async getPsychologistId(userId: string): Promise<string> {
    let psychologist = await this.prisma.psychologist.findUnique({
      where: { userId },
    });

    // Если профиля нет, создаём его автоматически для пользователей с ролью PSYCHOLOGIST
    if (!psychologist) {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { role: true },
      });

      if (user?.role === 'PSYCHOLOGIST') {
        // Создаём профиль психолога с дефолтными значениями
        psychologist = await this.prisma.psychologist.create({
          data: {
            userId,
            specialization: [],
            experienceYears: 0,
            education: 'Не указано',
            hourlyRate: 5000,
            bio: null,
            isApproved: false,
            isAvailable: true,
          },
        });
      } else {
        throw new NotFoundException('Профиль психолога не найден');
      }
    }

    return psychologist.id;
  }

  async getSchedule(
    userId: string,
    startDate?: string,
    endDate?: string,
  ): Promise<ScheduleSlotResponseDto[]> {
    const psychologistId = await this.getPsychologistId(userId);

    const where: any = { psychologistId, isAvailable: true };

    if (startDate || endDate) {
      where.date = {};
      if (startDate) {
        where.date.gte = new Date(startDate);
      }
      if (endDate) {
        where.date.lte = new Date(endDate);
      }
    }

    const slots = await this.prisma.scheduleSlot.findMany({
      where,
      orderBy: [{ date: 'asc' }, { hour: 'asc' }],
    });

    return slots.map((slot) => ({
      id: slot.id,
      date: slot.date.toISOString().split('T')[0],
      hour: slot.hour,
      isAvailable: slot.isAvailable,
    }));
  }

  async saveSchedule(
    userId: string,
    dto: SaveScheduleDto,
  ): Promise<{ saved: number; deleted: number }> {
    const psychologistId = await this.getPsychologistId(userId);

    // Разделяем слоты на те, что нужно создать/обновить и те, что нужно удалить
    const toUpsert = dto.slots.filter((s) => s.isAvailable);
    const toDelete = dto.slots.filter((s) => !s.isAvailable);

    // Удаляем слоты, которые больше не доступны
    let deletedCount = 0;
    if (toDelete.length > 0) {
      const deleteConditions = toDelete.map((slot) => ({
        psychologistId,
        date: new Date(slot.date),
        hour: slot.hour,
      }));

      for (const condition of deleteConditions) {
        const result = await this.prisma.scheduleSlot.deleteMany({
          where: condition,
        });
        deletedCount += result.count;
      }
    }

    // Создаем или обновляем доступные слоты
    let savedCount = 0;
    for (const slot of toUpsert) {
      await this.prisma.scheduleSlot.upsert({
        where: {
          psychologistId_date_hour: {
            psychologistId,
            date: new Date(slot.date),
            hour: slot.hour,
          },
        },
        create: {
          psychologistId,
          date: new Date(slot.date),
          hour: slot.hour,
          isAvailable: true,
        },
        update: {
          isAvailable: true,
        },
      });
      savedCount++;
    }

    return { saved: savedCount, deleted: deletedCount };
  }

  async clearSchedule(
    userId: string,
    startDate: string,
    endDate: string,
  ): Promise<{ deleted: number }> {
    const psychologistId = await this.getPsychologistId(userId);

    const result = await this.prisma.scheduleSlot.deleteMany({
      where: {
        psychologistId,
        date: {
          gte: new Date(startDate),
          lte: new Date(endDate),
        },
      },
    });

    return { deleted: result.count };
  }

  // Публичный метод для получения расписания психолога (для клиентов)
  async getPublicSchedule(
    psychologistId: string,
    startDate: string,
    endDate: string,
  ): Promise<ScheduleSlotResponseDto[]> {
    const now = new Date();

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

    // Фильтруем прошедшие слоты
    return slots
      .filter((slot) => {
        const slotDateTime = new Date(slot.date);
        slotDateTime.setHours(slot.hour, 0, 0, 0);
        return slotDateTime > now;
      })
      .map((slot) => ({
        id: slot.id,
        date: slot.date.toISOString().split('T')[0],
        hour: slot.hour,
        isAvailable: slot.isAvailable,
      }));
  }
}
