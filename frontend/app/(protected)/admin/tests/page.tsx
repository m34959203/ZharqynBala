'use client';

import { useState } from 'react';
import Link from 'next/link';

interface Test {
  id: string;
  title: string;
  titleKz: string;
  description: string;
  category: string;
  ageRange: string;
  duration: number;
  questionsCount: number;
  status: 'ACTIVE' | 'DRAFT' | 'ARCHIVED';
  completionsCount: number;
  avgScore: number;
  createdAt: string;
}

const mockTests: Test[] = [
  {
    id: '1',
    title: 'Тест на тревожность (Спилбергер)',
    titleKz: 'Алаңдаушылық тесті (Спилбергер)',
    description: 'Диагностика уровня ситуативной и личностной тревожности',
    category: 'Эмоциональное здоровье',
    ageRange: '10-17 лет',
    duration: 15,
    questionsCount: 40,
    status: 'ACTIVE',
    completionsCount: 2450,
    avgScore: 72,
    createdAt: '2025-01-15'
  },
  {
    id: '2',
    title: 'Школьная мотивация (Лусканова)',
    titleKz: 'Мектеп мотивациясы (Лусканова)',
    description: 'Оценка уровня школьной мотивации учащихся',
    category: 'Учебная деятельность',
    ageRange: '7-14 лет',
    duration: 10,
    questionsCount: 10,
    status: 'ACTIVE',
    completionsCount: 3120,
    avgScore: 68,
    createdAt: '2025-01-10'
  },
  {
    id: '3',
    title: 'Самооценка (Дембо-Рубинштейн)',
    titleKz: 'Өзін-өзі бағалау (Дембо-Рубинштейн)',
    description: 'Диагностика уровня самооценки личности',
    category: 'Личностное развитие',
    ageRange: '12-17 лет',
    duration: 12,
    questionsCount: 7,
    status: 'ACTIVE',
    completionsCount: 1890,
    avgScore: 75,
    createdAt: '2025-01-05'
  },
  {
    id: '4',
    title: 'Эмоциональный интеллект',
    titleKz: 'Эмоционалды интеллект',
    description: 'Оценка способности понимать и управлять эмоциями',
    category: 'Эмоциональное здоровье',
    ageRange: '10-17 лет',
    duration: 20,
    questionsCount: 30,
    status: 'ACTIVE',
    completionsCount: 980,
    avgScore: 70,
    createdAt: '2025-02-01'
  },
  {
    id: '5',
    title: 'Агрессивность (Басса-Дарки)',
    titleKz: 'Агрессивтілік (Басса-Дарки)',
    description: 'Диагностика агрессивных и враждебных реакций',
    category: 'Поведение',
    ageRange: '14-18 лет',
    duration: 15,
    questionsCount: 75,
    status: 'DRAFT',
    completionsCount: 0,
    avgScore: 0,
    createdAt: '2025-12-20'
  },
  {
    id: '6',
    title: 'Внимание и концентрация',
    titleKz: 'Зейін және шоғырлану',
    description: 'Оценка устойчивости и переключаемости внимания',
    category: 'Когнитивное развитие',
    ageRange: '8-15 лет',
    duration: 25,
    questionsCount: 50,
    status: 'ACTIVE',
    completionsCount: 1560,
    avgScore: 65,
    createdAt: '2025-01-20'
  },
];

export default function AdminTestsPage() {
  const [tests] = useState<Test[]>(mockTests);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const categories = [...new Set(tests.map(t => t.category))];

  const filteredTests = tests.filter(test => {
    const matchesSearch = test.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         test.titleKz.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || test.category === categoryFilter;
    const matchesStatus = statusFilter === 'all' || test.status === statusFilter;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-green-100 text-green-800';
      case 'DRAFT': return 'bg-yellow-100 text-yellow-800';
      case 'ARCHIVED': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'Активен';
      case 'DRAFT': return 'Черновик';
      case 'ARCHIVED': return 'Архив';
      default: return status;
    }
  };

  const stats = {
    total: tests.length,
    active: tests.filter(t => t.status === 'ACTIVE').length,
    totalCompletions: tests.reduce((sum, t) => sum + t.completionsCount, 0),
    avgDuration: Math.round(tests.reduce((sum, t) => sum + t.duration, 0) / tests.length),
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <Link href="/dashboard" className="text-indigo-600 hover:text-indigo-500 text-sm font-medium flex items-center mb-4">
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Назад к дашборду
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Каталог тестов</h1>
            <p className="mt-2 text-gray-600">Управление психологическими тестами</p>
          </div>
          <button className="px-6 py-3 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 flex items-center">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Добавить тест
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl shadow-sm p-5">
          <p className="text-sm text-gray-500">Всего тестов</p>
          <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-5">
          <p className="text-sm text-gray-500">Активных</p>
          <p className="text-2xl font-bold text-green-600">{stats.active}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-5">
          <p className="text-sm text-gray-500">Прохождений</p>
          <p className="text-2xl font-bold text-indigo-600">{stats.totalCompletions.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-5">
          <p className="text-sm text-gray-500">Ср. длительность</p>
          <p className="text-2xl font-bold text-gray-900">{stats.avgDuration} мин</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Поиск по названию..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">Все категории</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">Все статусы</option>
            <option value="ACTIVE">Активные</option>
            <option value="DRAFT">Черновики</option>
            <option value="ARCHIVED">Архив</option>
          </select>
        </div>
      </div>

      {/* Tests Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTests.map((test) => (
          <div key={test.id} className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow">
            <div className="p-6">
              <div className="flex items-start justify-between mb-3">
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(test.status)}`}>
                  {getStatusLabel(test.status)}
                </span>
                <button className="text-gray-400 hover:text-gray-600">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                  </svg>
                </button>
              </div>

              <h3 className="font-semibold text-gray-900 mb-1">{test.title}</h3>
              <p className="text-sm text-gray-500 mb-3">{test.description}</p>

              <div className="flex flex-wrap gap-2 mb-4">
                <span className="px-2 py-1 bg-indigo-50 text-indigo-700 text-xs rounded-full">{test.category}</span>
                <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">{test.ageRange}</span>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center border-t pt-4">
                <div>
                  <p className="text-lg font-bold text-gray-900">{test.questionsCount}</p>
                  <p className="text-xs text-gray-500">вопросов</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-gray-900">{test.duration}</p>
                  <p className="text-xs text-gray-500">минут</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-indigo-600">{test.completionsCount}</p>
                  <p className="text-xs text-gray-500">прошли</p>
                </div>
              </div>
            </div>

            <div className="px-6 py-3 bg-gray-50 flex justify-between items-center">
              <span className="text-xs text-gray-500">
                Ср. балл: {test.avgScore > 0 ? `${test.avgScore}%` : '—'}
              </span>
              <button className="text-indigo-600 hover:text-indigo-500 text-sm font-medium">
                Редактировать
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
