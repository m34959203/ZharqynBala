import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../common/prisma/prisma.service';

/**
 * Crisis Response Service
 *
 * Этот сервис отвечает за:
 * 1. Определение "красных флагов" в ответах на тесты
 * 2. Автоматическое уведомление родителей при высоком риске
 * 3. Предоставление информации о кризисных линиях помощи
 */

export interface CrisisIndicator {
  type: 'SUICIDE_RISK' | 'SELF_HARM' | 'ABUSE' | 'SEVERE_DEPRESSION' | 'SEVERE_ANXIETY' | 'OTHER';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  description: string;
  recommendedAction: string;
}

export interface CrisisAssessment {
  hasRisk: boolean;
  severity: 'NONE' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  indicators: CrisisIndicator[];
  recommendations: string[];
  crisisResources: CrisisResource[];
  requiresImmediateAction: boolean;
}

export interface CrisisResource {
  name: string;
  phone: string;
  description: string;
  available: string; // e.g., "24/7" or "9:00-21:00"
}

// Keywords and patterns that indicate crisis situations
const CRISIS_KEYWORDS = {
  suicideRisk: [
    'не хочу жить',
    'хочу умереть',
    'жизнь не имеет смысла',
    'лучше бы меня не было',
    'никто не будет скучать',
    'всем будет лучше без меня',
    'думаю о смерти',
    'самоубийство',
  ],
  selfHarm: [
    'причиняю себе боль',
    'режу себя',
    'бью себя',
    'хочу себя ранить',
    'наношу себе раны',
  ],
  abuse: [
    'бьют дома',
    'родители избивают',
    'насилие',
    'меня трогают',
    'заставляют делать плохое',
  ],
  severeDepression: [
    'постоянно плачу',
    'ничего не радует',
    'не вижу смысла',
    'чувствую себя пустым',
    'не могу встать с кровати',
    'не ем несколько дней',
  ],
};

// Kazakhstan crisis resources
const CRISIS_RESOURCES_KZ: CrisisResource[] = [
  {
    name: 'Телефон доверия для детей и подростков',
    phone: '150',
    description: 'Бесплатная конфиденциальная линия помощи для детей и подростков',
    available: '24/7',
  },
  {
    name: 'Единый социальный номер',
    phone: '111',
    description: 'Экстренная психологическая помощь и защита от насилия',
    available: '24/7',
  },
  {
    name: 'Линия помощи при домашнем насилии',
    phone: '1414',
    description: 'Помощь жертвам домашнего насилия',
    available: '24/7',
  },
  {
    name: 'Скорая психологическая помощь',
    phone: '+7 727 274 83 56',
    description: 'Психологическая помощь в кризисных ситуациях (Алматы)',
    available: '24/7',
  },
];

@Injectable()
export class CrisisService {
  private readonly logger = new Logger(CrisisService.name);

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {}

  /**
   * Analyze answers for crisis indicators
   */
  async analyzeAnswers(answers: { questionText: string; answerText: string }[]): Promise<CrisisAssessment> {
    const indicators: CrisisIndicator[] = [];
    const allText = answers
      .map((a) => `${a.questionText} ${a.answerText}`)
      .join(' ')
      .toLowerCase();

    // Check for suicide risk
    const suicideMatches = CRISIS_KEYWORDS.suicideRisk.filter((kw) => allText.includes(kw.toLowerCase()));
    if (suicideMatches.length > 0) {
      indicators.push({
        type: 'SUICIDE_RISK',
        severity: suicideMatches.length >= 2 ? 'CRITICAL' : 'HIGH',
        description: 'Выявлены признаки суицидального риска',
        recommendedAction: 'Немедленно связаться с кризисной линией или специалистом',
      });
    }

    // Check for self-harm
    const selfHarmMatches = CRISIS_KEYWORDS.selfHarm.filter((kw) => allText.includes(kw.toLowerCase()));
    if (selfHarmMatches.length > 0) {
      indicators.push({
        type: 'SELF_HARM',
        severity: 'HIGH',
        description: 'Выявлены признаки самоповреждения',
        recommendedAction: 'Рекомендуется консультация психолога',
      });
    }

    // Check for abuse
    const abuseMatches = CRISIS_KEYWORDS.abuse.filter((kw) => allText.includes(kw.toLowerCase()));
    if (abuseMatches.length > 0) {
      indicators.push({
        type: 'ABUSE',
        severity: 'CRITICAL',
        description: 'Выявлены признаки насилия или жестокого обращения',
        recommendedAction: 'Необходимо обратиться в службу защиты детей',
      });
    }

    // Check for severe depression
    const depressionMatches = CRISIS_KEYWORDS.severeDepression.filter((kw) => allText.includes(kw.toLowerCase()));
    if (depressionMatches.length >= 2) {
      indicators.push({
        type: 'SEVERE_DEPRESSION',
        severity: 'MEDIUM',
        description: 'Выявлены признаки выраженной депрессии',
        recommendedAction: 'Рекомендуется консультация специалиста',
      });
    }

    // Determine overall severity
    const hasCritical = indicators.some((i) => i.severity === 'CRITICAL');
    const hasHigh = indicators.some((i) => i.severity === 'HIGH');
    const hasMedium = indicators.some((i) => i.severity === 'MEDIUM');

    let overallSeverity: CrisisAssessment['severity'] = 'NONE';
    if (hasCritical) overallSeverity = 'CRITICAL';
    else if (hasHigh) overallSeverity = 'HIGH';
    else if (hasMedium) overallSeverity = 'MEDIUM';
    else if (indicators.length > 0) overallSeverity = 'LOW';

    // Build recommendations
    const recommendations: string[] = [];
    if (hasCritical) {
      recommendations.push('Немедленно свяжитесь с кризисной линией по номеру 150 (бесплатно, 24/7)');
      recommendations.push('Не оставляйте ребёнка одного');
      recommendations.push('Обратитесь в ближайший центр психологической помощи');
    } else if (hasHigh) {
      recommendations.push('Рекомендуется срочная консультация психолога');
      recommendations.push('Поговорите с ребёнком в спокойной обстановке');
      recommendations.push('Обратитесь на линию помощи 150 для консультации');
    } else if (hasMedium) {
      recommendations.push('Запишитесь на консультацию к психологу');
      recommendations.push('Уделите больше внимания эмоциональному состоянию ребёнка');
    }

    return {
      hasRisk: indicators.length > 0,
      severity: overallSeverity,
      indicators,
      recommendations,
      crisisResources: CRISIS_RESOURCES_KZ,
      requiresImmediateAction: hasCritical,
    };
  }

  /**
   * Analyze test result scores for risk factors
   */
  analyzeScores(testCategory: string, percentage: number): CrisisAssessment {
    const indicators: CrisisIndicator[] = [];
    const recommendations: string[] = [];

    // High anxiety score
    if (testCategory === 'ANXIETY' && percentage < 30) {
      indicators.push({
        type: 'SEVERE_ANXIETY',
        severity: 'MEDIUM',
        description: 'Выявлен высокий уровень тревожности',
        recommendedAction: 'Рекомендуется консультация психолога',
      });
      recommendations.push('Рекомендуется консультация специалиста по работе с тревожностью');
    }

    // Low self-esteem
    if (testCategory === 'SELF_ESTEEM' && percentage < 25) {
      indicators.push({
        type: 'OTHER',
        severity: 'MEDIUM',
        description: 'Выявлена очень низкая самооценка',
        recommendedAction: 'Рекомендуется консультация психолога',
      });
      recommendations.push('Рекомендуется работа с психологом над повышением самооценки');
    }

    // Low emotional score
    if (testCategory === 'EMOTIONAL' && percentage < 25) {
      indicators.push({
        type: 'SEVERE_DEPRESSION',
        severity: 'MEDIUM',
        description: 'Выявлены признаки эмоциональных проблем',
        recommendedAction: 'Рекомендуется консультация психолога',
      });
      recommendations.push('Рекомендуется консультация детского психолога');
    }

    const hasRisk = indicators.length > 0;
    const severity = hasRisk ? 'MEDIUM' : 'NONE';

    return {
      hasRisk,
      severity,
      indicators,
      recommendations,
      crisisResources: hasRisk ? CRISIS_RESOURCES_KZ : [],
      requiresImmediateAction: false,
    };
  }

  /**
   * Log crisis event for audit
   */
  async logCrisisEvent(data: {
    userId: string;
    childId?: string;
    sessionId?: string;
    severity: string;
    indicators: CrisisIndicator[];
    actionTaken: string;
  }): Promise<void> {
    this.logger.warn(`CRISIS EVENT: ${JSON.stringify(data)}`);

    // In production, this would:
    // 1. Store in a separate audit table
    // 2. Trigger notifications to admins
    // 3. Potentially notify authorities if required

    try {
      await this.prisma.securityLog.create({
        data: {
          userId: data.userId,
          eventType: 'DATA_ACCESS', // Using DATA_ACCESS as closest event type for crisis detection
          ipAddress: 'system',
          userAgent: 'crisis-service',
          metadata: JSON.parse(JSON.stringify({
            type: 'CRISIS_DETECTED',
            sessionId: data.sessionId || '',
            childId: data.childId,
            severity: data.severity,
            indicators: data.indicators,
            actionTaken: data.actionTaken,
          })),
        },
      });
    } catch (error) {
      this.logger.error('Failed to log crisis event', error);
    }
  }

  /**
   * Send crisis notification to parent
   */
  async notifyParent(data: {
    parentEmail: string;
    parentName: string;
    childName: string;
    severity: string;
    resources: CrisisResource[];
  }): Promise<void> {
    // In production, this would send an email/SMS notification
    this.logger.warn(`CRISIS NOTIFICATION: Sending to ${data.parentEmail} for child ${data.childName}`);

    // TODO: Implement actual notification via email/SMS service
    // For now, just log it
  }

  /**
   * Get crisis resources for a given region
   */
  getCrisisResources(region: string = 'KZ'): CrisisResource[] {
    // For now, only Kazakhstan resources
    return CRISIS_RESOURCES_KZ;
  }
}
