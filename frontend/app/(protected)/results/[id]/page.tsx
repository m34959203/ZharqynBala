'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { ResultDetail, categoryLabels, categoryColors, TestCategory } from '@/lib/types';
import api from '@/lib/api';

export default function ResultDetailPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const resultId = params.id as string;

  const [result, setResult] = useState<ResultDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

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

  const getScoreColor = (percentage: number) => {
    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 60) return 'text-blue-600';
    if (percentage >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBgColor = (percentage: number) => {
    if (percentage >= 80) return 'bg-green-500';
    if (percentage >= 60) return 'bg-blue-500';
    if (percentage >= 40) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            {error || 'Результат не найден'}
          </h2>
          <Link href="/results" className="text-indigo-600 hover:text-indigo-800">
            Вернуться к результатам
          </Link>
        </div>
      </div>
    );
  }

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
        {/* Score card */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="text-center md:text-left mb-4 md:mb-0">
              <h2 className="text-lg font-medium text-gray-600 mb-2">
                Общий результат
              </h2>
              <div className={`text-5xl font-bold ${getScoreColor(result.percentage)}`}>
                {result.percentage}%
              </div>
              <p className="text-gray-500 mt-1">
                {result.totalScore} из {result.maxScore} баллов
              </p>
            </div>
            <div className="w-full md:w-1/2">
              <div className="w-full bg-gray-200 rounded-full h-4">
                <div
                  className={`h-4 rounded-full ${getScoreBgColor(result.percentage)} transition-all duration-500`}
                  style={{ width: `${result.percentage}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* Interpretation */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Интерпретация результатов
          </h2>
          <p className="text-gray-600 leading-relaxed">{result.interpretation}</p>
        </div>

        {/* Recommendations */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Рекомендации
          </h2>
          <div className="text-gray-600 leading-relaxed whitespace-pre-line">
            {result.recommendations}
          </div>
        </div>

        {/* AI Interpretation (if available) */}
        {result.aiInterpretation && (
          <>
            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl shadow-md p-6 mb-6 border border-indigo-100">
              <div className="flex items-center mb-4">
                <svg className="w-6 h-6 text-indigo-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                <h2 className="text-xl font-semibold text-gray-900">
                  AI-анализ
                </h2>
              </div>
              <p className="text-gray-700">{result.aiInterpretation.summary}</p>
            </div>

            {/* Strengths */}
            {result.aiInterpretation.strengths.length > 0 && (
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
                      <span className="text-green-500 mr-2">•</span>
                      <span className="text-green-800">{strength}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Areas for development */}
            {result.aiInterpretation.areasForDevelopment.length > 0 && (
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
                      <span className="text-yellow-500 mr-2">•</span>
                      <span className="text-yellow-800">{area}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Need specialist warning */}
            {result.aiInterpretation.needSpecialist && (
              <div className="bg-red-50 rounded-xl shadow-md p-6 mb-6 border border-red-100">
                <h3 className="text-lg font-semibold text-red-800 mb-3 flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  Рекомендация консультации
                </h3>
                <p className="text-red-800">
                  {result.aiInterpretation.specialistReason}
                </p>
              </div>
            )}
          </>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Link
            href="/tests"
            className="flex-1 py-3 px-4 bg-indigo-600 text-white text-center font-medium rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Пройти другой тест
          </Link>
          <Link
            href="/results"
            className="flex-1 py-3 px-4 bg-white text-gray-700 text-center font-medium rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
          >
            Все результаты
          </Link>
        </div>
      </div>
    </div>
  );
}
