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
    // Если роль меняется на PSYCHOLOGIST, нужно создать профиль психолога
    if (data.role === 'PSYCHOLOGIST') {
      // Проверяем, существует ли уже профиль психолога
      const existingProfile = await this.prisma.psychologist.findUnique({
        where: { userId: id },
      });

      if (!existingProfile) {
        // Создаём профиль психолога с дефолтными значениями
        await this.prisma.psychologist.create({
          data: {
            userId: id,
            specialization: [],
            experienceYears: 0,
            education: 'Не указано',
            hourlyRate: 5000,
            bio: null,
            isApproved: false,
            isAvailable: true,
          },
        });
        this.logger.log(`Created psychologist profile for user: ${id}`);
      }
    }

    return this.prisma.user.update({
      where: { id },
      data,
    });
  }

  async deleteUser(id: string) {
    this.logger.log(`Deleting user: ${id}`);

    // Проверяем существование пользователя
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: { id: true, email: true, role: true },
    });

    if (!user) {
      throw new NotFoundException('Пользователь не найден');
    }

    // Защита от удаления админа системы
    if (user.email === 'admin@zharqynbala.kz') {
      throw new Error('Нельзя удалить системного администратора');
    }

    try {
      await this.prisma.$transaction(async (tx) => {
        // 1. Находим всех детей пользователя
        const children = await tx.child.findMany({
          where: { parentId: id },
          select: { id: true },
        });

        // 2. Для каждого ребёнка удаляем связанные данные
        for (const child of children) {
          // Удаляем консультации ребёнка
          await tx.consultation.deleteMany({ where: { childId: child.id } });

          // Удаляем сессии тестов и связанные данные
          const sessions = await tx.testSession.findMany({
            where: { childId: child.id },
            select: { id: true },
          });

          if (sessions.length > 0) {
            const sessionIds = sessions.map(s => s.id);
            await tx.answer.deleteMany({ where: { sessionId: { in: sessionIds } } });
            await tx.result.deleteMany({ where: { sessionId: { in: sessionIds } } });
            await tx.testSession.deleteMany({ where: { id: { in: sessionIds } } });
          }
        }

        // 3. Удаляем детей
        await tx.child.deleteMany({ where: { parentId: id } });

        // 4. Удаляем профиль психолога (если есть)
        await tx.psychologist.deleteMany({ where: { userId: id } });

        // 5. Удаляем подписки
        await tx.subscription.deleteMany({ where: { userId: id } });

        // 6. Удаляем платежи
        await tx.payment.deleteMany({ where: { userId: id } });

        // 7. Удаляем refresh токены
        await tx.refreshToken.deleteMany({ where: { userId: id } });

        // 8. Удаляем логи безопасности
        await tx.securityLog.deleteMany({ where: { userId: id } });

        // 9. Удаляем самого пользователя
        await tx.user.delete({ where: { id } });
      }, {
        timeout: 30000,
      });

      this.logger.log(`User deleted successfully: ${id}`);
      return { success: true, message: 'Пользователь успешно удалён' };
    } catch (error) {
      this.logger.error(`Failed to delete user ${id}:`, error);
      throw error;
    }
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
      include: {
        _count: { select: { sessions: true } },
        questions: { select: { id: true } },
      },
    });

    if (!test) throw new NotFoundException('Test not found');

    // Force delete - удаляем все связанные данные в транзакции
    if (force || test._count.sessions === 0) {
      const questionIds = test.questions.map(q => q.id);

      await this.prisma.$transaction(async (tx) => {
        // 1. Удаляем ответы (ссылаются на questions и answer_options)
        if (questionIds.length > 0) {
          await tx.answer.deleteMany({
            where: { questionId: { in: questionIds } },
          });
        }

        // 2. Удаляем результаты
        await tx.result.deleteMany({
          where: { session: { testId: id } },
        });

        // 3. Удаляем сессии
        await tx.testSession.deleteMany({
          where: { testId: id },
        });

        // 4. Удаляем групповые тесты (школы)
        await tx.groupTest.deleteMany({
          where: { testId: id },
        });

        // 5. Удаляем варианты ответов
        if (questionIds.length > 0) {
          await tx.answerOption.deleteMany({
            where: { questionId: { in: questionIds } },
          });
        }

        // 6. Удаляем вопросы
        await tx.question.deleteMany({
          where: { testId: id },
        });

        // 7. Удаляем сам тест
        await tx.test.delete({ where: { id } });
      });

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

  /**
   * Удаление всех демо данных из системы
   */
  async cleanupDemoData() {
    this.logger.log('Starting demo data cleanup...');

    // ID демо тестов (из seed.ts)
    const demoTestIds = [
      'test-anxiety-1',
      'test-motivation-1',
      'test-selfesteem-1',
      'test-attention-1',
      'test-emotions-1',
      'test-social-1',
      'test-stress-1',
      'test-learning-style-1',
    ];

    const results = {
      tests: 0,
      questions: 0,
      answerOptions: 0,
      sessions: 0,
      answers: 0,
      results: 0,
      consultations: 0,
      children: 0,
      users: 0,
      groupTests: 0,
    };

    try {
      await this.prisma.$transaction(async (tx) => {
        this.logger.log('Step 1: Finding demo test questions...');
        const questions = await tx.question.findMany({
          where: { testId: { in: demoTestIds } },
          select: { id: true },
        });
        const questionIds = questions.map(q => q.id);
        this.logger.log(`Found ${questionIds.length} questions`);

        this.logger.log('Step 2: Finding demo user...');
        const demoUser = await tx.user.findUnique({
          where: { email: 'parent@test.kz' },
          select: { id: true },
        });
        this.logger.log(`Demo user: ${demoUser ? demoUser.id : 'not found'}`);

        // Удаление в правильном порядке FK
        this.logger.log('Step 3: Deleting answers for demo test questions...');
        if (questionIds.length > 0) {
          const deleted = await tx.answer.deleteMany({
            where: { questionId: { in: questionIds } },
          });
          results.answers = deleted.count;
          this.logger.log(`Deleted ${deleted.count} answers`);
        }

        this.logger.log('Step 4: Deleting results for demo tests...');
        const deletedResults = await tx.result.deleteMany({
          where: { session: { testId: { in: demoTestIds } } },
        });
        results.results = deletedResults.count;
        this.logger.log(`Deleted ${deletedResults.count} results`);

        this.logger.log('Step 5: Deleting sessions for demo tests...');
        const deletedSessions = await tx.testSession.deleteMany({
          where: { testId: { in: demoTestIds } },
        });
        results.sessions = deletedSessions.count;
        this.logger.log(`Deleted ${deletedSessions.count} sessions`);

        this.logger.log('Step 6: Deleting group tests...');
        const deletedGroupTests = await tx.groupTest.deleteMany({
          where: { testId: { in: demoTestIds } },
        });
        results.groupTests = deletedGroupTests.count;
        this.logger.log(`Deleted ${deletedGroupTests.count} group tests`);

        this.logger.log('Step 7: Deleting answer options...');
        if (questionIds.length > 0) {
          const deletedOptions = await tx.answerOption.deleteMany({
            where: { questionId: { in: questionIds } },
          });
          results.answerOptions = deletedOptions.count;
          this.logger.log(`Deleted ${deletedOptions.count} answer options`);
        }

        this.logger.log('Step 8: Deleting questions...');
        const deletedQuestions = await tx.question.deleteMany({
          where: { testId: { in: demoTestIds } },
        });
        results.questions = deletedQuestions.count;
        this.logger.log(`Deleted ${deletedQuestions.count} questions`);

        this.logger.log('Step 9: Deleting demo tests...');
        const deletedTests = await tx.test.deleteMany({
          where: { id: { in: demoTestIds } },
        });
        results.tests = deletedTests.count;
        this.logger.log(`Deleted ${deletedTests.count} tests`);

        // === Демо ребёнок и пользователь ===
        this.logger.log('Step 10: Deleting consultations for demo child...');
        const deletedConsultations = await tx.consultation.deleteMany({
          where: { childId: 'demo-child-1' },
        });
        results.consultations = deletedConsultations.count;
        this.logger.log(`Deleted ${deletedConsultations.count} consultations`);

        this.logger.log('Step 11: Finding and deleting demo child sessions...');
        const demoChildSessions = await tx.testSession.findMany({
          where: { childId: 'demo-child-1' },
          select: { id: true },
        });
        this.logger.log(`Found ${demoChildSessions.length} sessions for demo child`);

        if (demoChildSessions.length > 0) {
          const sessionIds = demoChildSessions.map(s => s.id);
          await tx.answer.deleteMany({
            where: { sessionId: { in: sessionIds } },
          });
          await tx.result.deleteMany({
            where: { sessionId: { in: sessionIds } },
          });
          await tx.testSession.deleteMany({
            where: { id: { in: sessionIds } },
          });
          this.logger.log('Deleted demo child sessions and related data');
        }

        this.logger.log('Step 12: Deleting demo child...');
        const deletedChildren = await tx.child.deleteMany({
          where: { id: 'demo-child-1' },
        });
        results.children = deletedChildren.count;
        this.logger.log(`Deleted ${deletedChildren.count} children`);

        if (demoUser) {
          this.logger.log('Step 13: Deleting demo user related data...');

          // Удаляем всех детей демо пользователя (на случай если есть другие)
          const allDemoChildren = await tx.child.findMany({
            where: { parentId: demoUser.id },
            select: { id: true },
          });

          for (const child of allDemoChildren) {
            await tx.consultation.deleteMany({ where: { childId: child.id } });
            const childSessions = await tx.testSession.findMany({
              where: { childId: child.id },
              select: { id: true },
            });
            if (childSessions.length > 0) {
              const sIds = childSessions.map(s => s.id);
              await tx.answer.deleteMany({ where: { sessionId: { in: sIds } } });
              await tx.result.deleteMany({ where: { sessionId: { in: sIds } } });
              await tx.testSession.deleteMany({ where: { id: { in: sIds } } });
            }
          }
          await tx.child.deleteMany({ where: { parentId: demoUser.id } });

          await tx.subscription.deleteMany({ where: { userId: demoUser.id } });
          await tx.payment.deleteMany({ where: { userId: demoUser.id } });
          await tx.refreshToken.deleteMany({ where: { userId: demoUser.id } });
          await tx.securityLog.deleteMany({ where: { userId: demoUser.id } });
          this.logger.log('Deleted demo user related data');
        }

        this.logger.log('Step 14: Deleting demo user...');
        const deletedUsers = await tx.user.deleteMany({
          where: { email: 'parent@test.kz' },
        });
        results.users = deletedUsers.count;
        this.logger.log(`Deleted ${deletedUsers.count} users`);
      }, {
        timeout: 30000, // 30 seconds timeout
      });

      this.logger.log('Demo data cleanup completed successfully:', results);

      return {
        success: true,
        message: 'Демо данные успешно удалены',
        deleted: results,
      };
    } catch (error) {
      this.logger.error('Demo data cleanup failed:', error);
      throw error;
    }
  }
}
