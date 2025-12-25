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
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
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
    const result = await this.prisma.result.findFirst({
      where: {
        id,
        child: { userId: req.user.id },
      },
      include: {
        child: true,
        test: true,
        categories: true,
      },
    });

    if (!result) {
      return res.status(404).json({ message: 'Result not found' });
    }

    const childAge = this.calculateAge(result.child.birthDate);

    const pdf = await this.pdfService.generateResultPdf({
      id: result.id,
      testName: result.test.title,
      childName: result.child.name,
      childAge,
      completedAt: result.createdAt,
      score: result.score,
      maxScore: result.maxScore,
      categories: result.categories.map((c) => ({
        name: c.name,
        score: c.score,
        maxScore: c.maxScore,
      })),
      recommendations: result.recommendations as string[] || [],
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
    const child = await this.prisma.child.findFirst({
      where: { id: childId, userId: req.user.id },
    });

    if (!child) {
      return res.status(404).json({ message: 'Child not found' });
    }

    const fromDate = from ? new Date(from) : new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
    const toDate = to ? new Date(to) : new Date();

    const results = await this.prisma.result.findMany({
      where: {
        childId,
        createdAt: { gte: fromDate, lte: toDate },
      },
      include: { test: true, categories: true },
      orderBy: { createdAt: 'asc' },
    });

    // Calculate progress
    const categoryProgress = new Map<string, number[]>();
    results.forEach((r) => {
      r.categories.forEach((c) => {
        const existing = categoryProgress.get(c.name) || [];
        existing.push(Math.round((c.score / c.maxScore) * 100));
        categoryProgress.set(c.name, existing);
      });
    });

    const progress = Array.from(categoryProgress.entries()).map(([category, scores]) => {
      const change = scores.length > 1 ? scores[scores.length - 1] - scores[0] : 0;
      return {
        category,
        change,
        trend: (change > 5 ? 'up' : change < -5 ? 'down' : 'stable') as 'up' | 'down' | 'stable',
      };
    });

    const pdf = await this.pdfService.generateChildReportPdf({
      child: {
        name: child.name,
        birthDate: child.birthDate,
        school: child.school,
        grade: child.grade,
      },
      period: { from: fromDate, to: toDate },
      tests: results.map((r) => ({
        name: r.test.title,
        date: r.createdAt,
        score: r.score,
        maxScore: r.maxScore,
      })),
      progress,
      summary: this.generateSummary(results, progress),
      recommendations: this.generateRecommendations(progress),
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="report-${child.name.replace(/\s/g, '_')}.pdf"`,
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
    // Verify admin access
    const user = await this.prisma.user.findUnique({
      where: { id: req.user.id },
    });

    if (user.role !== 'ADMIN' && user.role !== 'SCHOOL_ADMIN') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const school = await this.prisma.school.findUnique({
      where: { id: schoolId },
    });

    if (!school) {
      return res.status(404).json({ message: 'School not found' });
    }

    const fromDate = from ? new Date(from) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const toDate = to ? new Date(to) : new Date();

    // Get statistics
    const children = await this.prisma.child.findMany({
      where: { school: school.name },
      include: {
        results: {
          where: { createdAt: { gte: fromDate, lte: toDate } },
        },
      },
    });

    const totalStudents = children.length;
    const testedStudents = children.filter((c) => c.results.length > 0).length;
    const allResults = children.flatMap((c) => c.results);
    const testsCompleted = allResults.length;
    const averageScore =
      allResults.length > 0
        ? Math.round(
            allResults.reduce((sum, r) => sum + (r.score / r.maxScore) * 100, 0) /
              allResults.length,
          )
        : 0;

    // Group by class
    const classByChildren = new Map<string, typeof children>();
    children.forEach((child) => {
      const grade = child.grade || 'Без класса';
      const existing = classByChildren.get(grade) || [];
      existing.push(child);
      classByChildren.set(grade, existing);
    });

    const classResults = Array.from(classByChildren.entries()).map(
      ([className, classChildren]) => ({
        className,
        students: classChildren.length,
        tested: classChildren.filter((c) => c.results.length > 0).length,
        averageScore:
          classChildren.flatMap((c) => c.results).length > 0
            ? Math.round(
                classChildren
                  .flatMap((c) => c.results)
                  .reduce((sum, r) => sum + (r.score / r.maxScore) * 100, 0) /
                  classChildren.flatMap((c) => c.results).length,
              )
            : 0,
      }),
    );

    // Find risk students (score < 50%)
    const riskStudents = children
      .filter((c) => {
        const avgScore =
          c.results.length > 0
            ? c.results.reduce((sum, r) => sum + (r.score / r.maxScore) * 100, 0) /
              c.results.length
            : 100;
        return avgScore < 50;
      })
      .map((c) => ({
        name: c.name,
        className: c.grade || 'Без класса',
        concern: 'Низкий средний балл по тестам',
      }));

    const pdf = await this.pdfService.generateSchoolReportPdf({
      school: { name: school.name, address: school.address },
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
    results: any[],
    progress: { category: string; change: number; trend: string }[],
  ): string {
    if (results.length === 0) {
      return 'За указанный период тесты не проходились.';
    }

    const avgScore =
      results.reduce((sum, r) => sum + (r.score / r.maxScore) * 100, 0) / results.length;

    const improving = progress.filter((p) => p.trend === 'up').length;
    const declining = progress.filter((p) => p.trend === 'down').length;

    let summary = `За период было пройдено ${results.length} тестов со средним результатом ${Math.round(avgScore)}%. `;

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
