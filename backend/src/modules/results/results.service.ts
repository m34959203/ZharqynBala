import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { PdfService } from '../pdf/pdf.service';
import { ScoringService, ScoringResult } from './scoring.service';
import {
  ResultResponseDto,
  ResultDetailDto,
  ResultsHistoryDto,
} from './dto/result-response.dto';

@Injectable()
export class ResultsService {
  private readonly logger = new Logger(ResultsService.name);

  constructor(
    private prisma: PrismaService,
    private pdfService: PdfService,
    private scoringService: ScoringService,
  ) {}

  async findAll(userId: string): Promise<ResultsHistoryDto> {
    // Get all children of the user
    const children = await this.prisma.child.findMany({
      where: { parentId: userId },
      select: { id: true },
    });

    const childIds = children.map((c) => c.id);

    const results = await this.prisma.result.findMany({
      where: {
        session: {
          childId: { in: childIds },
        },
      },
      include: {
        session: {
          include: {
            test: true,
            child: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return {
      results: results.map((r) => this.mapToDto(r)),
      total: results.length,
    };
  }

  async findOne(id: string, userId: string): Promise<ResultDetailDto> {
    const result = await this.prisma.result.findUnique({
      where: { id },
      include: {
        session: {
          include: {
            test: true,
            child: true,
            answers: {
              include: {
                question: true,
                answerOption: true,
              },
            },
          },
        },
      },
    });

    if (!result) {
      throw new NotFoundException('Result not found');
    }

    // Verify access
    if (result.session.child.parentId !== userId) {
      throw new ForbiddenException('You do not have access to this result');
    }

    const percentage =
      result.maxScore > 0
        ? Math.round((result.totalScore / result.maxScore) * 100)
        : 0;

    const test = result.session.test as any;

    return {
      id: result.id,
      sessionId: result.sessionId,
      totalScore: result.totalScore,
      maxScore: result.maxScore,
      percentage,
      interpretation: result.interpretation,
      recommendations: result.recommendations,
      pdfUrl: result.pdfUrl || undefined,
      createdAt: result.createdAt,
      testTitle: result.session.test.titleRu,
      testCategory: result.session.test.category,
      scoringType: test.scoringType || 'percentage',
      childName: `${result.session.child.firstName} ${result.session.child.lastName}`,
      answers: result.session.answers.map((a) => ({
        questionText: a.question.questionTextRu,
        answerText: a.answerOption?.optionTextRu || a.textAnswer || '',
        score: a.answerOption?.score || 0,
      })),
    };
  }

  async findBySession(sessionId: string, userId: string): Promise<ResultResponseDto> {
    const result = await this.prisma.result.findUnique({
      where: { sessionId },
      include: {
        session: {
          include: {
            test: true,
            child: true,
          },
        },
      },
    });

    if (!result) {
      throw new NotFoundException('Result not found');
    }

    // Verify access
    if (result.session.child.parentId !== userId) {
      throw new ForbiddenException('You do not have access to this result');
    }

    return this.mapToDto(result);
  }

  async getChildResults(childId: string, userId: string): Promise<ResultsHistoryDto> {
    // Verify child belongs to user
    const child = await this.prisma.child.findFirst({
      where: {
        id: childId,
        parentId: userId,
      },
    });

    if (!child) {
      throw new ForbiddenException('Child not found or does not belong to you');
    }

    const results = await this.prisma.result.findMany({
      where: {
        session: {
          childId,
        },
      },
      include: {
        session: {
          include: {
            test: true,
            child: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return {
      results: results.map((r) => this.mapToDto(r)),
      total: results.length,
    };
  }

  async generatePdf(id: string, userId: string): Promise<Buffer> {
    const result = await this.prisma.result.findUnique({
      where: { id },
      include: {
        session: {
          include: {
            test: true,
            child: true,
            answers: {
              include: {
                question: true,
                answerOption: true,
              },
            },
          },
        },
      },
    });

    if (!result) {
      throw new NotFoundException('Result not found');
    }

    // Verify access
    if (result.session.child.parentId !== userId) {
      throw new ForbiddenException('You do not have access to this result');
    }

    const childAge = this.calculateAge(result.session.child.birthDate);

    // Build recommendations list from stored recommendations
    const recommendations = result.recommendations
      ? result.recommendations.split('\n').filter((r: string) => r.trim())
      : [];

    return this.pdfService.generateResultPdf({
      id: result.id,
      testName: result.session.test.titleRu,
      childName: `${result.session.child.firstName} ${result.session.child.lastName}`,
      childAge,
      completedAt: result.createdAt,
      score: result.totalScore,
      maxScore: result.maxScore,
      categories: [],
      recommendations,
      interpretation: result.interpretation,
    });
  }

  /**
   * Рассчитать и сохранить результат теста
   * Использует ScoringService для валидированного расчёта
   */
  async calculateAndSaveResult(sessionId: string, userId: string): Promise<ResultDetailDto> {
    // Получить сессию
    const session = await this.prisma.testSession.findUnique({
      where: { id: sessionId },
      include: {
        test: true,
        child: true,
      },
    });

    if (!session) {
      throw new NotFoundException('Session not found');
    }

    // Проверить доступ
    if (session.child.parentId !== userId) {
      throw new ForbiddenException('You do not have access to this session');
    }

    // Проверить что сессия завершена
    if (session.status !== 'COMPLETED') {
      throw new ForbiddenException('Test session is not completed');
    }

    // Проверить что результат ещё не существует
    const existingResult = await this.prisma.result.findUnique({
      where: { sessionId },
    });

    if (existingResult) {
      this.logger.log(`Result already exists for session ${sessionId}`);
      return this.findOne(existingResult.id, userId);
    }

    // Рассчитать результат через ScoringService
    this.logger.log(`Calculating result for session ${sessionId}, test ${session.testId}`);
    const scoringResult: ScoringResult = await this.scoringService.calculateResult(
      sessionId,
      session.testId,
    );

    // Формируем расширенную интерпретацию с метаданными
    const extendedInterpretation = `${scoringResult.interpretation}\n\n---\nУровень: ${scoringResult.level}\nРезультат: ${scoringResult.percentage}%`;

    // Сохранить результат
    const result = await this.prisma.result.create({
      data: {
        sessionId,
        totalScore: scoringResult.totalScore,
        maxScore: scoringResult.maxScore,
        interpretation: extendedInterpretation,
        recommendations: scoringResult.recommendations.join('\n'),
      },
    });

    this.logger.log(`Result saved: ${result.id}, score: ${scoringResult.totalScore}/${scoringResult.maxScore}`);

    return this.findOne(result.id, userId);
  }

  /**
   * Пересчитать результат теста
   */
  async recalculateResult(resultId: string, userId: string): Promise<ResultDetailDto> {
    const result = await this.prisma.result.findUnique({
      where: { id: resultId },
      include: {
        session: {
          include: {
            test: true,
            child: true,
          },
        },
      },
    });

    if (!result) {
      throw new NotFoundException('Result not found');
    }

    if (result.session.child.parentId !== userId) {
      throw new ForbiddenException('You do not have access to this result');
    }

    // Пересчитать
    const scoringResult = await this.scoringService.calculateResult(
      result.sessionId,
      result.session.testId,
    );

    // Формируем расширенную интерпретацию с метаданными
    const extendedInterpretation = `${scoringResult.interpretation}\n\n---\nУровень: ${scoringResult.level}\nРезультат: ${scoringResult.percentage}%`;

    // Обновить результат
    await this.prisma.result.update({
      where: { id: resultId },
      data: {
        totalScore: scoringResult.totalScore,
        maxScore: scoringResult.maxScore,
        interpretation: extendedInterpretation,
        recommendations: scoringResult.recommendations.join('\n'),
      },
    });

    return this.findOne(resultId, userId);
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

  private mapToDto(result: any): ResultResponseDto {
    const percentage =
      result.maxScore > 0
        ? Math.round((result.totalScore / result.maxScore) * 100)
        : 0;

    return {
      id: result.id,
      sessionId: result.sessionId,
      totalScore: result.totalScore,
      maxScore: result.maxScore,
      percentage,
      interpretation: result.interpretation,
      recommendations: result.recommendations,
      pdfUrl: result.pdfUrl || undefined,
      createdAt: result.createdAt,
      testTitle: result.session?.test?.titleRu,
      testCategory: result.session?.test?.category,
      scoringType: result.session?.test?.scoringType || 'percentage',
      childName: result.session?.child
        ? `${result.session.child.firstName} ${result.session.child.lastName}`
        : undefined,
    };
  }
}
