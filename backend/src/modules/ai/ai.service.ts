import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../common/prisma/prisma.service';
import Anthropic from '@anthropic-ai/sdk';

export interface AIInterpretation {
  summary: string;
  strengths: string[];
  areasForDevelopment: string[];
  recommendations: {
    title: string;
    description: string;
    priority: 'high' | 'medium' | 'low';
  }[];
  needSpecialist: boolean;
  specialistReason?: string;
}

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private anthropic: Anthropic | null = null;

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
    const apiKey = this.configService.get<string>('ANTHROPIC_API_KEY');
    if (apiKey) {
      this.anthropic = new Anthropic({ apiKey });
    } else {
      this.logger.warn('ANTHROPIC_API_KEY not set, AI features will be disabled');
    }
  }

  async interpretTestResults(resultId: string): Promise<AIInterpretation> {
    const result = await this.prisma.result.findUnique({
      where: { id: resultId },
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
      throw new Error('Result not found');
    }

    // If AI is not available, return basic interpretation
    if (!this.anthropic) {
      return this.getBasicInterpretation(result);
    }

    const child = result.session.child;
    const test = result.session.test;
    const percentage = Math.round((result.totalScore / result.maxScore) * 100);

    // Calculate age
    const birthDate = new Date(child.birthDate);
    const today = new Date();
    const age = Math.floor(
      (today.getTime() - birthDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000),
    );

    const answersText = result.session.answers
      .map((a) => {
        const questionText = a.question.questionTextRu;
        const answerText = a.answerOption?.optionTextRu || a.textAnswer || 'Нет ответа';
        return `Вопрос: ${questionText}\nОтвет: ${answerText}`;
      })
      .join('\n\n');

    const prompt = `Ты — детский психолог-эксперт с опытом работы в Казахстане. Проанализируй результаты психологического теста ребёнка.

ИНФОРМАЦИЯ О РЕБЁНКЕ:
- Возраст: ${age} лет
- Класс: ${child.grade || 'не указан'}
- Пол: ${child.gender === 'MALE' ? 'мальчик' : 'девочка'}

ИНФОРМАЦИЯ О ТЕСТЕ:
- Название: ${test.titleRu}
- Категория: ${test.category}
- Результат: ${result.totalScore}/${result.maxScore} (${percentage}%)

ОТВЕТЫ НА ВОПРОСЫ:
${answersText}

ТРЕБОВАНИЯ К ОТВЕТУ:
1. Дай краткое резюме результатов (2-3 предложения)
2. Выдели 2-3 сильные стороны ребёнка
3. Определи 2-3 области для развития
4. Дай 3-4 конкретные рекомендации для родителей
5. Укажи, нужна ли консультация специалиста

ПРАВИЛА:
- Никогда не ставь диагнозы
- Используй позитивные формулировки
- Учитывай культурный контекст Казахстана
- Пиши на русском языке

Ответь строго в формате JSON:
{
  "summary": "краткое резюме",
  "strengths": ["сильная сторона 1", "сильная сторона 2"],
  "areasForDevelopment": ["область 1", "область 2"],
  "recommendations": [
    {"title": "название", "description": "описание", "priority": "high|medium|low"}
  ],
  "needSpecialist": true/false,
  "specialistReason": "причина (если needSpecialist=true)"
}`;

    try {
      const response = await this.anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2000,
        messages: [{ role: 'user', content: prompt }],
      });

      const content = response.content[0];
      if (content.type !== 'text') {
        throw new Error('Unexpected response type');
      }

      // Extract JSON from response
      const jsonMatch = content.text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      const interpretation: AIInterpretation = JSON.parse(jsonMatch[0]);

      // Update result with AI interpretation
      await this.prisma.result.update({
        where: { id: resultId },
        data: {
          interpretation: interpretation.summary,
          recommendations: interpretation.recommendations
            .map((r) => `• ${r.title}: ${r.description}`)
            .join('\n'),
        },
      });

      return interpretation;
    } catch (error) {
      this.logger.error('AI interpretation failed', error);
      return this.getBasicInterpretation(result);
    }
  }

  private getBasicInterpretation(result: any): AIInterpretation {
    const percentage = Math.round((result.totalScore / result.maxScore) * 100);

    let summary: string;
    let needSpecialist = false;
    let specialistReason: string | undefined;

    if (percentage >= 80) {
      summary = 'Отличный результат! Показатели ребёнка находятся в оптимальной зоне.';
    } else if (percentage >= 60) {
      summary = 'Хороший результат. Есть отдельные области, которые можно развивать.';
    } else if (percentage >= 40) {
      summary = 'Средний результат. Рекомендуем обратить внимание на некоторые аспекты развития.';
      needSpecialist = true;
      specialistReason = 'Рекомендуем консультацию для детального анализа результатов.';
    } else {
      summary = 'Результат требует внимания. Рекомендуем обратиться к специалисту.';
      needSpecialist = true;
      specialistReason = 'Показатели указывают на необходимость профессиональной консультации.';
    }

    return {
      summary,
      strengths: [
        'Ребёнок прошёл тестирование до конца',
        'Проявляет интерес к самопознанию',
      ],
      areasForDevelopment: [
        'Детальный анализ будет доступен после консультации со специалистом',
      ],
      recommendations: [
        {
          title: 'Обсудите результаты',
          description: 'Поговорите с ребёнком о его чувствах и переживаниях',
          priority: 'high',
        },
        {
          title: 'Создайте поддерживающую среду',
          description: 'Обеспечьте ребёнку чувство безопасности и принятия',
          priority: 'medium',
        },
        {
          title: 'Пройдите другие тесты',
          description: 'Получите более полную картину развития ребёнка',
          priority: 'low',
        },
      ],
      needSpecialist,
      specialistReason,
    };
  }

  async chat(userId: string, message: string, sessionId?: string): Promise<string> {
    if (!this.anthropic) {
      return 'AI-ассистент временно недоступен. Пожалуйста, обратитесь в поддержку.';
    }

    const systemPrompt = `Ты — дружелюбный помощник платформы Zharqyn Bala. Твоя задача — отвечать на вопросы родителей о психологическом развитии детей.

ПРАВИЛА:
1. Будь тёплым, поддерживающим, профессиональным
2. Никогда не ставь диагнозы
3. Не давай медицинские советы
4. При серьёзных вопросах рекомендуй консультацию психолога
5. Отвечай кратко (2-3 абзаца максимум)
6. Пиши на русском языке

ВОЗМОЖНОСТИ:
- Объяснение результатов тестов
- Общие советы по воспитанию
- Информация о платформе
- Рекомендации упражнений для детей`;

    try {
      const response = await this.anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 500,
        system: systemPrompt,
        messages: [{ role: 'user', content: message }],
      });

      const content = response.content[0];
      if (content.type !== 'text') {
        throw new Error('Unexpected response type');
      }

      return content.text;
    } catch (error) {
      this.logger.error('Chat failed', error);
      return 'Извините, произошла ошибка. Пожалуйста, попробуйте позже.';
    }
  }
}
