import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { TestCategory, SessionStatus } from '@prisma/client';
import {
  TestResponseDto,
  TestDetailDto,
  TestSessionResponseDto,
  AnswerResponseDto,
  QuestionDto,
} from './dto/test-response.dto';
import { StartTestDto, SubmitAnswerDto, TestFilterDto } from './dto/test-request.dto';

@Injectable()
export class TestsService {
  constructor(private prisma: PrismaService) {}

  async findAll(filter: TestFilterDto): Promise<TestResponseDto[]> {
    const where: any = {
      isActive: true,
    };

    if (filter.category) {
      where.category = filter.category;
    }

    if (filter.isPremium !== undefined) {
      where.isPremium = filter.isPremium;
    }

    const tests = await this.prisma.test.findMany({
      where,
      orderBy: { order: 'asc' },
      include: {
        _count: {
          select: { questions: true },
        },
      },
    });

    return tests.map((test) => ({
      id: test.id,
      titleRu: test.titleRu,
      titleKz: test.titleKz,
      descriptionRu: test.descriptionRu,
      descriptionKz: test.descriptionKz,
      category: test.category,
      ageMin: test.ageMin,
      ageMax: test.ageMax,
      durationMinutes: test.durationMinutes,
      price: test.price,
      isPremium: test.isPremium,
      isActive: test.isActive,
      questionsCount: test._count.questions,
    }));
  }

  async findOne(id: string): Promise<TestDetailDto> {
    const test = await this.prisma.test.findUnique({
      where: { id },
      include: {
        questions: {
          orderBy: { order: 'asc' },
          include: {
            options: {
              orderBy: { order: 'asc' },
              select: {
                id: true,
                optionTextRu: true,
                optionTextKz: true,
                order: true,
              },
            },
          },
        },
      },
    });

    if (!test) {
      throw new NotFoundException('Test not found');
    }

    return {
      id: test.id,
      titleRu: test.titleRu,
      titleKz: test.titleKz,
      descriptionRu: test.descriptionRu,
      descriptionKz: test.descriptionKz,
      category: test.category,
      ageMin: test.ageMin,
      ageMax: test.ageMax,
      durationMinutes: test.durationMinutes,
      price: test.price,
      isPremium: test.isPremium,
      isActive: test.isActive,
      questions: test.questions.map((q) => ({
        id: q.id,
        questionTextRu: q.questionTextRu,
        questionTextKz: q.questionTextKz,
        questionType: q.questionType,
        order: q.order,
        isRequired: q.isRequired,
        options: q.options,
      })),
    };
  }

  async startTest(
    testId: string,
    userId: string,
    dto: StartTestDto,
  ): Promise<TestSessionResponseDto> {
    // Verify test exists
    const test = await this.prisma.test.findUnique({
      where: { id: testId },
      include: {
        questions: {
          orderBy: { order: 'asc' },
          take: 1,
          include: {
            options: {
              orderBy: { order: 'asc' },
            },
          },
        },
        _count: {
          select: { questions: true },
        },
      },
    });

    if (!test || !test.isActive) {
      throw new NotFoundException('Test not found or inactive');
    }

    // Verify child belongs to user
    const child = await this.prisma.child.findFirst({
      where: {
        id: dto.childId,
        parentId: userId,
      },
    });

    if (!child) {
      throw new ForbiddenException('Child not found or does not belong to you');
    }

    // Check if there's an existing in-progress session
    const existingSession = await this.prisma.testSession.findFirst({
      where: {
        testId,
        childId: dto.childId,
        status: SessionStatus.IN_PROGRESS,
      },
    });

    if (existingSession) {
      return this.getSessionStatus(existingSession.id);
    }

    // Check payment for premium tests
    if (test.isPremium || test.price > 0) {
      const payment = await this.prisma.payment.findFirst({
        where: {
          userId,
          relatedId: testId,
          status: 'COMPLETED',
        },
      });

      if (!payment) {
        throw new ForbiddenException('Payment required for this test');
      }
    }

    // Create new session
    const session = await this.prisma.testSession.create({
      data: {
        testId,
        childId: dto.childId,
        status: SessionStatus.IN_PROGRESS,
        currentQuestion: 0,
      },
    });

    const firstQuestion = test.questions[0];

    return {
      sessionId: session.id,
      testId: test.id,
      childId: dto.childId,
      status: session.status,
      currentQuestionIndex: 0,
      totalQuestions: test._count.questions,
      progress: 0,
      currentQuestion: firstQuestion
        ? {
            id: firstQuestion.id,
            questionTextRu: firstQuestion.questionTextRu,
            questionTextKz: firstQuestion.questionTextKz,
            questionType: firstQuestion.questionType,
            order: firstQuestion.order,
            isRequired: firstQuestion.isRequired,
            options: firstQuestion.options.map((o) => ({
              id: o.id,
              optionTextRu: o.optionTextRu,
              optionTextKz: o.optionTextKz,
              order: o.order,
            })),
          }
        : undefined,
    };
  }

  async getSessionStatus(sessionId: string): Promise<TestSessionResponseDto> {
    const session = await this.prisma.testSession.findUnique({
      where: { id: sessionId },
      include: {
        test: {
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
              select: { questions: true },
            },
          },
        },
        answers: true,
      },
    });

    if (!session) {
      throw new NotFoundException('Session not found');
    }

    const currentQuestionIndex = session.currentQuestion || 0;
    const totalQuestions = session.test._count.questions;
    const currentQuestion = session.test.questions[currentQuestionIndex];

    return {
      sessionId: session.id,
      testId: session.testId,
      childId: session.childId,
      status: session.status,
      currentQuestionIndex,
      totalQuestions,
      progress: Math.round((currentQuestionIndex / totalQuestions) * 100),
      currentQuestion: currentQuestion
        ? {
            id: currentQuestion.id,
            questionTextRu: currentQuestion.questionTextRu,
            questionTextKz: currentQuestion.questionTextKz,
            questionType: currentQuestion.questionType,
            order: currentQuestion.order,
            isRequired: currentQuestion.isRequired,
            options: currentQuestion.options.map((o) => ({
              id: o.id,
              optionTextRu: o.optionTextRu,
              optionTextKz: o.optionTextKz,
              order: o.order,
            })),
          }
        : undefined,
    };
  }

  async submitAnswer(
    sessionId: string,
    userId: string,
    dto: SubmitAnswerDto,
  ): Promise<AnswerResponseDto> {
    const session = await this.prisma.testSession.findUnique({
      where: { id: sessionId },
      include: {
        child: true,
        test: {
          include: {
            questions: {
              orderBy: { order: 'asc' },
              include: {
                options: {
                  orderBy: { order: 'asc' },
                },
              },
            },
          },
        },
      },
    });

    if (!session) {
      throw new NotFoundException('Session not found');
    }

    if (session.child.parentId !== userId) {
      throw new ForbiddenException('You do not have access to this session');
    }

    if (session.status !== SessionStatus.IN_PROGRESS) {
      throw new BadRequestException('Session is not in progress');
    }

    // Verify question belongs to this test
    const question = session.test.questions.find((q) => q.id === dto.questionId);
    if (!question) {
      throw new BadRequestException('Question not found in this test');
    }

    // Save answer
    await this.prisma.answer.upsert({
      where: {
        id: `${sessionId}-${dto.questionId}`,
      },
      create: {
        id: `${sessionId}-${dto.questionId}`,
        sessionId,
        questionId: dto.questionId,
        answerOptionId: dto.answerOptionId,
        textAnswer: dto.textAnswer,
      },
      update: {
        answerOptionId: dto.answerOptionId,
        textAnswer: dto.textAnswer,
        answeredAt: new Date(),
      },
    });

    // Find next question
    const currentIndex = session.test.questions.findIndex(
      (q) => q.id === dto.questionId,
    );
    const nextIndex = currentIndex + 1;
    const totalQuestions = session.test.questions.length;
    const isComplete = nextIndex >= totalQuestions;

    if (isComplete) {
      // Complete the session
      await this.prisma.testSession.update({
        where: { id: sessionId },
        data: {
          status: SessionStatus.COMPLETED,
          completedAt: new Date(),
          currentQuestion: totalQuestions,
        },
      });

      // Calculate result
      const result = await this.calculateResult(sessionId);

      return {
        success: true,
        isComplete: true,
        progress: 100,
        resultId: result.id,
      };
    }

    // Update session with next question index
    await this.prisma.testSession.update({
      where: { id: sessionId },
      data: {
        currentQuestion: nextIndex,
      },
    });

    const nextQuestion = session.test.questions[nextIndex];

    return {
      success: true,
      isComplete: false,
      progress: Math.round((nextIndex / totalQuestions) * 100),
      nextQuestion: {
        id: nextQuestion.id,
        questionTextRu: nextQuestion.questionTextRu,
        questionTextKz: nextQuestion.questionTextKz,
        questionType: nextQuestion.questionType,
        order: nextQuestion.order,
        isRequired: nextQuestion.isRequired,
        options: nextQuestion.options.map((o) => ({
          id: o.id,
          optionTextRu: o.optionTextRu,
          optionTextKz: o.optionTextKz,
          order: o.order,
        })),
      },
    };
  }

  private async calculateResult(sessionId: string) {
    const session = await this.prisma.testSession.findUnique({
      where: { id: sessionId },
      include: {
        answers: {
          include: {
            answerOption: true,
          },
        },
        test: {
          include: {
            questions: {
              include: {
                options: true,
              },
            },
          },
        },
        child: true,
      },
    });

    if (!session) {
      throw new NotFoundException('Session not found');
    }

    // Calculate total score
    let totalScore = 0;
    let maxScore = 0;

    for (const question of session.test.questions) {
      const maxOptionScore = Math.max(...question.options.map((o) => o.score));
      maxScore += maxOptionScore;

      const answer = session.answers.find((a) => a.questionId === question.id);
      if (answer?.answerOption) {
        totalScore += answer.answerOption.score;
      }
    }

    const percentage = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;

    // Generate interpretation based on score
    let interpretation = '';
    let recommendations = '';

    if (percentage >= 80) {
      interpretation = 'Отличный результат! Показатели находятся в оптимальной зоне.';
      recommendations = 'Продолжайте поддерживать текущий уровень развития ребёнка.';
    } else if (percentage >= 60) {
      interpretation = 'Хороший результат. Есть области для развития.';
      recommendations = 'Рекомендуем обратить внимание на отдельные аспекты развития.';
    } else if (percentage >= 40) {
      interpretation = 'Средний результат. Требуется внимание к некоторым областям.';
      recommendations = 'Рекомендуем консультацию со специалистом для детального анализа.';
    } else {
      interpretation = 'Результат требует внимания. Рекомендуем обратиться к специалисту.';
      recommendations = 'Настоятельно рекомендуем консультацию с детским психологом.';
    }

    // Create result
    const result = await this.prisma.result.create({
      data: {
        sessionId,
        totalScore,
        maxScore,
        interpretation,
        recommendations,
      },
    });

    return result;
  }

  async completeSession(sessionId: string, userId: string) {
    const session = await this.prisma.testSession.findUnique({
      where: { id: sessionId },
      include: { child: true },
    });

    if (!session) {
      throw new NotFoundException('Session not found');
    }

    if (session.child.parentId !== userId) {
      throw new ForbiddenException('You do not have access to this session');
    }

    if (session.status === SessionStatus.COMPLETED) {
      const result = await this.prisma.result.findUnique({
        where: { sessionId },
      });
      return { resultId: result?.id };
    }

    await this.prisma.testSession.update({
      where: { id: sessionId },
      data: {
        status: SessionStatus.COMPLETED,
        completedAt: new Date(),
      },
    });

    const result = await this.calculateResult(sessionId);

    return { resultId: result.id };
  }
}
