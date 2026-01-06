import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

/**
 * Scoring Service
 * Обрабатывает ответы тестов и формирует интерпретации
 * на основе валидированных психологических методик
 */

// Типы для интерпретаций
export interface ScoreLevel {
  minScore: number;
  maxScore: number;
  level: string;
  titleRu: string;
  titleKz: string;
  descriptionRu: string;
  recommendations: string[];
}

export interface CareerCategory {
  titleRu: string;
  titleKz: string;
  descriptionRu: string;
  professions: string[];
}

export interface ScoringResult {
  totalScore: number;
  maxScore: number;
  percentage: number;
  level: string;
  interpretation: string;
  recommendations: string[];
  categoryScores?: Record<string, number>;
  topCategories?: Array<{ category: string; score: number; title: string }>;
}

// ============================================
// ИНТЕРПРЕТАЦИИ ТЕСТОВ
// ============================================

// Тест школьной мотивации (Лусканова)
const SCHOOL_MOTIVATION_LEVELS: ScoreLevel[] = [
  {
    minScore: 25,
    maxScore: 30,
    level: 'high',
    titleRu: 'Высокий уровень школьной мотивации',
    titleKz: 'Мектеп мотивациясының жоғары деңгейі',
    descriptionRu: 'У ребёнка высокий уровень школьной мотивации и учебной активности. Такие дети отличаются наличием высоких познавательных мотивов, стремлением наиболее успешно выполнять все предъявляемые школой требования. Они очень чётко следуют всем указаниям учителя, добросовестны и ответственны, сильно переживают, если получают неудовлетворительные оценки.',
    recommendations: [
      'Поддерживайте интерес ребёнка к учёбе',
      'Предлагайте дополнительные развивающие задания',
      'Следите, чтобы ребёнок не переутомлялся',
      'Хвалите за старание, а не только за результат',
    ],
  },
  {
    minScore: 20,
    maxScore: 24,
    level: 'good',
    titleRu: 'Хорошая школьная мотивация',
    titleKz: 'Жақсы мектеп мотивациясы',
    descriptionRu: 'Подобные показатели имеют большинство учащихся начальных классов, успешно справляющихся с учебной деятельностью. Такой уровень мотивации является средней нормой.',
    recommendations: [
      'Продолжайте поддерживать интерес к учёбе',
      'Обсуждайте с ребёнком школьные события',
      'Помогайте справляться с трудностями',
      'Поощряйте общение с одноклассниками',
    ],
  },
  {
    minScore: 15,
    maxScore: 19,
    level: 'average',
    titleRu: 'Положительное отношение к школе',
    titleKz: 'Мектепке оң көзқарас',
    descriptionRu: 'Школа привлекает таких детей внеучебной деятельностью. Такие дети достаточно благополучно чувствуют себя в школе, однако чаще ходят в школу, чтобы общаться с друзьями, учителем. Познавательные мотивы у таких детей сформированы в меньшей степени, и учебный процесс их мало привлекает.',
    recommendations: [
      'Постарайтесь заинтересовать ребёнка учебными предметами',
      'Покажите практическую пользу знаний',
      'Используйте игровые формы обучения',
      'Обратите внимание на развитие познавательных интересов',
    ],
  },
  {
    minScore: 10,
    maxScore: 14,
    level: 'low',
    titleRu: 'Низкая школьная мотивация',
    titleKz: 'Мектеп мотивациясының төмен деңгейі',
    descriptionRu: 'Подобные школьники посещают школу неохотно, предпочитают пропускать занятия. На уроках часто занимаются посторонними делами, играми. Испытывают серьёзные затруднения в учебной деятельности. Находятся в состоянии неустойчивой адаптации к школе.',
    recommendations: [
      'Выясните причины нежелания ходить в школу',
      'Поговорите с классным руководителем',
      'Обратите внимание на отношения с одноклассниками',
      'Рассмотрите возможность консультации с психологом',
      'Создайте позитивную атмосферу вокруг темы школы',
    ],
  },
  {
    minScore: 0,
    maxScore: 9,
    level: 'negative',
    titleRu: 'Негативное отношение к школе',
    titleKz: 'Мектепке теріс көзқарас',
    descriptionRu: 'Такие дети испытывают серьёзные трудности в школе: они не справляются с учебной деятельностью, испытывают проблемы в общении с одноклассниками, во взаимоотношениях с учителем. Школа нередко воспринимается ими как враждебная среда, пребывание в которой для них невыносимо.',
    recommendations: [
      'ВАЖНО: Рекомендуется консультация детского психолога',
      'Срочно выясните причины проблем в школе',
      'Поговорите с учителем и школьным психологом',
      'Проверьте, нет ли буллинга',
      'Создайте дома атмосферу безопасности и принятия',
      'Не критикуйте ребёнка за школьные неудачи',
    ],
  },
];

// Тест самооценки (Ковалёв)
const SELF_ESTEEM_LEVELS: ScoreLevel[] = [
  {
    minScore: 0,
    maxScore: 25,
    level: 'high',
    titleRu: 'Высокий уровень самооценки',
    titleKz: 'Өзін-өзі бағалаудың жоғары деңгейі',
    descriptionRu: 'У подростка адекватно высокий уровень самооценки. Он уверен в себе, объективно оценивает свои возможности и способности. Это является хорошим показателем психологического здоровья.',
    recommendations: [
      'Поддерживайте уверенность ребёнка в себе',
      'Поощряйте новые начинания и инициативы',
      'Помогайте ставить реалистичные цели',
      'Учите конструктивно воспринимать критику',
    ],
  },
  {
    minScore: 26,
    maxScore: 45,
    level: 'average',
    titleRu: 'Средний уровень самооценки',
    titleKz: 'Өзін-өзі бағалаудың орташа деңгейі',
    descriptionRu: 'Самооценка находится в пределах нормы. Подросток в целом адекватно оценивает себя, но в отдельных ситуациях может испытывать неуверенность. Это нормальное состояние для подросткового возраста.',
    recommendations: [
      'Обращайте внимание на достижения ребёнка',
      'Помогайте справляться с неудачами',
      'Поддерживайте в стрессовых ситуациях',
      'Развивайте сильные стороны подростка',
    ],
  },
  {
    minScore: 46,
    maxScore: 128,
    level: 'low',
    titleRu: 'Низкий уровень самооценки',
    titleKz: 'Өзін-өзі бағалаудың төмен деңгейі',
    descriptionRu: 'У подростка выявлен низкий уровень самооценки. Он склонен недооценивать себя и свои возможности, может испытывать трудности в общении и принятии решений. Требуется особое внимание к психологическому состоянию.',
    recommendations: [
      'ВАЖНО: Рекомендуется консультация психолога',
      'Создайте атмосферу безусловного принятия дома',
      'Никогда не сравнивайте ребёнка с другими',
      'Отмечайте даже небольшие успехи',
      'Избегайте критики личности, критикуйте только поступки',
      'Помогите найти увлечение, где ребёнок успешен',
      'Развивайте навыки общения в безопасной среде',
    ],
  },
];

// Профориентация (ДДО Климова)
const CAREER_CATEGORIES: Record<string, CareerCategory> = {
  nature: {
    titleRu: 'Человек — Природа',
    titleKz: 'Адам — Табиғат',
    descriptionRu: 'Вам подходят профессии, связанные с живой и неживой природой: агроном, ветеринар, эколог, геолог, биолог, лесник, садовник, фермер.',
    professions: ['Агроном', 'Ветеринар', 'Эколог', 'Биолог', 'Геолог', 'Лесник', 'Фермер', 'Садовник', 'Зоолог'],
  },
  tech: {
    titleRu: 'Человек — Техника',
    titleKz: 'Адам — Техника',
    descriptionRu: 'Вам подходят профессии, связанные с техникой: инженер, программист, механик, электрик, архитектор, строитель, водитель.',
    professions: ['Инженер', 'Программист', 'Механик', 'Электрик', 'Архитектор', 'Строитель', 'Системный администратор', 'Робототехник'],
  },
  human: {
    titleRu: 'Человек — Человек',
    titleKz: 'Адам — Адам',
    descriptionRu: 'Вам подходят профессии, связанные с общением и помощью людям: врач, учитель, психолог, менеджер, продавец, юрист, журналист.',
    professions: ['Врач', 'Учитель', 'Психолог', 'Менеджер', 'Юрист', 'Журналист', 'Социальный работник', 'HR-специалист'],
  },
  sign: {
    titleRu: 'Человек — Знаковая система',
    titleKz: 'Адам — Белгі жүйесі',
    descriptionRu: 'Вам подходят профессии, связанные с информацией и знаками: программист, бухгалтер, переводчик, экономист, математик, аналитик.',
    professions: ['Программист', 'Бухгалтер', 'Переводчик', 'Экономист', 'Аналитик данных', 'Математик', 'Статистик', 'Редактор'],
  },
  art: {
    titleRu: 'Человек — Художественный образ',
    titleKz: 'Адам — Көркем бейне',
    descriptionRu: 'Вам подходят творческие профессии: художник, дизайнер, музыкант, актёр, режиссёр, писатель, фотограф, модельер.',
    professions: ['Художник', 'Дизайнер', 'Музыкант', 'Актёр', 'Режиссёр', 'Фотограф', 'Модельер', 'Архитектор'],
  },
};

// Тест тревожности (стандартный)
const ANXIETY_LEVELS: ScoreLevel[] = [
  {
    minScore: 0,
    maxScore: 20,
    level: 'low',
    titleRu: 'Низкий уровень тревожности',
    titleKz: 'Үрейлілік деңгейі төмен',
    descriptionRu: 'Уровень тревожности находится в норме. Ребёнок спокоен, уверен в себе, адекватно реагирует на стрессовые ситуации.',
    recommendations: [
      'Продолжайте поддерживать эмоциональный комфорт',
      'Поощряйте открытое общение о чувствах',
      'Помогайте развивать навыки саморегуляции',
    ],
  },
  {
    minScore: 21,
    maxScore: 40,
    level: 'average',
    titleRu: 'Умеренный уровень тревожности',
    titleKz: 'Орташа үрейлілік деңгейі',
    descriptionRu: 'Умеренный уровень тревожности является нормой для детского возраста. Тревога может возникать в определённых ситуациях (экзамены, выступления).',
    recommendations: [
      'Учите ребёнка техникам расслабления',
      'Помогайте готовиться к волнительным событиям',
      'Обсуждайте тревожащие ситуации',
      'Поддерживайте позитивный настрой',
    ],
  },
  {
    minScore: 41,
    maxScore: 60,
    level: 'elevated',
    titleRu: 'Повышенный уровень тревожности',
    titleKz: 'Үрейлілік деңгейі жоғары',
    descriptionRu: 'Повышенный уровень тревожности. Ребёнок часто беспокоится, испытывает напряжение. Это может влиять на учёбу и общение.',
    recommendations: [
      'Рекомендуется консультация детского психолога',
      'Создайте спокойную атмосферу дома',
      'Снизьте нагрузку на ребёнка',
      'Практикуйте техники дыхания и релаксации',
      'Не критикуйте за проявление тревоги',
    ],
  },
  {
    minScore: 61,
    maxScore: 100,
    level: 'high',
    titleRu: 'Высокий уровень тревожности',
    titleKz: 'Үрейлілік деңгейі өте жоғары',
    descriptionRu: 'Высокий уровень тревожности требует особого внимания. Ребёнок испытывает постоянное беспокойство, что существенно влияет на качество жизни.',
    recommendations: [
      'ВАЖНО: Необходима консультация детского психолога',
      'Обеспечьте психологическую безопасность',
      'Минимизируйте стрессовые факторы',
      'Рассмотрите возможность терапии',
      'Поддерживайте режим дня и сон',
      'Ограничьте использование гаджетов',
    ],
  },
];

@Injectable()
export class ScoringService {
  private readonly logger = new Logger(ScoringService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Рассчитать результат теста
   */
  async calculateResult(
    sessionId: string,
    testId: string,
  ): Promise<ScoringResult> {
    // Получить сессию с ответами
    const session = await this.prisma.testSession.findUnique({
      where: { id: sessionId },
      include: {
        test: true,
        answers: {
          include: {
            question: true,
            answerOption: true,
          },
        },
      },
    });

    if (!session) {
      throw new Error(`Session not found: ${sessionId}`);
    }

    // Определить тип теста и применить соответствующий алгоритм
    const testIdLower = testId.toLowerCase();

    if (testIdLower.includes('motivation') || testIdLower.includes('luskanova')) {
      return this.calculateSchoolMotivation(session);
    }

    if (testIdLower.includes('selfesteem') || testIdLower.includes('kovalev')) {
      return this.calculateSelfEsteem(session);
    }

    if (testIdLower.includes('career') || testIdLower.includes('klimov')) {
      return this.calculateCareerOrientation(session);
    }

    if (testIdLower.includes('anxiety')) {
      return this.calculateAnxiety(session);
    }

    // Стандартный расчёт для остальных тестов
    return this.calculateGeneric(session);
  }

  /**
   * Тест школьной мотивации (Лусканова)
   */
  private calculateSchoolMotivation(session: any): ScoringResult {
    let totalScore = 0;
    const maxScore = 30; // 10 вопросов по 3 балла

    for (const answer of session.answers) {
      if (answer.answerOption) {
        totalScore += answer.answerOption.score || 0;
      }
    }

    const level = this.findLevel(totalScore, SCHOOL_MOTIVATION_LEVELS);
    const percentage = Math.round((totalScore / maxScore) * 100);

    return {
      totalScore,
      maxScore,
      percentage,
      level: level?.level || 'unknown',
      interpretation: level?.descriptionRu || 'Интерпретация недоступна',
      recommendations: level?.recommendations || [],
    };
  }

  /**
   * Тест самооценки (Ковалёв)
   * Обратная шкала: чем ниже балл, тем выше самооценка
   */
  private calculateSelfEsteem(session: any): ScoringResult {
    let totalScore = 0;
    const maxScore = 128; // 32 вопроса по 4 балла

    for (const answer of session.answers) {
      if (answer.answerOption) {
        totalScore += answer.answerOption.score || 0;
      }
    }

    const level = this.findLevel(totalScore, SELF_ESTEEM_LEVELS);
    // Инвертируем процент для интуитивного понимания
    const percentage = Math.round(((maxScore - totalScore) / maxScore) * 100);

    return {
      totalScore,
      maxScore,
      percentage,
      level: level?.level || 'unknown',
      interpretation: level?.descriptionRu || 'Интерпретация недоступна',
      recommendations: level?.recommendations || [],
    };
  }

  /**
   * Профориентация (ДДО Климова)
   * Подсчёт баллов по 5 категориям
   */
  private calculateCareerOrientation(session: any): ScoringResult {
    const categoryScores: Record<string, number> = {
      nature: 0,
      tech: 0,
      human: 0,
      sign: 0,
      art: 0,
    };

    for (const answer of session.answers) {
      if (answer.answerOption) {
        // Получаем категорию из metadata или из id опции
        const metadata = answer.answerOption.metadata as Record<string, any>;
        const category = metadata?.category || this.inferCategory(answer.answerOption);
        if (category && categoryScores[category] !== undefined) {
          categoryScores[category] += answer.answerOption.score || 1;
        }
      }
    }

    // Сортировать категории по баллам
    const sorted = Object.entries(categoryScores)
      .sort(([, a], [, b]) => b - a);

    const topCategories = sorted.slice(0, 3).map(([cat, score]) => ({
      category: cat,
      score,
      title: CAREER_CATEGORIES[cat]?.titleRu || cat,
    }));

    const topCategory = sorted[0][0];
    const catInfo = CAREER_CATEGORIES[topCategory];
    const totalScore = Object.values(categoryScores).reduce((a, b) => a + b, 0);
    const maxScore = 20; // 20 вопросов

    // Формируем интерпретацию
    let interpretation = `Ваш ведущий тип профессиональной направленности: ${catInfo?.titleRu || topCategory}.\n\n`;
    interpretation += catInfo?.descriptionRu + '\n\n';
    interpretation += 'Рекомендуемые профессии: ' + (catInfo?.professions.join(', ') || 'Не определено');

    if (sorted[1]) {
      const secondCat = CAREER_CATEGORIES[sorted[1][0]];
      interpretation += `\n\nТакже выражен тип: ${secondCat?.titleRu || sorted[1][0]}`;
    }

    return {
      totalScore,
      maxScore,
      percentage: Math.round((sorted[0][1] / 8) * 100), // 8 - макс по категории
      level: topCategory,
      interpretation,
      recommendations: catInfo?.professions.slice(0, 5) || [],
      categoryScores,
      topCategories,
    };
  }

  /**
   * Тест тревожности
   */
  private calculateAnxiety(session: any): ScoringResult {
    let totalScore = 0;
    let maxScore = 0;

    for (const answer of session.answers) {
      if (answer.answerOption) {
        totalScore += answer.answerOption.score || 0;
        // Предполагаем максимум 4 балла за вопрос
        maxScore += 4;
      }
    }

    // Нормализуем к 100-балльной шкале если нужно
    const normalizedScore = maxScore > 0
      ? Math.round((totalScore / maxScore) * 100)
      : 0;

    const level = this.findLevel(normalizedScore, ANXIETY_LEVELS);
    const percentage = normalizedScore;

    return {
      totalScore,
      maxScore,
      percentage,
      level: level?.level || 'unknown',
      interpretation: level?.descriptionRu || 'Интерпретация недоступна',
      recommendations: level?.recommendations || [],
    };
  }

  /**
   * Стандартный расчёт для других тестов
   */
  private calculateGeneric(session: any): ScoringResult {
    let totalScore = 0;
    let maxScore = 0;

    for (const answer of session.answers) {
      if (answer.answerOption) {
        totalScore += answer.answerOption.score || 0;
        maxScore += 4; // Предполагаем максимум 4 балла за вопрос
      }
    }

    const percentage = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;

    return {
      totalScore,
      maxScore,
      percentage,
      level: this.getGenericLevel(percentage),
      interpretation: this.getGenericInterpretation(percentage),
      recommendations: this.getGenericRecommendations(percentage),
    };
  }

  /**
   * Найти уровень интерпретации по баллу
   */
  private findLevel(score: number, levels: ScoreLevel[]): ScoreLevel | undefined {
    return levels.find(l => score >= l.minScore && score <= l.maxScore);
  }

  /**
   * Определить категорию по ответу (для ДДО Климова)
   */
  private inferCategory(answerOption: any): string | null {
    const text = (answerOption.optionTextRu || '').toLowerCase();

    if (text.includes('животн') || text.includes('растен') || text.includes('природ')) {
      return 'nature';
    }
    if (text.includes('машин') || text.includes('техник') || text.includes('прибор') || text.includes('ремонт')) {
      return 'tech';
    }
    if (text.includes('люд') || text.includes('помога') || text.includes('учи') || text.includes('общен')) {
      return 'human';
    }
    if (text.includes('табли') || text.includes('схем') || text.includes('чертеж') || text.includes('расчёт')) {
      return 'sign';
    }
    if (text.includes('худож') || text.includes('музык') || text.includes('рисов') || text.includes('сцен')) {
      return 'art';
    }

    return null;
  }

  private getGenericLevel(percentage: number): string {
    if (percentage >= 80) return 'excellent';
    if (percentage >= 60) return 'good';
    if (percentage >= 40) return 'average';
    if (percentage >= 20) return 'below_average';
    return 'low';
  }

  private getGenericInterpretation(percentage: number): string {
    if (percentage >= 80) {
      return 'Отличный результат! Ребёнок показывает высокий уровень по данному тесту.';
    }
    if (percentage >= 60) {
      return 'Хороший результат. Показатели находятся в пределах нормы.';
    }
    if (percentage >= 40) {
      return 'Средний результат. Есть области, требующие внимания.';
    }
    if (percentage >= 20) {
      return 'Результат ниже среднего. Рекомендуется обратить внимание на данную область.';
    }
    return 'Низкий результат. Рекомендуется консультация специалиста.';
  }

  private getGenericRecommendations(percentage: number): string[] {
    if (percentage >= 80) {
      return [
        'Продолжайте поддерживать ребёнка',
        'Развивайте сильные стороны',
      ];
    }
    if (percentage >= 60) {
      return [
        'Продолжайте работу в этом направлении',
        'Обращайте внимание на моменты, вызывающие затруднения',
      ];
    }
    if (percentage >= 40) {
      return [
        'Уделите внимание развитию данной области',
        'Обсудите результаты с педагогом',
        'Рассмотрите дополнительные занятия',
      ];
    }
    return [
      'Рекомендуется консультация специалиста',
      'Обсудите результаты со школьным психологом',
      'Создайте поддерживающую среду дома',
    ];
  }
}
