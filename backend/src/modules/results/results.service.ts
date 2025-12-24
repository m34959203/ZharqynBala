import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import {
  ResultResponseDto,
  ResultDetailDto,
  ResultsHistoryDto,
} from './dto/result-response.dto';

@Injectable()
export class ResultsService {
  constructor(private prisma: PrismaService) {}

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
      childName: result.session?.child
        ? `${result.session.child.firstName} ${result.session.child.lastName}`
        : undefined,
    };
  }
}
