'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Result, categoryLabels, categoryColors, TestCategory } from '@/lib/types';
import api from '@/lib/api';
import { RiskBadge, ExportButton } from '@/components/ui';

export default function ResultsPage() {
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('');
  const [sortBy, setSortBy] = useState<'date' | 'score'>('date');

  useEffect(() => {
    fetchResults();
  }, []);

  const fetchResults = async () => {
    try {
      const response = await api.get('/results');
      setResults(response.data.results);
    } catch (err: any) {
      setError('Не удалось загрузить результаты');
    } finally {
      setLoading(false);
    }
  };

  // Mini-dashboard stats
  const stats = useMemo(() => {
    if (!results.length) return null;
    const totalTests = results.length;
    const avgScore = Math.round(
      results.reduce((sum, r) => {
        const pct = r.maxScore > 0 ? (r.totalScore / r.maxScore) * 100 : 0;
        return sum + pct;
      }, 0) / totalTests
    );
    const greenCount = results.filter((r) => r.riskZone === 'GREEN').length;
    const yellowCount = results.filter((r) => r.riskZone === 'YELLOW').length;
    const redCount = results.filter((r) => r.riskZone === 'RED').length;
    return { totalTests, avgScore, greenCount, yellowCount, redCount };
  }, [results]);

  // Unique categories from results
  const categories = useMemo(
    () => [...new Set(results.map((r) => r.testCategory).filter(Boolean))] as string[],
    [results]
  );

  // Filtered and sorted results
  const filteredResults = useMemo(
    () =>
      results
        .filter((r) => !filterCategory || r.testCategory === filterCategory)
        .sort((a, b) => {
          if (sortBy === 'date')
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
          const pctA = a.maxScore > 0 ? a.totalScore / a.maxScore : 0;
          const pctB = b.maxScore > 0 ? b.totalScore / b.maxScore : 0;
          return pctB - pctA;
        }),
    [results, filterCategory, sortBy]
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">История результатов</h1>
              <p className="mt-2 text-gray-600">
                Просмотрите результаты пройденных тестов
              </p>
            </div>
            {results.length > 0 && (
              <ExportButton url="/export/results" filename="results.xlsx" label="Скачать Excel" />
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600">
            {error}
          </div>
        )}

        {/* Mini-Dashboard */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-xl p-4 shadow-sm border">
              <p className="text-sm text-gray-500">Тестов пройдено</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalTests}</p>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm border">
              <p className="text-sm text-gray-500">Средний балл</p>
              <p className="text-2xl font-bold text-blue-600">{stats.avgScore}%</p>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm border">
              <p className="text-sm text-gray-500">Норма</p>
              <p className="text-2xl font-bold text-green-600">{stats.greenCount}</p>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm border">
              <p className="text-sm text-gray-500">Требует внимания</p>
              <p className="text-2xl font-bold text-amber-600">
                {stats.yellowCount + stats.redCount}
              </p>
            </div>
          </div>
        )}

        {/* Category Filter Tabs + Sort */}
        {results.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <button
              onClick={() => setFilterCategory('')}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                !filterCategory
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Все ({results.length})
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setFilterCategory(cat)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  filterCategory === cat
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {categoryLabels[cat as TestCategory]?.ru || cat}
              </button>
            ))}

            <div className="ml-auto">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'date' | 'score')}
                className="text-sm border rounded-lg px-3 py-1.5"
              >
                <option value="date">По дате</option>
                <option value="score">По баллу</option>
              </select>
            </div>
          </div>
        )}

        {/* Results List or Empty State */}
        {filteredResults.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-1">Нет результатов</h3>
            <p className="text-gray-500 mb-4">
              {filterCategory
                ? 'Нет результатов в этой категории'
                : 'Пройдите первый тест, чтобы увидеть результаты'}
            </p>
            <Link
              href="/tests"
              className="text-blue-600 font-medium hover:underline"
            >
              Перейти к тестам &rarr;
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredResults.map((result) => {
              const percentage =
                result.maxScore > 0
                  ? Math.round((result.totalScore / result.maxScore) * 100)
                  : 0;

              return (
                <div
                  key={result.id}
                  className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow"
                >
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                    <div className="flex-1">
                      <div className="flex items-center flex-wrap gap-2 mb-2">
                        {result.testCategory && (
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                              categoryColors[result.testCategory as TestCategory] ||
                              'bg-gray-100 text-gray-600'
                            }`}
                          >
                            {categoryLabels[result.testCategory as TestCategory]?.ru ||
                              result.testCategory}
                          </span>
                        )}
                        {result.riskZone && <RiskBadge zone={result.riskZone} size="sm" />}
                        <span className="text-sm text-gray-500">
                          {new Date(result.createdAt).toLocaleDateString('ru-RU', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                          })}
                        </span>
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">
                        {result.testTitle || 'Тест'}
                      </h3>
                      {result.childName && (
                        <p className="text-sm text-gray-600">
                          Ребёнок: {result.childName}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center mt-4 md:mt-0 space-x-4">
                      {/* Consistent score display */}
                      <div className="flex items-center gap-3">
                        <span
                          className={`text-2xl font-bold ${
                            percentage >= 70
                              ? 'text-green-600'
                              : percentage >= 40
                              ? 'text-yellow-600'
                              : 'text-red-600'
                          }`}
                        >
                          {percentage}%
                        </span>
                        <span className="text-sm text-gray-400">
                          ({result.totalScore}/{result.maxScore})
                        </span>
                      </div>
                      <Link
                        href={`/results/${result.id}`}
                        className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
                      >
                        Подробнее
                        <svg
                          className="w-4 h-4 ml-1"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 5l7 7-7 7"
                          />
                        </svg>
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
