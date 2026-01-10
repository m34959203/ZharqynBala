import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

export interface DashboardMetrics {
  users: {
    total: number;
    active: number;
    newThisMonth: number;
    growth: number;
  };
  children: {
    total: number;
    byAgeGroup: { group: string; count: number }[];
  };
  tests: {
    total: number;
    completedThisMonth: number;
    averageScore: number;
    popularTests: { id: string; title: string; count: number }[];
  };
  revenue: {
    total: number;
    thisMonth: number;
    growth: number;
    byPlan: { plan: string; amount: number }[];
  };
  consultations: {
    total: number;
    completed: number;
    upcoming: number;
    cancelled: number;
  };
}

export interface UserAnalytics {
  registrationTrend: { date: string; count: number }[];
  retentionRate: number;
  activeUsersByDay: { date: string; count: number }[];
  topRegions: { region: string; count: number }[];
}

export interface TestAnalytics {
  completionRate: number;
  averageTimeToComplete: number;
  scoreDistribution: { range: string; count: number }[];
  categoryPerformance: { category: string; averageScore: number }[];
  trendByMonth: { month: string; count: number; avgScore: number }[];
}

export interface ChildAnalytics {
  ageDistribution: { age: number; count: number }[];
  genderDistribution: { gender: string; count: number }[];
  progressTrends: { category: string; improvement: number }[];
  atRiskChildren: { id: string; name: string; concern: string; score: number }[];
}

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getDashboardMetrics(): Promise<DashboardMetrics> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    // Users metrics
    const [totalUsers, activeUsers, newUsersThisMonth, newUsersLastMonth] =
      await Promise.all([
        this.prisma.user.count(),
        this.prisma.user.count({
          where: {
            lastLoginAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
          },
        }),
        this.prisma.user.count({ where: { createdAt: { gte: startOfMonth } } }),
        this.prisma.user.count({
          where: { createdAt: { gte: startOfLastMonth, lt: endOfLastMonth } },
        }),
      ]);

    const userGrowth = newUsersLastMonth > 0
      ? Math.round(((newUsersThisMonth - newUsersLastMonth) / newUsersLastMonth) * 100)
      : 100;

    // Children metrics
    const children = await this.prisma.child.findMany({
      select: { birthDate: true },
    });

    const ageGroups = this.groupByAge(children.map((c) => c.birthDate));

    // Tests metrics - Result is linked through session
    const [totalTests, testsThisMonth, allResults] = await Promise.all([
      this.prisma.result.count(),
      this.prisma.result.count({ where: { createdAt: { gte: startOfMonth } } }),
      this.prisma.result.findMany({
        select: {
          totalScore: true,
          maxScore: true,
          session: {
            select: {
              testId: true,
              test: { select: { titleRu: true } },
            },
          },
        },
      }),
    ]);

    const avgScore = allResults.length > 0
      ? Math.round(
          allResults.reduce((sum, r) => sum + (r.totalScore / r.maxScore) * 100, 0) /
            allResults.length,
        )
      : 0;

    const testCounts = new Map<string, { id: string; title: string; count: number }>();
    allResults.forEach((r) => {
      const testId = r.session.testId;
      const existing = testCounts.get(testId) || { id: testId, title: r.session.test.titleRu, count: 0 };
      existing.count++;
      testCounts.set(testId, existing);
    });

    const popularTests = Array.from(testCounts.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Revenue metrics
    const [totalRevenue, revenueThisMonth, revenueLastMonth] =
      await Promise.all([
        this.prisma.payment.aggregate({
          _sum: { amount: true },
          where: { status: 'COMPLETED' },
        }),
        this.prisma.payment.aggregate({
          _sum: { amount: true },
          where: { status: 'COMPLETED', createdAt: { gte: startOfMonth } },
        }),
        this.prisma.payment.aggregate({
          _sum: { amount: true },
          where: {
            status: 'COMPLETED',
            createdAt: { gte: startOfLastMonth, lt: endOfLastMonth },
          },
        }),
      ]);

    const revenueGrowth = (revenueLastMonth._sum.amount || 0) > 0
      ? Math.round(
          (((revenueThisMonth._sum.amount || 0) - (revenueLastMonth._sum.amount || 0)) /
            (revenueLastMonth._sum.amount || 1)) *
            100,
        )
      : 100;

    // Consultations metrics - schema uses PENDING, CONFIRMED, IN_PROGRESS, COMPLETED, CANCELLED, etc.
    const [totalConsultations, completedConsultations, upcomingConsultations, cancelledConsultations] =
      await Promise.all([
        this.prisma.consultation.count(),
        this.prisma.consultation.count({ where: { status: 'COMPLETED' } }),
        this.prisma.consultation.count({
          where: { status: 'CONFIRMED', scheduledAt: { gte: now } },
        }),
        this.prisma.consultation.count({ where: { status: 'CANCELLED' } }),
      ]);

    return {
      users: {
        total: totalUsers,
        active: activeUsers,
        newThisMonth: newUsersThisMonth,
        growth: userGrowth,
      },
      children: {
        total: children.length,
        byAgeGroup: ageGroups,
      },
      tests: {
        total: totalTests,
        completedThisMonth: testsThisMonth,
        averageScore: avgScore,
        popularTests,
      },
      revenue: {
        total: totalRevenue._sum.amount || 0,
        thisMonth: revenueThisMonth._sum.amount || 0,
        growth: revenueGrowth,
        byPlan: [],
      },
      consultations: {
        total: totalConsultations,
        completed: completedConsultations,
        upcoming: upcomingConsultations,
        cancelled: cancelledConsultations,
      },
    };
  }

  async getUserAnalytics(days: number = 30): Promise<UserAnalytics> {
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    // Registration trend
    const registrations = await this.prisma.user.groupBy({
      by: ['createdAt'],
      where: { createdAt: { gte: startDate } },
      _count: true,
    });

    const registrationTrend = this.aggregateByDate(
      registrations.map((r) => ({ date: r.createdAt, count: r._count })),
      days,
    );

    // Retention rate (users who logged in within last 7 days)
    const [totalUsers, retainedUsers] = await Promise.all([
      this.prisma.user.count({ where: { createdAt: { lt: startDate } } }),
      this.prisma.user.count({
        where: {
          createdAt: { lt: startDate },
          lastLoginAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
        },
      }),
    ]);

    const retentionRate = totalUsers > 0 ? Math.round((retainedUsers / totalUsers) * 100) : 0;

    // Active users by day
    const sessions = await this.prisma.user.groupBy({
      by: ['lastLoginAt'],
      where: { lastLoginAt: { gte: startDate } },
      _count: true,
    });

    const activeUsersByDay = this.aggregateByDate(
      sessions.filter((s) => s.lastLoginAt).map((s) => ({ date: s.lastLoginAt!, count: s._count })),
      days,
    );

    return {
      registrationTrend,
      retentionRate,
      activeUsersByDay,
      topRegions: [],
    };
  }

  async getTestAnalytics(testId?: string): Promise<TestAnalytics> {
    const sessionWhere = testId ? { testId } : {};

    // Result is linked through session, uses totalScore/maxScore
    const results = await this.prisma.result.findMany({
      where: testId ? { session: { testId } } : {},
      include: {
        session: {
          include: { test: true },
        },
      },
    });

    // Completion rate
    const sessions = await this.prisma.testSession.count({ where: sessionWhere });
    const completed = await this.prisma.testSession.count({
      where: { ...sessionWhere, status: 'COMPLETED' },
    });
    const completionRate = sessions > 0 ? Math.round((completed / sessions) * 100) : 0;

    // Score distribution
    const scores = results.map((r) => Math.round((r.totalScore / r.maxScore) * 100));
    const scoreDistribution = [
      { range: '0-20%', count: scores.filter((s) => s < 20).length },
      { range: '20-40%', count: scores.filter((s) => s >= 20 && s < 40).length },
      { range: '40-60%', count: scores.filter((s) => s >= 40 && s < 60).length },
      { range: '60-80%', count: scores.filter((s) => s >= 60 && s < 80).length },
      { range: '80-100%', count: scores.filter((s) => s >= 80).length },
    ];

    // Category performance - based on test categories from TestCategory enum
    const categoryScores = new Map<string, { total: number; count: number }>();
    results.forEach((r) => {
      const category = r.session.test.category;
      const existing = categoryScores.get(category) || { total: 0, count: 0 };
      existing.total += (r.totalScore / r.maxScore) * 100;
      existing.count++;
      categoryScores.set(category, existing);
    });

    const categoryPerformance = Array.from(categoryScores.entries()).map(
      ([category, data]) => ({
        category,
        averageScore: Math.round(data.total / data.count),
      }),
    );

    // Trend by month
    const monthlyData = new Map<string, { count: number; totalScore: number }>();
    results.forEach((r) => {
      const month = r.createdAt.toISOString().slice(0, 7);
      const existing = monthlyData.get(month) || { count: 0, totalScore: 0 };
      existing.count++;
      existing.totalScore += (r.totalScore / r.maxScore) * 100;
      monthlyData.set(month, existing);
    });

    const trendByMonth = Array.from(monthlyData.entries())
      .map(([month, data]) => ({
        month,
        count: data.count,
        avgScore: Math.round(data.totalScore / data.count),
      }))
      .sort((a, b) => a.month.localeCompare(b.month));

    return {
      completionRate,
      averageTimeToComplete: 15, // Default, should be calculated from session data
      scoreDistribution,
      categoryPerformance,
      trendByMonth,
    };
  }

  async getChildAnalytics(userId?: string): Promise<ChildAnalytics> {
    // Child uses parentId, not userId
    const where = userId ? { parentId: userId } : {};

    // Child has testSessions relation, not results
    const children = await this.prisma.child.findMany({
      where,
      include: {
        testSessions: {
          where: { status: 'COMPLETED' },
          include: {
            result: true,
            test: true,
          },
          orderBy: { completedAt: 'desc' },
        },
      },
    });

    // Age distribution
    const ageCounts = new Map<number, number>();
    children.forEach((c) => {
      const age = this.calculateAge(c.birthDate);
      ageCounts.set(age, (ageCounts.get(age) || 0) + 1);
    });

    const ageDistribution = Array.from(ageCounts.entries())
      .map(([age, count]) => ({ age, count }))
      .sort((a, b) => a.age - b.age);

    // Gender distribution
    const genderCounts = new Map<string, number>();
    children.forEach((c) => {
      const gender = c.gender || 'Unknown';
      genderCounts.set(gender, (genderCounts.get(gender) || 0) + 1);
    });

    const genderDistribution = Array.from(genderCounts.entries()).map(
      ([gender, count]) => ({ gender, count }),
    );

    // Progress trends by test category
    const categoryProgress = new Map<string, number[]>();
    children.forEach((c) => {
      const sessionsWithResults = c.testSessions
        .filter((s) => s.result)
        .sort((a, b) => (a.completedAt?.getTime() || 0) - (b.completedAt?.getTime() || 0));

      sessionsWithResults.forEach((session) => {
        if (session.result) {
          const category = session.test.category;
          const scores = categoryProgress.get(category) || [];
          scores.push((session.result.totalScore / session.result.maxScore) * 100);
          categoryProgress.set(category, scores);
        }
      });
    });

    const progressTrends = Array.from(categoryProgress.entries()).map(
      ([category, scores]) => ({
        category,
        improvement:
          scores.length > 1
            ? Math.round(scores[scores.length - 1] - scores[0])
            : 0,
      }),
    );

    // At-risk children (average score < 40%)
    const atRiskChildren = children
      .filter((c) => {
        const sessionsWithResults = c.testSessions.filter((s) => s.result);
        if (sessionsWithResults.length === 0) return false;
        const avgScore =
          sessionsWithResults.reduce(
            (sum, s) => sum + (s.result!.totalScore / s.result!.maxScore) * 100,
            0,
          ) / sessionsWithResults.length;
        return avgScore < 40;
      })
      .map((c) => {
        const sessionsWithResults = c.testSessions.filter((s) => s.result);
        const avgScore =
          sessionsWithResults.reduce(
            (sum, s) => sum + (s.result!.totalScore / s.result!.maxScore) * 100,
            0,
          ) / sessionsWithResults.length;

        // Find lowest scoring test category
        const lowestSession = sessionsWithResults.reduce((lowest, current) => {
          const currentScore = (current.result!.totalScore / current.result!.maxScore) * 100;
          const lowestScore = lowest.result
            ? (lowest.result.totalScore / lowest.result.maxScore) * 100
            : 100;
          return currentScore < lowestScore ? current : lowest;
        }, sessionsWithResults[0]);

        return {
          id: c.id,
          name: `${c.firstName} ${c.lastName}`,
          concern: lowestSession?.test.category || 'Общий низкий балл',
          score: Math.round(avgScore),
        };
      });

    return {
      ageDistribution,
      genderDistribution,
      progressTrends,
      atRiskChildren,
    };
  }

  async getRevenueAnalytics(months: number = 12): Promise<any> {
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);

    const payments = await this.prisma.payment.findMany({
      where: {
        status: 'COMPLETED',
        createdAt: { gte: startDate },
      },
      select: {
        amount: true,
        createdAt: true,
        paymentType: true,
      },
    });

    // Monthly revenue
    const monthlyRevenue = new Map<string, number>();
    payments.forEach((p) => {
      const month = p.createdAt.toISOString().slice(0, 7);
      monthlyRevenue.set(month, (monthlyRevenue.get(month) || 0) + p.amount);
    });

    const revenueByMonth = Array.from(monthlyRevenue.entries())
      .map(([month, amount]) => ({ month, amount }))
      .sort((a, b) => a.month.localeCompare(b.month));

    return {
      totalRevenue: payments.reduce((sum, p) => sum + p.amount, 0),
      averagePayment:
        payments.length > 0
          ? Math.round(
              payments.reduce((sum, p) => sum + p.amount, 0) / payments.length,
            )
          : 0,
      revenueByMonth,
      paymentCount: payments.length,
    };
  }

  private groupByAge(birthDates: Date[]): { group: string; count: number }[] {
    const groups = {
      '3-5 лет': 0,
      '6-8 лет': 0,
      '9-11 лет': 0,
      '12-14 лет': 0,
      '15-17 лет': 0,
    };

    birthDates.forEach((birthDate) => {
      const age = this.calculateAge(birthDate);
      if (age >= 3 && age <= 5) groups['3-5 лет']++;
      else if (age >= 6 && age <= 8) groups['6-8 лет']++;
      else if (age >= 9 && age <= 11) groups['9-11 лет']++;
      else if (age >= 12 && age <= 14) groups['12-14 лет']++;
      else if (age >= 15 && age <= 17) groups['15-17 лет']++;
    });

    return Object.entries(groups).map(([group, count]) => ({ group, count }));
  }

  private calculateAge(birthDate: Date): number {
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
      age--;
    }
    return age;
  }

  private aggregateByDate(
    data: { date: Date; count: number }[],
    days: number,
  ): { date: string; count: number }[] {
    const result = new Map<string, number>();

    // Initialize all days
    for (let i = 0; i < days; i++) {
      const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      const dateStr = date.toISOString().slice(0, 10);
      result.set(dateStr, 0);
    }

    // Aggregate data
    data.forEach(({ date, count }) => {
      const dateStr = date.toISOString().slice(0, 10);
      result.set(dateStr, (result.get(dateStr) || 0) + count);
    });

    return Array.from(result.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }
}
