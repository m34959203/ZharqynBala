import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { ParentOverviewDto } from './dto/parent-overview.dto';

const RECOMMENDED_TOTAL = 30;

const SHORT_LABELS: Record<string, string> = {
  ANXIETY: 'Тревожность',
  MOTIVATION: 'Мотивация',
  ATTENTION: 'Внимание',
  EMOTIONS: 'Эмоции',
  CAREER: 'Профориентация',
  SELF_ESTEEM: 'Самооценка',
  SOCIAL: 'Социальные навыки',
  COGNITIVE: 'Когнитивное развитие',
};

const TONE_LIST = ['tone-rose', 'tone-mint', 'tone-sun', 'tone-sky', 'tone-warm'];

const stableTone = (s: string): string => {
  let h = 0;
  for (const c of s) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return TONE_LIST[h % TONE_LIST.length];
};

const ageYearsFrom = (birth: Date): number => {
  const t = new Date();
  let a = t.getFullYear() - birth.getFullYear();
  const m = t.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && t.getDate() < birth.getDate())) a--;
  return a;
};

const parseGradeLevel = (g: string | null): number | null => {
  if (!g) return null;
  const m = g.match(/(\d+)/);
  return m ? parseInt(m[1], 10) : null;
};

@Injectable()
export class ParentsService {
  constructor(private prisma: PrismaService) {}

  async getOverview(userId: string): Promise<ParentOverviewDto> {
    const parent = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: { id: true, firstName: true, lastName: true },
    });

    const children = await this.prisma.child.findMany({
      where: { parentId: userId },
      orderBy: { createdAt: 'asc' },
      include: {
        _count: { select: { testSessions: { where: { status: 'COMPLETED' } } } },
        testSessions: {
          where: { status: 'IN_PROGRESS' },
          select: { id: true },
        },
      },
    });

    const childIds = children.map(c => c.id);

    if (!childIds.length) {
      return {
        parent,
        children: [],
        totals: {
          childrenCount: 0, testsPassed: 0, testsPassedDeltaMonth: 0,
          avgScore: null, avgScoreDeltaMonth: null,
          consultationsTotal: 0, consultationsThisMonth: 0,
        },
        recentResults: [],
        attentionZone: [],
        aiRecommendation: null,
        upcomingConsultation: null,
      };
    }

    const now = new Date();
    const day30 = new Date(now.getTime() - 30 * 24 * 3600_000);
    const day60 = new Date(now.getTime() - 60 * 24 * 3600_000);
    const day90 = new Date(now.getTime() - 90 * 24 * 3600_000);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      passedTotal, passedLast30, passedPrev30,
      results90, resultsPrev30To60,
      consultationsTotal, consultationsMonth,
      attentionRaw, recentRaw,
      upcoming,
    ] = await Promise.all([
      this.prisma.testSession.count({
        where: { childId: { in: childIds }, status: 'COMPLETED' },
      }),
      this.prisma.testSession.count({
        where: { childId: { in: childIds }, status: 'COMPLETED', completedAt: { gte: day30 } },
      }),
      this.prisma.testSession.count({
        where: { childId: { in: childIds }, status: 'COMPLETED', completedAt: { gte: day60, lt: day30 } },
      }),
      this.prisma.result.findMany({
        where: { session: { childId: { in: childIds }, status: 'COMPLETED', completedAt: { gte: day90 } } },
        select: { totalScore: true, maxScore: true },
      }),
      this.prisma.result.findMany({
        where: { session: { childId: { in: childIds }, status: 'COMPLETED', completedAt: { gte: day60, lt: day30 } } },
        select: { totalScore: true, maxScore: true },
      }),
      this.prisma.consultation.count({
        where: { clientId: userId, status: 'COMPLETED' },
      }),
      this.prisma.consultation.count({
        where: {
          clientId: userId, status: 'COMPLETED',
          completedAt: { gte: monthStart },
        },
      }),
      this.prisma.result.findMany({
        where: {
          riskZone: { in: ['YELLOW', 'RED'] },
          session: { childId: { in: childIds }, status: 'COMPLETED', completedAt: { gte: day60 } },
        },
        orderBy: { createdAt: 'desc' },
        take: 12,
        include: {
          session: {
            include: {
              test: { select: { id: true, titleRu: true, category: true } },
              child: { select: { id: true, firstName: true, lastName: true } },
            },
          },
        },
      }),
      this.prisma.result.findMany({
        where: { session: { childId: { in: childIds }, status: 'COMPLETED' } },
        orderBy: { createdAt: 'desc' },
        take: 4,
        include: {
          session: {
            include: {
              test: { select: { id: true, titleRu: true, category: true } },
              child: { select: { id: true, firstName: true, lastName: true } },
            },
          },
        },
      }),
      this.prisma.consultation.findFirst({
        where: {
          clientId: userId,
          status: { in: ['CONFIRMED', 'PENDING'] },
          scheduledAt: { gte: now },
        },
        orderBy: { scheduledAt: 'asc' },
        include: {
          psychologist: { include: { user: { select: { firstName: true, lastName: true, avatarUrl: true } } } },
          child: { select: { firstName: true } },
        },
      }),
    ]);

    // Compose results
    const avgPctOf = (rows: Array<{ totalScore: number; maxScore: number }>): number | null => {
      const valid = rows.filter(r => r.maxScore > 0);
      if (!valid.length) return null;
      return Math.round(valid.reduce((s, r) => s + (r.totalScore / r.maxScore) * 100, 0) / valid.length);
    };

    const avgScore = avgPctOf(results90);
    const avgScorePrev = avgPctOf(resultsPrev30To60);
    const avgScoreDeltaMonth = (avgScore !== null && avgScorePrev !== null)
      ? avgScore - avgScorePrev
      : null;

    const testsTakenByChild: Record<string, Set<string>> = {};
    const testsInProgressByChild: Record<string, number> = {};
    for (const c of children) {
      testsTakenByChild[c.id] = new Set();
      testsInProgressByChild[c.id] = c.testSessions.length;
    }
    const allTakenSessions = await this.prisma.testSession.findMany({
      where: { childId: { in: childIds } },
      select: { testId: true, childId: true },
    });
    for (const s of allTakenSessions) {
      testsTakenByChild[s.childId]?.add(s.testId);
    }

    // Build attention zone: dedupe by testId, take top 5
    const seenAttention = new Set<string>();
    const attentionZone = attentionRaw
      .filter(r => {
        const key = `${r.session.child.id}-${r.session.test.id}`;
        if (seenAttention.has(key)) return false;
        seenAttention.add(key);
        return true;
      })
      .slice(0, 5)
      .map(r => ({
        resultId: r.id,
        testName: r.session.test.titleRu,
        shortLabel: SHORT_LABELS[r.session.test.category] ?? r.session.test.titleRu,
        scorePct: r.maxScore > 0 ? Math.round((r.totalScore / r.maxScore) * 100) : 0,
        riskZone: r.riskZone as 'YELLOW' | 'RED',
        childId: r.session.child.id,
        childName: r.session.child.firstName,
      }));

    const recentResults = recentRaw.map(r => ({
      id: r.id,
      testName: r.session.test.titleRu,
      category: r.session.test.category,
      completedAt: (r.session.completedAt ?? r.createdAt).toISOString(),
      scorePct: r.maxScore > 0 ? Math.round((r.totalScore / r.maxScore) * 100) : 0,
      riskZone: r.riskZone,
      childName: r.session.child.firstName,
      childId: r.session.child.id,
    }));

    // AI recommendation (rule_v1): pick first attention item's category, find a test
    // in same category the child hasn't done yet. If no attention zone — recommend a test
    // from any category absent in history of the youngest active child.
    let aiRecommendation: ParentOverviewDto['aiRecommendation'] = null;
    if (attentionZone.length) {
      const item = attentionZone[0];
      const child = children.find(c => c.id === item.childId);
      const taken = testsTakenByChild[item.childId] ?? new Set();
      const candidate = await this.prisma.test.findFirst({
        where: {
          isActive: true,
          category: attentionRaw[0].session.test.category as any,
          id: { notIn: Array.from(taken) },
        },
        orderBy: { order: 'asc' },
      });
      if (candidate && child) {
        aiRecommendation = {
          testId: candidate.id,
          testName: candidate.titleRu,
          reason: `У ${child.firstName} в зоне внимания «${item.shortLabel.toLowerCase()}». Тест «${candidate.titleRu}» поможет уточнить, какие ситуации триггерят это состояние.`,
          childId: child.id,
          childName: child.firstName,
          source: 'rule_v1',
          generatedAt: new Date().toISOString(),
        };
      }
    }
    if (!aiRecommendation && children.length) {
      // fallback: recommend any not-yet-taken test for the youngest child
      const youngest = children
        .slice()
        .sort((a, b) => b.birthDate.getTime() - a.birthDate.getTime())[0];
      const taken = testsTakenByChild[youngest.id] ?? new Set();
      const candidate = await this.prisma.test.findFirst({
        where: {
          isActive: true,
          id: { notIn: Array.from(taken) },
          ageMin: { lte: ageYearsFrom(youngest.birthDate) },
          ageMax: { gte: ageYearsFrom(youngest.birthDate) },
        },
        orderBy: { order: 'asc' },
      });
      if (candidate) {
        aiRecommendation = {
          testId: candidate.id,
          testName: candidate.titleRu,
          reason: `${youngest.firstName} ещё не проходил(а) «${candidate.titleRu}». Хороший вариант для следующей диагностики.`,
          childId: youngest.id,
          childName: youngest.firstName,
          source: 'rule_v1',
          generatedAt: new Date().toISOString(),
        };
      }
    }

    const upcomingConsultation = upcoming
      ? {
          id: upcoming.id,
          startsAt: upcoming.scheduledAt.toISOString(),
          psychologist: {
            id: upcoming.psychologistId,
            fullName: `${upcoming.psychologist.user.firstName} ${upcoming.psychologist.user.lastName}`,
            avatarUrl: upcoming.psychologist.user.avatarUrl,
          },
          topic: upcoming.notes ?? (upcoming.child ? `Консультация по ${upcoming.child.firstName}` : 'Консультация'),
        }
      : null;

    const childrenDto = children.map(c => {
      const taken = testsTakenByChild[c.id]?.size ?? c._count.testSessions;
      const progressPct = Math.min(100, Math.round((taken / RECOMMENDED_TOTAL) * 100));
      return {
        id: c.id,
        firstName: c.firstName,
        lastName: c.lastName,
        ageYears: ageYearsFrom(c.birthDate),
        gradeLevel: parseGradeLevel(c.grade ?? null),
        joinedAt: c.createdAt.toISOString(),
        progressPct,
        testsInProgress: testsInProgressByChild[c.id] ?? 0,
        avatarTone: stableTone(c.firstName + c.lastName),
      };
    });

    return {
      parent,
      children: childrenDto,
      totals: {
        childrenCount: children.length,
        testsPassed: passedTotal,
        testsPassedDeltaMonth: passedLast30 - passedPrev30,
        avgScore, avgScoreDeltaMonth,
        consultationsTotal,
        consultationsThisMonth: consultationsMonth,
      },
      recentResults,
      attentionZone,
      aiRecommendation,
      upcomingConsultation,
    };
  }
}
