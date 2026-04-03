'use client';

import { useState, useEffect } from 'react';
import { TestCard } from '@/components/tests/TestCard';
import { Test, TestCategory, categoryLabels } from '@/lib/types';
import api from '@/lib/api';

export default function TestsPage() {
  const [tests, setTests] = useState<Test[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<TestCategory | 'ALL'>('ALL');
  const [search, setSearch] = useState('');
  const [completedTests, setCompletedTests] = useState<Record<string, { score: number; maxScore: number; date: string }>>({});

  useEffect(() => {
    fetchTests();
  }, []);

  const fetchTests = async () => {
    try {
      setLoading(true);
      const response = await api.get('/tests');
      setTests(response.data);

      try {
        const resultsRes = await api.get('/results');
        const results = resultsRes.data || [];
        const completed: Record<string, { score: number; maxScore: number; date: string }> = {};
        for (const r of results) {
          const testId = r.testId || r.session?.testId;
          if (testId) {
            completed[testId] = {
              score: r.totalScore,
              maxScore: r.maxScore,
              date: r.createdAt,
            };
          }
        }
        setCompletedTests(completed);
      } catch {}
    } catch (err: any) {
      setError('Не удалось загрузить тесты');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredTests = tests.filter((test) => {
    const matchesCategory = selectedCategory === 'ALL' || test.category === selectedCategory;
    const matchesSearch = !search ||
      test.titleRu.toLowerCase().includes(search.toLowerCase()) ||
      test.descriptionRu?.toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const categories: (TestCategory | 'ALL')[] = [
    'ALL',
    'ANXIETY',
    'MOTIVATION',
    'SELF_ESTEEM',
    'ATTENTION',
    'EMOTIONS',
    'CAREER',
  ];

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
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-3xl font-bold text-gray-900">Каталог тестов</h1>
            <span className="text-sm text-gray-500">{filteredTests.length} из {tests.length} тестов</span>
          </div>
          <p className="mt-2 text-gray-600">
            Выберите тест для диагностики вашего ребёнка
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search */}
        <div className="relative mb-4">
          <input
            type="text"
            placeholder="Поиск по названию теста..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <svg className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>

        {/* Category filter */}
        <div className="mb-8 overflow-x-auto">
          <div className="flex space-x-2 pb-2">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                  selectedCategory === category
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                }`}
              >
                {category === 'ALL'
                  ? 'Все тесты'
                  : categoryLabels[category]?.ru || category}
              </button>
            ))}
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600">
            {error}
          </div>
        )}

        {/* Tests grid */}
        {filteredTests.length === 0 ? (
          <div className="text-center py-12">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              Тесты не найдены
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              В выбранной категории пока нет доступных тестов
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTests.map((test) => (
              <TestCard key={test.id} test={test} completedInfo={completedTests[test.id] || null} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
