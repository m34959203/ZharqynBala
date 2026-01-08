import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { DashboardStatsDto, CreateTestDto, UpdateTestDto } from './dto/admin.dto';

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(private prisma: PrismaService) {}

  async getDashboardStats(): Promise<DashboardStatsDto> {
    const [
      totalUsers,
      totalChildren,
      totalTests,
      totalSessions,
      totalPayments,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.child.count(),
      this.prisma.test.count(),
      this.prisma.testSession.count({ where: { status: 'COMPLETED' } }),
      this.prisma.payment.aggregate({
        where: { status: 'COMPLETED' },
        _sum: { amount: true },
      }),
    ]);

    // Get today's stats
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [newUsersToday, testsToday] = await Promise.all([
      this.prisma.user.count({ where: { createdAt: { gte: today } } }),
      this.prisma.testSession.count({
        where: { startedAt: { gte: today }, status: 'COMPLETED' },
      }),
    ]);

    return {
      totalUsers,
      totalChildren,
      totalTests,
      completedSessions: totalSessions,
      totalRevenue: totalPayments._sum.amount || 0,
      newUsersToday,
      testsToday,
    };
  }

  async getRecentActivity(limit: number) {
    const [recentUsers, recentSessions, recentPayments] = await Promise.all([
      this.prisma.user.findMany({
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: { id: true, email: true, firstName: true, createdAt: true },
      }),
      this.prisma.testSession.findMany({
        take: limit,
        orderBy: { startedAt: 'desc' },
        where: { status: 'COMPLETED' },
        include: {
          test: { select: { titleRu: true } },
          child: { select: { firstName: true } },
        },
      }),
      this.prisma.payment.findMany({
        take: limit,
        orderBy: { createdAt: 'desc' },
        where: { status: 'COMPLETED' },
        select: { id: true, amount: true, createdAt: true },
      }),
    ]);

    return {
      recentUsers,
      recentSessions,
      recentPayments,
    };
  }

  async getUsers(params: { role?: string; search?: string; page: number; limit: number }) {
    const { role, search, page, limit } = params;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (role) where.role = role;
    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          isActive: true,
          createdAt: true,
          _count: { select: { children: true } },
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      users,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async updateUser(id: string, data: any) {
    return this.prisma.user.update({
      where: { id },
      data,
    });
  }

  async deleteUser(id: string) {
    return this.prisma.user.delete({ where: { id } });
  }

  async banUser(id: string) {
    return this.prisma.user.update({
      where: { id },
      data: { isActive: false },
    });
  }

  async unbanUser(id: string) {
    return this.prisma.user.update({
      where: { id },
      data: { isActive: true },
    });
  }

  async getTests() {
    return this.prisma.test.findMany({
      orderBy: { order: 'asc' },
      include: {
        _count: {
          select: { questions: true, sessions: true },
        },
      },
    });
  }

  async getTestById(id: string) {
    const test = await this.prisma.test.findUnique({
      where: { id },
      include: {
        questions: {
          orderBy: { order: 'asc' },
          include: {
            options: {
              orderBy: { order: 'asc' },
            },
          },
        },
        _count: {
          select: { questions: true, sessions: true },
        },
      },
    });

    if (!test) throw new NotFoundException('Test not found');
    return test;
  }

  async createTest(dto: CreateTestDto) {
    const { questions, ...testData } = dto;

    // Create test with questions and options in a transaction
    const test = await this.prisma.test.create({
      data: {
        ...testData,
        price: testData.price ?? 0,
        isPremium: testData.isPremium ?? false,
        isActive: testData.isActive ?? false, // Default to draft (inactive)
        order: testData.order ?? 0,
        questions: questions
          ? {
              create: questions.map((q) => ({
                questionTextRu: q.questionTextRu,
                questionTextKz: q.questionTextKz,
                questionType: q.questionType,
                order: q.order,
                isRequired: q.isRequired ?? true,
                options: {
                  create: q.options.map((o) => ({
                    optionTextRu: o.optionTextRu,
                    optionTextKz: o.optionTextKz,
                    score: o.score,
                    order: o.order,
                  })),
                },
              })),
            }
          : undefined,
      },
      include: {
        questions: {
          include: {
            options: true,
          },
        },
        _count: {
          select: { questions: true, sessions: true },
        },
      },
    });

    this.logger.log(`Test created: ${test.id} - ${test.titleRu}`);
    return test;
  }

  async updateTest(id: string, data: UpdateTestDto) {
    const test = await this.prisma.test.findUnique({ where: { id } });
    if (!test) throw new NotFoundException('Test not found');

    return this.prisma.test.update({
      where: { id },
      data,
      include: {
        _count: {
          select: { questions: true, sessions: true },
        },
      },
    });
  }

  async deleteTest(id: string, force: boolean = false) {
    const test = await this.prisma.test.findUnique({
      where: { id },
      include: { _count: { select: { sessions: true } } },
    });

    if (!test) throw new NotFoundException('Test not found');

    // Force delete - удаляем все связанные данные
    if (force || test._count.sessions === 0) {
      // Удаляем в правильном порядке из-за foreign keys
      // 1. Удаляем ответы
      await this.prisma.answer.deleteMany({
        where: { session: { testId: id } },
      });

      // 2. Удаляем результаты
      await this.prisma.result.deleteMany({
        where: { session: { testId: id } },
      });

      // 3. Удаляем сессии
      await this.prisma.testSession.deleteMany({
        where: { testId: id },
      });

      // 4. Удаляем варианты ответов
      await this.prisma.answerOption.deleteMany({
        where: { question: { testId: id } },
      });

      // 5. Удаляем вопросы
      await this.prisma.question.deleteMany({
        where: { testId: id },
      });

      // 6. Удаляем сам тест
      await this.prisma.test.delete({ where: { id } });

      this.logger.log(`Test deleted${force ? ' (forced)' : ''}: ${id}`);
      return { success: true, message: 'Тест полностью удалён' };
    }

    // Без force - только деактивируем если есть сессии
    return this.prisma.test.update({
      where: { id },
      data: { isActive: false },
    });
  }

  async toggleTest(id: string) {
    const test = await this.prisma.test.findUnique({ where: { id } });
    if (!test) throw new NotFoundException('Test not found');

    return this.prisma.test.update({
      where: { id },
      data: { isActive: !test.isActive },
    });
  }

  async getPayments(params: { status?: string; from?: string; to?: string; page: number }) {
    const { status, from, to, page } = params;
    const limit = 20;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (status) where.status = status;
    if (from || to) {
      where.createdAt = {};
      if (from) where.createdAt.gte = new Date(from);
      if (to) where.createdAt.lte = new Date(to);
    }

    const [payments, total] = await Promise.all([
      this.prisma.payment.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        // Payment doesn't have direct user relation, just userId
      }),
      this.prisma.payment.count({ where }),
    ]);

    return {
      payments,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async refundPayment(id: string) {
    const payment = await this.prisma.payment.findUnique({ where: { id } });
    if (!payment) throw new NotFoundException('Payment not found');

    // TODO: Integrate with payment provider for actual refund
    return this.prisma.payment.update({
      where: { id },
      data: { status: 'REFUNDED' },
    });
  }

  async getPsychologists() {
    return this.prisma.psychologist.findMany({
      include: {
        user: { select: { email: true, firstName: true, lastName: true } },
        _count: { select: { consultations: true } },
      },
    });
  }

  async verifyPsychologist(id: string) {
    // Schema uses isApproved, not isVerified
    return this.prisma.psychologist.update({
      where: { id },
      data: { isApproved: true },
    });
  }

  async getSettings() {
    // Return mock settings for now
    return {
      siteName: 'Zharqyn Bala',
      supportEmail: 'support@zharqynbala.kz',
      defaultLanguage: 'ru',
      enablePayments: true,
      enableConsultations: true,
      maintenanceMode: false,
      freeTestsLimit: 3,
      premiumPrice: 4990,
    };
  }

  async updateSettings(data: any) {
    // TODO: Store settings in database or config
    this.logger.log('Settings updated:', data);
    return { success: true, settings: data };
  }

  async getRevenueReport(period: 'day' | 'week' | 'month' | 'year') {
    const now = new Date();
    let startDate: Date;

    switch (period) {
      case 'day':
        startDate = new Date(now.setDate(now.getDate() - 30));
        break;
      case 'week':
        startDate = new Date(now.setDate(now.getDate() - 12 * 7));
        break;
      case 'month':
        startDate = new Date(now.setMonth(now.getMonth() - 12));
        break;
      case 'year':
        startDate = new Date(now.setFullYear(now.getFullYear() - 5));
        break;
    }

    const payments = await this.prisma.payment.findMany({
      where: {
        status: 'COMPLETED',
        createdAt: { gte: startDate },
      },
      select: { amount: true, createdAt: true },
    });

    // Group by period
    const grouped = new Map<string, number>();
    payments.forEach((p) => {
      let key: string;
      const date = new Date(p.createdAt);
      switch (period) {
        case 'day':
          key = date.toISOString().split('T')[0];
          break;
        case 'week':
          key = `W${Math.ceil(date.getDate() / 7)}-${date.getMonth() + 1}`;
          break;
        case 'month':
          key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          break;
        case 'year':
          key = String(date.getFullYear());
          break;
      }
      grouped.set(key, (grouped.get(key) || 0) + p.amount);
    });

    return {
      period,
      data: Array.from(grouped.entries()).map(([period, amount]) => ({ period, amount })),
      total: payments.reduce((sum, p) => sum + p.amount, 0),
    };
  }

  async getUserGrowthReport(period: string) {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const users = await this.prisma.user.findMany({
      where: { createdAt: { gte: thirtyDaysAgo } },
      select: { createdAt: true },
    });

    const grouped = new Map<string, number>();
    users.forEach((u) => {
      const key = u.createdAt.toISOString().split('T')[0];
      grouped.set(key, (grouped.get(key) || 0) + 1);
    });

    return {
      data: Array.from(grouped.entries()).map(([date, count]) => ({ date, count })),
      totalNew: users.length,
    };
  }

  async getTestsReport() {
    const tests = await this.prisma.test.findMany({
      include: {
        _count: { select: { sessions: true } },
        sessions: {
          where: { status: 'COMPLETED' },
          include: { result: true },
        },
      },
    });

    return tests.map((test) => {
      const completedSessions = test.sessions;
      const avgScore =
        completedSessions.length > 0
          ? Math.round(
              completedSessions.reduce((sum, s) => {
                if (s.result) {
                  return sum + (s.result.totalScore / s.result.maxScore) * 100;
                }
                return sum;
              }, 0) / completedSessions.length,
            )
          : 0;

      return {
        id: test.id,
        title: test.titleRu,
        category: test.category,
        totalSessions: test._count.sessions,
        completedSessions: completedSessions.length,
        averageScore: avgScore,
        isPremium: test.isPremium,
      };
    });
  }
}
