'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { ResultDetail, categoryLabels, categoryColors, TestCategory } from '@/lib/types';
import api from '@/lib/api';
import {
  Button,
  Spinner,
  SkeletonCard,
  Disclaimer,
  CrisisWarning,
  EmptyStateError,
  RiskBadge
} from '@/components/ui';

// --- Gauge Chart ---
function GaugeChart({ percentage, riskZone }: { percentage: number; riskZone: string }) {
  const radius = 80;
  const circumference = Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;
  const color = riskZone === 'RED' ? '#EF4444' : riskZone === 'YELLOW' ? '#F59E0B' : '#10B981';

  return (
    <div className="flex flex-col items-center">
      <svg width="200" height="120" viewBox="0 0 200 120">
        <path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" stroke="#E5E7EB" strokeWidth="12" strokeLinecap="round" />
        <path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" stroke={color} strokeWidth="12" strokeLinecap="round"
          strokeDasharray={circumference} strokeDashoffset={strokeDashoffset}
          style={{ transition: 'stroke-dashoffset 1s ease-in-out' }} />
        <text x="100" y="85" textAnchor="middle" className="text-3xl font-bold" fill={color} fontSize="32">{percentage}%</text>
      </svg>
    </div>
  );
}

// --- Status config ---
const statusConfig: Record<string, { label: string; color: string; bg: string; border: string; message: string }> = {
  GREEN: {
    label: 'Норма',
    color: 'text-green-700',
    bg: 'bg-green-50',
    border: 'border-green-200',
    message: 'Результат в пределах нормы. Продолжайте поддерживать ребёнка.',
  },
  YELLOW: {
    label: 'Требует внимания',
    color: 'text-yellow-700',
    bg: 'bg-yellow-50',
    border: 'border-yellow-200',
    message: 'Рекомендуем повторить тест через 2-4 недели и обратить внимание на состояние ребёнка.',
  },
  RED: {
    label: 'Требует помощи специалиста',
    color: 'text-red-700',
    bg: 'bg-red-50',
    border: 'border-red-200',
    message: 'Рекомендуем обратиться к детскому психологу для консультации.',
  },
};

// --- Recommendations by category ---
function getRecommendations(category: string, riskZone: string) {
  const recs: Record<string, { home: string[]; specialist: string[]; exercises: string[] }> = {
    ANXIETY: {
      home: ['Создайте спокойную обстановку перед сном', 'Обсуждайте чувства ребёнка без осуждения', 'Ограничьте стрессовые ситуации', 'Соблюдайте режим дня'],
      specialist: ['Тревожность мешает учёбе или сну', 'Ребёнок избегает обычных ситуаций', 'Появились физические симптомы (боли в животе, головные боли)'],
      exercises: ['Дыхательная гимнастика 4-7-8', 'Техника "5 чувств" для заземления', 'Ведение дневника эмоций'],
    },
    MOTIVATION: {
      home: ['Хвалите за усилия, а не только за результат', 'Помогите найти интересные стороны учёбы', 'Ставьте достижимые цели вместе', 'Не сравнивайте с другими детьми'],
      specialist: ['Мотивация снижается больше 2 месяцев', 'Ребёнок отказывается ходить в школу', 'Резкое падение успеваемости'],
      exercises: ['Составление "карты желаний"', 'Метод маленьких шагов', 'Таблица достижений с поощрениями'],
    },
    SELF_ESTEEM: {
      home: ['Подчёркивайте сильные стороны ребёнка', 'Давайте ответственные поручения', 'Не критикуйте личность, а конкретные действия', 'Проводите качественное время вместе'],
      specialist: ['Ребёнок постоянно себя унижает', 'Избегает новых занятий из страха неудачи', 'Появились признаки депрессии'],
      exercises: ['Список "10 вещей, которые я делаю хорошо"', 'Аффирмации перед зеркалом', 'Упражнение "Письмо себе"'],
    },
    EMOTIONS: {
      home: ['Называйте эмоции вслух — помогите ребёнку их узнавать', 'Не запрещайте плакать или злиться', 'Обсуждайте эмоции персонажей в фильмах', 'Показывайте пример управления эмоциями'],
      specialist: ['Частые вспышки гнева или агрессии', 'Длительная подавленность (более 2 недель)', 'Ребёнок причиняет себе вред'],
      exercises: ['"Термометр эмоций" — оценка от 1 до 10', 'Рисование эмоций', 'Техника СТОП (Стой-Подумай-Осознай-Поступай)'],
    },
    CAREER: {
      home: ['Обсуждайте разные профессии в повседневных ситуациях', 'Посещайте дни открытых дверей', 'Поддерживайте увлечения ребёнка', 'Не навязывайте свой выбор'],
      specialist: ['Ребёнок испытывает сильную тревогу при мысли о будущем', 'Полное отсутствие интересов'],
      exercises: ['Составить список интересов и навыков', 'Интервью с представителями разных профессий', 'Пробный день в интересной сфере'],
    },
    SOCIAL: {
      home: ['Приглашайте одноклассников в гости', 'Запишите в кружок или секцию', 'Обсуждайте социальные ситуации', 'Тренируйте навыки общения через ролевые игры'],
      specialist: ['Ребёнок полностью изолирован от сверстников', 'Жертва буллинга', 'Агрессивное поведение к другим детям'],
      exercises: ['Игра "Комплимент другу"', 'Тренировка "Как начать разговор"', 'Обсуждение "Что бы ты сделал, если..."'],
    },
    COGNITIVE: {
      home: ['Создайте тихое рабочее место', 'Разбивайте задачи на маленькие шаги', 'Используйте таймер для фокусировки', 'Чередуйте учёбу с физической активностью'],
      specialist: ['Серьёзные трудности с концентрацией', 'Значительное отставание от программы', 'Подозрение на СДВГ или дислексию'],
      exercises: ['Техника Помодоро (25 мин работы / 5 мин отдыха)', 'Настольные игры на внимание', 'Чтение вслух по 15 минут в день'],
    },
    ATTENTION: {
      home: ['Создайте тихое рабочее место без отвлекающих факторов', 'Разбивайте задачи на маленькие шаги', 'Используйте визуальные таймеры', 'Делайте перерывы каждые 20-25 минут'],
      specialist: ['Серьёзные трудности с концентрацией в школе', 'Ребёнок не может сосредоточиться больше 5 минут', 'Подозрение на СДВГ'],
      exercises: ['Техника Помодоро (25 мин работы / 5 мин отдыха)', 'Игры на внимание и наблюдательность', 'Упражнение "Найди отличия"'],
    },
  };
  return recs[category] || recs.EMOTIONS;
}

export default function ResultDetailPage() {
  const router = useRouter();
  const params = useParams();
  const resultId = params.id as string;

  const [result, setResult] = useState<ResultDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    if (resultId) {
      fetchResult();
    }
  }, [resultId]);

  const fetchResult = async () => {
    try {
      const response = await api.get(`/results/${resultId}`);
      setResult(response.data);
    } catch (err: any) {
      setError('Не удалось загрузить результат');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    setDownloading(true);
    try {
      const response = await api.get(`/results/${resultId}/pdf`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `result-${resultId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to download PDF:', err);
    } finally {
      setDownloading(false);
    }
  };

  // Loading state with skeleton
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white shadow">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="animate-pulse">
              <div className="h-4 w-32 bg-gray-200 rounded mb-4"></div>
              <div className="h-8 w-64 bg-gray-200 rounded mb-2"></div>
              <div className="h-4 w-48 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </div>
    );
  }

  // Error state
  if (error || !result) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full">
          <EmptyStateError onRetry={fetchResult} />
          <div className="text-center mt-4">
            <Link href="/results" className="text-indigo-600 hover:text-indigo-800">
              Вернуться к результатам
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const riskZone = result.riskZone || 'GREEN';
  const status = statusConfig[riskZone] || statusConfig.GREEN;
  const category = (result.testCategory || 'EMOTIONS') as string;
  const recommendations = getRecommendations(category, riskZone);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Link
            href="/results"
            className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4"
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Назад к результатам
          </Link>
          <div className="flex items-start justify-between">
            <div>
              {result.testCategory && (
                <span
                  className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                    categoryColors[result.testCategory as TestCategory] ||
                    'bg-gray-100 text-gray-700'
                  } mb-3`}
                >
                  {categoryLabels[result.testCategory as TestCategory]?.ru ||
                    result.testCategory}
                </span>
              )}
              <h1 className="text-3xl font-bold text-gray-900">
                {result.testTitle || 'Результат теста'}
              </h1>
              {result.childName && (
                <p className="mt-2 text-gray-600">Ребёнок: {result.childName}</p>
              )}
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">
                {new Date(result.createdAt).toLocaleDateString('ru-RU', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Crisis Warning */}
        {result.aiInterpretation?.needSpecialist && (
          <div className="mb-6">
            <CrisisWarning onContactCrisis={() => router.push('/consultations')} />
          </div>
        )}

        {/* Score card with Gauge */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <div className="flex flex-col items-center">
            <h2 className="text-lg font-medium text-gray-600 mb-4">Общий результат</h2>

            <GaugeChart percentage={result.percentage} riskZone={riskZone} />

            <p className="text-sm text-gray-500 mt-2">
              {result.totalScore} из {result.maxScore} баллов ({result.percentage}%)
            </p>

            <div className="mt-4">
              <RiskBadge zone={riskZone} size="lg" />
            </div>
          </div>

          {/* Single status message */}
          <div className={`mt-6 rounded-lg p-4 border ${status.bg} ${status.border}`}>
            <p className={`text-center font-medium ${status.color}`}>
              {status.message}
            </p>
          </div>
        </div>

        {/* AI Interpretation (if available) */}
        {result.aiInterpretation && (
          <>
            {/* AI Summary */}
            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl shadow-md p-6 mb-6 border border-indigo-100">
              <div className="flex items-center mb-4">
                <svg className="w-6 h-6 text-indigo-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                <h2 className="text-xl font-semibold text-gray-900">AI-анализ</h2>
              </div>
              <p className="text-gray-700">{result.aiInterpretation.summary}</p>
            </div>

            {/* Strengths */}
            {result.aiInterpretation.strengths && result.aiInterpretation.strengths.length > 0 && (
              <div className="bg-green-50 rounded-xl shadow-md p-6 mb-6 border border-green-100">
                <h3 className="text-lg font-semibold text-green-800 mb-3 flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Сильные стороны
                </h3>
                <ul className="space-y-2">
                  {result.aiInterpretation.strengths.map((strength, i) => (
                    <li key={i} className="flex items-start">
                      <span className="text-green-500 mr-2">&#8226;</span>
                      <span className="text-green-800">{strength}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Areas for development */}
            {result.aiInterpretation.areasForDevelopment && result.aiInterpretation.areasForDevelopment.length > 0 && (
              <div className="bg-yellow-50 rounded-xl shadow-md p-6 mb-6 border border-yellow-100">
                <h3 className="text-lg font-semibold text-yellow-800 mb-3 flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  Области для развития
                </h3>
                <ul className="space-y-2">
                  {result.aiInterpretation.areasForDevelopment.map((area, i) => (
                    <li key={i} className="flex items-start">
                      <span className="text-yellow-500 mr-2">&#8226;</span>
                      <span className="text-yellow-800">{area}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Prioritized AI Recommendations */}
            {result.aiInterpretation.recommendations && result.aiInterpretation.recommendations.length > 0 && (
              <div className="bg-indigo-50 rounded-xl shadow-md p-6 mb-6 border border-indigo-100">
                <h3 className="text-lg font-semibold text-indigo-800 mb-3 flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                  </svg>
                  Персональные рекомендации
                </h3>
                <ol className="space-y-3">
                  {result.aiInterpretation.recommendations.map((rec, i) => (
                    <li key={i} className="flex items-start">
                      <span className="flex-shrink-0 w-6 h-6 flex items-center justify-center bg-indigo-200 text-indigo-800 rounded-full text-sm font-medium mr-3">
                        {i + 1}
                      </span>
                      <div className="text-indigo-800">
                        <span className="font-medium">{rec.title}</span>
                        <span className={`ml-2 px-2 py-0.5 text-xs rounded-full ${
                          rec.priority === 'high' ? 'bg-red-100 text-red-700' :
                          rec.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-green-100 text-green-700'
                        }`}>
                          {rec.priority === 'high' ? 'Важно' : rec.priority === 'medium' ? 'Средне' : 'Низкий'}
                        </span>
                        <p className="text-sm mt-1 opacity-90">{rec.description}</p>
                      </div>
                    </li>
                  ))}
                </ol>
              </div>
            )}

            {/* Specialist reason */}
            {result.aiInterpretation.needSpecialist && result.aiInterpretation.specialistReason && (
              <div className="bg-red-50 rounded-xl shadow-md p-6 mb-6 border border-red-100">
                <h3 className="text-lg font-semibold text-red-800 mb-3 flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  Почему рекомендуется консультация
                </h3>
                <p className="text-red-800">{result.aiInterpretation.specialistReason}</p>
              </div>
            )}
          </>
        )}

        {/* Detailed Recommendations Section */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <h3 className="font-semibold text-lg text-gray-900 mb-4">Рекомендации</h3>

          <div className="space-y-4">
            {/* Home recommendations */}
            <div className="bg-blue-50 rounded-lg p-4">
              <h4 className="font-medium text-blue-800 mb-2">Что делать дома</h4>
              <ul className="list-disc list-inside text-sm text-blue-700 space-y-1">
                {recommendations.home.map((r, i) => <li key={i}>{r}</li>)}
              </ul>
            </div>

            {/* Specialist recommendations (only for YELLOW/RED) */}
            {riskZone !== 'GREEN' && (
              <div className="bg-amber-50 rounded-lg p-4">
                <h4 className="font-medium text-amber-800 mb-2">Когда обратиться к специалисту</h4>
                <ul className="list-disc list-inside text-sm text-amber-700 space-y-1">
                  {recommendations.specialist.map((r, i) => <li key={i}>{r}</li>)}
                </ul>
              </div>
            )}

            {/* Exercises */}
            <div className="bg-purple-50 rounded-lg p-4">
              <h4 className="font-medium text-purple-800 mb-2">Полезные упражнения</h4>
              <ul className="list-disc list-inside text-sm text-purple-700 space-y-1">
                {recommendations.exercises.map((r, i) => <li key={i}>{r}</li>)}
              </ul>
            </div>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="mb-6">
          <Disclaimer />
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3">
          {(riskZone === 'YELLOW' || riskZone === 'RED') && (
            <Link
              href="/consultations"
              className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors inline-flex items-center"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Записаться к психологу
            </Link>
          )}
          <button
            onClick={handleDownloadPDF}
            disabled={downloading}
            className="bg-white border border-gray-300 px-6 py-3 rounded-lg font-medium hover:bg-gray-50 transition-colors inline-flex items-center disabled:opacity-50"
          >
            {downloading ? (
              <Spinner size="sm" color="current" className="mr-2" />
            ) : (
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            )}
            Скачать PDF
          </button>
          <Link
            href="/tests"
            className="bg-white border border-gray-300 px-6 py-3 rounded-lg font-medium hover:bg-gray-50 transition-colors inline-flex items-center"
          >
            Пройти другой тест
          </Link>
        </div>
      </div>
    </div>
  );
}
