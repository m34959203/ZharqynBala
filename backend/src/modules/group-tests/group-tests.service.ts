import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

interface StudentResult {
  studentId: string;
  studentName: string;
  score: number;
  maxScore: number;
  percentage: number;
  completedAt: string;
}

@Injectable()
export class GroupTestsService {
  private readonly logger = new Logger(GroupTestsService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Public: Get group test info by token (for students accessing via link)
   */
  async getByToken(token: string) {
    const groupTest = await this.prisma.groupTest.findUnique({
      where: { token },
      include: {
        test: {
          select: {
            id: true,
            titleRu: true,
            titleKz: true,
            descriptionRu: true,
            descriptionKz: true,
            category: true,
            durationMinutes: true,
            questions: {
              select: { id: true },
              orderBy: { order: 'asc' },
            },
          },
        },
        class: {
          include: {
            students: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
              orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
            },
            school: {
              select: {
                schoolName: true,
              },
            },
          },
        },
      },
    });

    if (!groupTest) {
      throw new NotFoundException('Тестирование не найдено');
    }

    // Check deadline
    const isExpired =
      groupTest.deadline && new Date(groupTest.deadline) < new Date();

    // Get already completed student IDs from results
    const results = ((groupTest.results as unknown) as StudentResult[]) || [];
    const completedStudentIds = results.map((r) => r.studentId);

    return {
      id: groupTest.id,
      token: groupTest.token,
      testName: groupTest.test.titleRu,
      testNameKz: groupTest.test.titleKz,
      testDescription: groupTest.test.descriptionRu,
      testDescriptionKz: groupTest.test.descriptionKz,
      category: groupTest.test.category,
      durationMinutes: groupTest.test.durationMinutes,
      questionCount: groupTest.test.questions.length,
      schoolName: groupTest.class.school.schoolName,
      className: `${groupTest.class.grade}-${groupTest.class.letter}`,
      deadline: groupTest.deadline,
      isExpired,
      anonymous: groupTest.anonymous,
      completedCount: groupTest.completedCount,
      totalCount: groupTest.totalCount,
      // In anonymous mode, don't send student list — anyone can take the test
      students: groupTest.anonymous
        ? []
        : groupTest.class.students.map((s) => ({
            id: s.id,
            firstName: s.firstName,
            lastName: s.lastName,
            completed: completedStudentIds.includes(s.id),
          })),
    };
  }

  /**
   * Public: Get test questions for a student (after selecting their name)
   */
  async getTestQuestions(token: string, studentId: string) {
    const groupTest = await this.prisma.groupTest.findUnique({
      where: { token },
      include: {
        test: {
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
                    // Intentionally NOT including score — don't reveal answers
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!groupTest) {
      throw new NotFoundException('Тестирование не найдено');
    }

    // Check if expired
    if (groupTest.deadline && new Date(groupTest.deadline) < new Date()) {
      throw new BadRequestException('Срок тестирования истёк');
    }

    // In anonymous mode, skip student validation
    if (!groupTest.anonymous) {
      // Check if student already completed
      const results = ((groupTest.results as unknown) as StudentResult[]) || [];
      if (results.some((r) => r.studentId === studentId)) {
        throw new BadRequestException('Вы уже прошли этот тест');
      }

      // Verify student exists in this class
      const student = await this.prisma.student.findFirst({
        where: {
          id: studentId,
          classId: groupTest.classId,
        },
      });

      if (!student) {
        throw new NotFoundException('Ученик не найден в этом классе');
      }
    }

    return {
      testId: groupTest.test.id,
      testName: groupTest.test.titleRu,
      testNameKz: groupTest.test.titleKz,
      durationMinutes: groupTest.test.durationMinutes,
      questions: groupTest.test.questions.map((q) => ({
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

  /**
   * Public: Submit all answers for a student and calculate result
   */
  async submitAnswers(
    token: string,
    body: {
      studentId: string;
      answers: Array<{ questionId: string; answerOptionId: string }>;
    },
  ) {
    const groupTest = await this.prisma.groupTest.findUnique({
      where: { token },
      include: {
        test: {
          include: {
            questions: {
              include: {
                options: true,
              },
            },
          },
        },
      },
    });

    if (!groupTest) {
      throw new NotFoundException('Тестирование не найдено');
    }

    // Check if expired
    if (groupTest.deadline && new Date(groupTest.deadline) < new Date()) {
      throw new BadRequestException('Срок тестирования истёк');
    }

    const existingResults = ((groupTest.results as unknown) as StudentResult[]) || [];

    let studentName = 'Аноним';
    if (!groupTest.anonymous) {
      // Check if already completed
      if (existingResults.some((r) => r.studentId === body.studentId)) {
        throw new BadRequestException('Вы уже прошли этот тест');
      }

      // Verify student
      const student = await this.prisma.student.findFirst({
        where: { id: body.studentId, classId: groupTest.classId },
      });
      if (!student) {
        throw new NotFoundException('Ученик не найден в этом классе');
      }
      studentName = `${student.lastName} ${student.firstName}`;
    } else {
      studentName = `Аноним #${existingResults.length + 1}`;
    }

    // Calculate score
    let totalScore = 0;
    let maxScore = 0;

    for (const question of groupTest.test.questions) {
      const maxOptionScore = Math.max(...question.options.map((o) => o.score));
      maxScore += maxOptionScore;

      const studentAnswer = body.answers.find(
        (a) => a.questionId === question.id,
      );
      if (studentAnswer) {
        const selectedOption = question.options.find(
          (o) => o.id === studentAnswer.answerOptionId,
        );
        if (selectedOption) {
          totalScore += selectedOption.score;
        }
      }
    }

    const percentage = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;

    // Build result entry
    const newResult: StudentResult = {
      studentId: groupTest.anonymous ? `anon-${existingResults.length + 1}` : body.studentId,
      studentName,
      score: totalScore,
      maxScore,
      percentage,
      completedAt: new Date().toISOString(),
    };

    // Update GroupTest: add result and increment completedCount
    const updatedResults = [...existingResults, newResult];

    await this.prisma.groupTest.update({
      where: { id: groupTest.id },
      data: {
        results: updatedResults as any,
        completedCount: { increment: 1 },
      },
    });

    this.logger.log(
      `Student ${student.lastName} ${student.firstName} completed group test ${groupTest.id}: ${totalScore}/${maxScore} (${percentage}%)`,
    );

    return {
      studentName: newResult.studentName,
      score: totalScore,
      maxScore,
      percentage,
      message: 'Тест успешно завершён!',
    };
  }

  /**
   * Authenticated: Get group test details with all student results
   */
  async getGroupTestDetails(id: string) {
    const groupTest = await this.prisma.groupTest.findUnique({
      where: { id },
      include: {
        test: {
          select: {
            id: true,
            titleRu: true,
            titleKz: true,
            category: true,
            durationMinutes: true,
          },
        },
        class: {
          include: {
            students: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
              orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
            },
            school: {
              select: {
                schoolName: true,
              },
            },
          },
        },
      },
    });

    if (!groupTest) {
      throw new NotFoundException('Тестирование не найдено');
    }

    const results = ((groupTest.results as unknown) as StudentResult[]) || [];
    const completedStudentIds = results.map((r) => r.studentId);

    return {
      id: groupTest.id,
      token: groupTest.token,
      testName: groupTest.test.titleRu,
      category: groupTest.test.category,
      schoolName: groupTest.class.school.schoolName,
      className: `${groupTest.class.grade}-${groupTest.class.letter}`,
      assignedAt: groupTest.assignedAt,
      deadline: groupTest.deadline,
      completedCount: groupTest.completedCount,
      totalCount: groupTest.totalCount,
      students: groupTest.class.students.map((s) => {
        const result = results.find((r) => r.studentId === s.id);
        return {
          id: s.id,
          firstName: s.firstName,
          lastName: s.lastName,
          completed: completedStudentIds.includes(s.id),
          score: result?.score ?? null,
          maxScore: result?.maxScore ?? null,
          percentage: result?.percentage ?? null,
          completedAt: result?.completedAt ?? null,
        };
      }),
    };
  }
}
