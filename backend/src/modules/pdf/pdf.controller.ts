import {
  Controller,
  Get,
  Param,
  Res,
  UseGuards,
  Req,
  Query,
} from '@nestjs/common';
import { Response } from 'express';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PdfService } from './pdf.service';
import { PrismaService } from '../../common/prisma/prisma.service';

@ApiTags('PDF')
@Controller('pdf')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class PdfController {
  constructor(
    private readonly pdfService: PdfService,
    private readonly prisma: PrismaService,
  ) {}

  @Get('result/:id')
  @ApiOperation({ summary: 'Generate PDF for test result' })
  async generateResultPdf(
    @Param('id') id: string,
    @Req() req: any,
    @Res() res: Response,
  ) {
    // Result is linked through session, which has child and test
    const result = await this.prisma.result.findFirst({
      where: {
        id,
        session: {
          child: { parentId: req.user.id },
        },
      },
      include: {
        session: {
          include: {
            child: true,
            test: true,
          },
        },
      },
    });

    if (!result) {
      return res.status(404).json({ message: 'Result not found' });
    }

    const child = result.session.child;
    const test = result.session.test;
    const childAge = this.calculateAge(child.birthDate);

    const pdf = await this.pdfService.generateResultPdf({
      id: result.id,
      testName: test.titleRu,
      childName: `${child.firstName} ${child.lastName}`,
      childAge,
      completedAt: result.createdAt,
      score: result.totalScore,
      maxScore: result.maxScore,
      categories: [
        // Result doesn't have categories, so we use test category
        {
          name: test.category,
          score: result.totalScore,
          maxScore: result.maxScore,
        },
      ],
      recommendations: result.recommendations ? [result.recommendations] : [],
      interpretation: result.interpretation || '',
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="result-${id}.pdf"`,
    );
    res.send(pdf);
  }

  @Get('child/:id/report')
  @ApiOperation({ summary: 'Generate child progress report PDF' })
  async generateChildReportPdf(
    @Param('id') childId: string,
    @Query('from') from: string,
    @Query('to') to: string,
    @Req() req: any,
    @Res() res: Response,
  ) {
    // Child uses parentId, not userId
    const child = await this.prisma.child.findFirst({
      where: { id: childId, parentId: req.user.id },
    });

    if (!child) {
      return res.status(404).json({ message: 'Child not found' });
    }

    const fromDate = from ? new Date(from) : new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
    const toDate = to ? new Date(to) : new Date();

    // Get results through test sessions
    const sessions = await this.prisma.testSession.findMany({
      where: {
        childId,
        status: 'COMPLETED',
        completedAt: { gte: fromDate, lte: toDate },
      },
      include: {
        test: true,
        result: true,
      },
      orderBy: { completedAt: 'asc' },
    });

    // Calculate progress by test category
    const categoryProgress = new Map<string, number[]>();
    sessions.forEach((s) => {
      if (s.result) {
        const category = s.test.category;
        const existing = categoryProgress.get(category) || [];
        existing.push(Math.round((s.result.totalScore / s.result.maxScore) * 100));
        categoryProgress.set(category, existing);
      }
    });

    const progress = Array.from(categoryProgress.entries()).map(([category, scores]) => {
      const change = scores.length > 1 ? scores[scores.length - 1] - scores[0] : 0;
      return {
        category,
        change,
        trend: (change > 5 ? 'up' : change < -5 ? 'down' : 'stable') as 'up' | 'down' | 'stable',
      };
    });

    const childName = `${child.firstName} ${child.lastName}`;

    const pdf = await this.pdfService.generateChildReportPdf({
      child: {
        name: childName,
        birthDate: child.birthDate,
        school: child.schoolName || undefined,
        grade: child.grade || undefined,
      },
      period: { from: fromDate, to: toDate },
      tests: sessions
        .filter((s) => s.result)
        .map((s) => ({
          name: s.test.titleRu,
          date: s.completedAt || s.startedAt,
          score: s.result!.totalScore,
          maxScore: s.result!.maxScore,
        })),
      progress,
      summary: this.generateSummary(sessions, progress),
      recommendations: this.generateRecommendations(progress),
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="report-${childName.replace(/\s/g, '_')}.pdf"`,
    );
    res.send(pdf);
  }

  @Get('school/:id/report')
  @ApiOperation({ summary: 'Generate school report PDF' })
  async generateSchoolReportPdf(
    @Param('id') schoolId: string,
    @Query('from') from: string,
    @Query('to') to: string,
    @Req() req: any,
    @Res() res: Response,
  ) {
    // Verify admin access - schema uses ADMIN and SCHOOL roles
    const user = await this.prisma.user.findUnique({
      where: { id: req.user.id },
    });

    if (!user || (user.role !== 'ADMIN' && user.role !== 'SCHOOL')) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const school = await this.prisma.school.findUnique({
      where: { id: schoolId },
      include: {
        classes: {
          include: {
            students: true,
          },
        },
      },
    });

    if (!school) {
      return res.status(404).json({ message: 'School not found' });
    }

    const fromDate = from ? new Date(from) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const toDate = to ? new Date(to) : new Date();

    // Get children with this school name
    const children = await this.prisma.child.findMany({
      where: { schoolName: school.schoolName },
      include: {
        testSessions: {
          where: {
            status: 'COMPLETED',
            completedAt: { gte: fromDate, lte: toDate },
          },
          include: { result: true },
        },
      },
    });

    const totalStudents = children.length;
    const testedStudents = children.filter((c) => c.testSessions.length > 0).length;
    const allSessions = children.flatMap((c) => c.testSessions).filter((s) => s.result);
    const testsCompleted = allSessions.length;
    const averageScore =
      allSessions.length > 0
        ? Math.round(
            allSessions.reduce((sum, s) => sum + (s.result!.totalScore / s.result!.maxScore) * 100, 0) /
              allSessions.length,
          )
        : 0;

    // Group by grade
    const classByChildren = new Map<string, typeof children>();
    children.forEach((child) => {
      const grade = child.grade || 'Без класса';
      const existing = classByChildren.get(grade) || [];
      existing.push(child);
      classByChildren.set(grade, existing);
    });

    const classResults = Array.from(classByChildren.entries()).map(
      ([className, classChildren]) => {
        const classSessions = classChildren.flatMap((c) => c.testSessions).filter((s) => s.result);
        return {
          className,
          students: classChildren.length,
          tested: classChildren.filter((c) => c.testSessions.length > 0).length,
          averageScore:
            classSessions.length > 0
              ? Math.round(
                  classSessions.reduce((sum, s) => sum + (s.result!.totalScore / s.result!.maxScore) * 100, 0) /
                    classSessions.length,
                )
              : 0,
        };
      },
    );

    // Find risk students (score < 50%)
    const riskStudents = children
      .filter((c) => {
        const sessionsWithResults = c.testSessions.filter((s) => s.result);
        if (sessionsWithResults.length === 0) return false;
        const avgScore =
          sessionsWithResults.reduce((sum, s) => sum + (s.result!.totalScore / s.result!.maxScore) * 100, 0) /
          sessionsWithResults.length;
        return avgScore < 50;
      })
      .map((c) => ({
        name: `${c.firstName} ${c.lastName}`,
        className: c.grade || 'Без класса',
        concern: 'Низкий средний балл по тестам',
      }));

    const pdf = await this.pdfService.generateSchoolReportPdf({
      school: { name: school.schoolName, address: school.address },
      period: { from: fromDate, to: toDate },
      statistics: { totalStudents, testedStudents, testsCompleted, averageScore },
      classResults,
      riskStudents,
      recommendations: [
        'Провести дополнительную диагностику учащихся из группы риска',
        'Организовать групповые занятия для укрепления эмоционального развития',
        'Рекомендуется индивидуальная работа с психологом для отмеченных учащихся',
      ],
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="school-report-${schoolId}.pdf"`,
    );
    res.send(pdf);
  }

  private calculateAge(birthDate: Date): number {
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  }

  private generateSummary(
    sessions: any[],
    progress: { category: string; change: number; trend: string }[],
  ): string {
    const sessionsWithResults = sessions.filter((s) => s.result);
    if (sessionsWithResults.length === 0) {
      return 'За указанный период тесты не проходились.';
    }

    const avgScore =
      sessionsWithResults.reduce(
        (sum, s) => sum + (s.result.totalScore / s.result.maxScore) * 100,
        0,
      ) / sessionsWithResults.length;

    const improving = progress.filter((p) => p.trend === 'up').length;
    const declining = progress.filter((p) => p.trend === 'down').length;

    let summary = `За период было пройдено ${sessionsWithResults.length} тестов со средним результатом ${Math.round(avgScore)}%. `;

    if (improving > declining) {
      summary += 'Наблюдается положительная динамика развития. ';
    } else if (declining > improving) {
      summary += 'Некоторые показатели требуют внимания. ';
    } else {
      summary += 'Показатели стабильны. ';
    }

    return summary;
  }

  private generateRecommendations(
    progress: { category: string; change: number; trend: string }[],
  ): string[] {
    const recommendations: string[] = [];

    const declining = progress.filter((p) => p.trend === 'down');
    if (declining.length > 0) {
      recommendations.push(
        `Обратите внимание на категории: ${declining.map((p) => p.category).join(', ')}`,
      );
    }

    recommendations.push(
      'Продолжайте регулярное прохождение тестов для отслеживания прогресса',
      'Рассмотрите возможность консультации с психологом для персональных рекомендаций',
    );

    return recommendations;
  }
}
