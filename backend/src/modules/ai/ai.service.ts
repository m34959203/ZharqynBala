import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../common/prisma/prisma.service';
import Anthropic from '@anthropic-ai/sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { TestCategory, QuestionType } from '@prisma/client';

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

export interface ParsedTestMethodology {
  titleRu: string;
  titleKz?: string;
  descriptionRu: string;
  descriptionKz?: string;
  category: TestCategory;
  ageMin: number;
  ageMax: number;
  durationMinutes: number;
  scoringType: 'percentage' | 'absolute';
  questions: {
    questionTextRu: string;
    questionTextKz?: string;
    questionType: QuestionType;
    options: {
      textRu: string;
      textKz?: string;
      score: number;
    }[];
  }[];
  interpretationRanges: {
    min: number;
    max: number;
    level: string;
    title: string;
    description: string;
    recommendations: string;
  }[];
}

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private anthropic: Anthropic | null = null;
  private gemini: GoogleGenerativeAI | null = null;

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
    try {
      const anthropicKey = this.configService.get<string>('ANTHROPIC_API_KEY');
      if (anthropicKey) {
        this.anthropic = new Anthropic({ apiKey: anthropicKey });
        this.logger.log('Anthropic API initialized');
      }

      const geminiKey = this.configService.get<string>('GEMINI_API_KEY');
      if (geminiKey) {
        this.gemini = new GoogleGenerativeAI(geminiKey);
        this.logger.log('Gemini API initialized');
      }

      if (!anthropicKey && !geminiKey) {
        this.logger.warn('No AI API keys configured, AI features will be disabled');
      }
    } catch (error) {
      this.logger.error('Failed to initialize AI services:', error);
    }
  }

  private isAIAvailable(): boolean {
    return this.anthropic !== null || this.gemini !== null;
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

  /**
   * Парсинг текста методики психологического теста и извлечение структуры
   */
  async parseTestMethodology(methodologyText: string): Promise<ParsedTestMethodology> {
    if (!this.isAIAvailable()) {
      throw new BadRequestException('AI сервис недоступен. Необходимо настроить GEMINI_API_KEY или ANTHROPIC_API_KEY в переменных окружения.');
    }

    const prompt = `Ты — эксперт по психологическим тестам. Проанализируй текст методики психологического теста и извлеки из него структурированные данные.

ТЕКСТ МЕТОДИКИ:
${methodologyText}

ТВОЯ ЗАДАЧА:
1. Определи название теста на русском языке
2. Напиши краткое описание теста (2-3 предложения)
3. Определи категорию теста: MOTIVATION (мотивация), SELF_ESTEEM (самооценка), ANXIETY (тревожность), ATTENTION (внимание), COGNITIVE (когнитивные способности), EMOTIONS (эмоции), SOCIAL (социальные навыки), CAREER (профориентация)
4. Определи возрастной диапазон (ageMin, ageMax)
5. Оцени время прохождения в минутах
6. Определи тип подсчёта баллов: "absolute" (абсолютные баллы с диапазонами) или "percentage" (процентное соотношение)
7. Извлеки ВСЕ вопросы с вариантами ответов и баллами за каждый вариант
8. Извлеки шкалу интерпретации результатов (диапазоны баллов с описаниями и рекомендациями)

ПРАВИЛА:
- Сохраняй ТОЧНУЮ формулировку вопросов из методики
- Указывай корректные баллы за каждый вариант ответа
- Тип вопроса: MULTIPLE_CHOICE (выбор одного варианта), SCALE (шкала оценки), YES_NO (да/нет), TEXT (текстовый ответ)
- Если что-то не указано явно в методике — выведи разумное значение по умолчанию
- Обязательно включи ВСЕ уровни интерпретации из методики

Ответь ТОЛЬКО в формате JSON (без markdown, без тройных кавычек):
{
  "titleRu": "Название теста",
  "descriptionRu": "Описание теста",
  "category": "MOTIVATION|SELF_ESTEEM|ANXIETY|ATTENTION|COGNITIVE|EMOTIONS|SOCIAL|CAREER",
  "ageMin": 7,
  "ageMax": 17,
  "durationMinutes": 15,
  "scoringType": "absolute|percentage",
  "questions": [
    {
      "questionTextRu": "Текст вопроса",
      "questionType": "MULTIPLE_CHOICE|SCALE|YES_NO|TEXT",
      "options": [
        {"textRu": "Вариант ответа", "score": 0}
      ]
    }
  ],
  "interpretationRanges": [
    {
      "min": 0,
      "max": 10,
      "level": "low|average|high|very_high",
      "title": "Название уровня",
      "description": "Описание результата",
      "recommendations": "Рекомендации для родителей"
    }
  ]
}`;

    try {
      let responseText: string;

      // Prefer Gemini if available
      if (this.gemini) {
        this.logger.log('Using Gemini API for methodology parsing');
        const model = this.gemini.getGenerativeModel({ model: 'gemini-1.5-flash' });
        const result = await model.generateContent(prompt);
        responseText = result.response.text();
      } else if (this.anthropic) {
        this.logger.log('Using Anthropic API for methodology parsing');
        const response = await this.anthropic.messages.create({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 8000,
          messages: [{ role: 'user', content: prompt }],
        });

        const content = response.content[0];
        if (content.type !== 'text') {
          throw new Error('Unexpected response type');
        }
        responseText = content.text;
      } else {
        throw new Error('No AI provider available');
      }

      // Extract JSON from response
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        this.logger.error('No JSON found in AI response:', responseText);
        throw new Error('Failed to parse methodology: no valid JSON in response');
      }

      const parsed = JSON.parse(jsonMatch[0]);

      // Validate and normalize the response
      return this.normalizeMethodology(parsed);
    } catch (error) {
      this.logger.error('Failed to parse methodology:', error);
      throw new BadRequestException(`Ошибка парсинга методики: ${error.message}`);
    }
  }

  private normalizeMethodology(parsed: any): ParsedTestMethodology {
    // Validate required fields
    if (!parsed.titleRu) {
      throw new Error('Title is required');
    }
    if (!parsed.questions || !Array.isArray(parsed.questions) || parsed.questions.length === 0) {
      throw new Error('Questions are required');
    }

    // Map category string to enum (matching schema: ANXIETY, MOTIVATION, ATTENTION, EMOTIONS, CAREER, SELF_ESTEEM, SOCIAL, COGNITIVE)
    const categoryMap: Record<string, TestCategory> = {
      'MOTIVATION': TestCategory.MOTIVATION,
      'SELF_ESTEEM': TestCategory.SELF_ESTEEM,
      'ANXIETY': TestCategory.ANXIETY,
      'ATTENTION': TestCategory.ATTENTION,
      'COGNITIVE': TestCategory.COGNITIVE,
      'EMOTIONS': TestCategory.EMOTIONS,
      'EMOTIONAL': TestCategory.EMOTIONS, // alias
      'SOCIAL': TestCategory.SOCIAL,
      'CAREER': TestCategory.CAREER,
      'BEHAVIOR': TestCategory.EMOTIONS, // fallback
      'OTHER': TestCategory.COGNITIVE, // fallback
    };

    // Map question type string to enum
    const questionTypeMap: Record<string, QuestionType> = {
      'MULTIPLE_CHOICE': QuestionType.MULTIPLE_CHOICE,
      'SCALE': QuestionType.SCALE,
      'YES_NO': QuestionType.YES_NO,
      'TEXT': QuestionType.TEXT,
    };

    return {
      titleRu: parsed.titleRu,
      titleKz: parsed.titleKz,
      descriptionRu: parsed.descriptionRu || 'Психологический тест',
      descriptionKz: parsed.descriptionKz,
      category: categoryMap[parsed.category] || TestCategory.COGNITIVE,
      ageMin: parsed.ageMin || 7,
      ageMax: parsed.ageMax || 17,
      durationMinutes: parsed.durationMinutes || 15,
      scoringType: parsed.scoringType === 'absolute' ? 'absolute' : 'percentage',
      questions: parsed.questions.map((q: any) => ({
        questionTextRu: q.questionTextRu,
        questionTextKz: q.questionTextKz,
        questionType: questionTypeMap[q.questionType] || QuestionType.MULTIPLE_CHOICE,
        options: (q.options || []).map((opt: any) => ({
          textRu: opt.textRu,
          textKz: opt.textKz,
          score: typeof opt.score === 'number' ? opt.score : 0,
        })),
      })),
      interpretationRanges: (parsed.interpretationRanges || []).map((r: any) => ({
        min: r.min || 0,
        max: r.max || 100,
        level: r.level || 'average',
        title: r.title || 'Результат',
        description: r.description || '',
        recommendations: r.recommendations || '',
      })),
    };
  }

  /**
   * Создаёт тест в базе данных из распарсенной методики
   */
  async createTestFromMethodology(methodology: ParsedTestMethodology): Promise<string> {
    const testId = `test-${Date.now()}`;

    // Build interpretation config
    const interpretationConfig = methodology.interpretationRanges.length > 0
      ? { ranges: methodology.interpretationRanges }
      : undefined;

    // Create test
    const test = await this.prisma.test.create({
      data: {
        id: testId,
        titleRu: methodology.titleRu,
        titleKz: methodology.titleKz || methodology.titleRu,
        descriptionRu: methodology.descriptionRu,
        descriptionKz: methodology.descriptionKz || methodology.descriptionRu,
        category: methodology.category,
        ageMin: methodology.ageMin,
        ageMax: methodology.ageMax,
        durationMinutes: methodology.durationMinutes,
        price: 0,
        isPremium: false,
        isActive: true,
        scoringType: methodology.scoringType,
        interpretationConfig: interpretationConfig,
      },
    });

    // Create questions and options
    for (let i = 0; i < methodology.questions.length; i++) {
      const q = methodology.questions[i];
      const questionId = `${testId}-q-${i + 1}`;

      const question = await this.prisma.question.create({
        data: {
          id: questionId,
          testId: test.id,
          questionTextRu: q.questionTextRu,
          questionTextKz: q.questionTextKz || q.questionTextRu,
          questionType: q.questionType,
          order: i + 1,
          isRequired: true,
        },
      });

      // Create answer options
      for (let j = 0; j < q.options.length; j++) {
        const opt = q.options[j];
        await this.prisma.answerOption.create({
          data: {
            id: `${questionId}-opt-${j + 1}`,
            questionId: question.id,
            optionTextRu: opt.textRu,
            optionTextKz: opt.textKz || opt.textRu,
            score: opt.score,
            order: j + 1,
          },
        });
      }
    }

    this.logger.log(`Created test "${methodology.titleRu}" with ${methodology.questions.length} questions`);
    return test.id;
  }
}
