'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import api from '@/lib/api';

interface RiskStudent {
  childId: string;
  childName: string;
  age: number;
  riskZone: 'RED' | 'YELLOW';
  testTitle: string;
  category: string;
  score: number;
  maxScore: number;
  percentage: number;
  date: string;
  parentEmail: string;
  recommendation: string;
}

const CATEGORIES: Record<string, string> = {
  ANXIETY: 'Тревожность',
  MOTIVATION: 'Мотивация',
  ATTENTION: 'Внимание',
  EMOTIONS: 'Эмоции',
  CAREER: 'Карьера',
  SELF_ESTEEM: 'Самооценка',
  SOCIAL: 'Социальные',
  COGNITIVE: 'Когнитивные',
};

const CATEGORY_COLORS: Record<string, string> = {
  ANXIETY: 'bg-purple-100 text-purple-800',
  MOTIVATION: 'bg-blue-100 text-blue-800',
  ATTENTION: 'bg-cyan-100 text-cyan-800',
  EMOTIONS: 'bg-pink-100 text-pink-800',
  CAREER: 'bg-indigo-100 text-indigo-800',
  SELF_ESTEEM: 'bg-amber-100 text-amber-800',
  SOCIAL: 'bg-teal-100 text-teal-800',
  COGNITIVE: 'bg-emerald-100 text-emerald-800',
};

export default function RiskStudentsPage() {
  const [students, setStudents] = useState<RiskStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterZone, setFilterZone] = useState<string>('ALL');
  const [filterCategory, setFilterCategory] = useState<string>('ALL');

  const fetchStudents = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, string> = {};
      if (filterZone !== 'ALL') params.riskZone = filterZone;
      if (filterCategory !== 'ALL') params.category = filterCategory;

      const res = await api.get('/analytics/risk-students', { params });
      setStudents(res.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Ошибка загрузки данных');
    } finally {
      setLoading(false);
    }
  }, [filterZone, filterCategory]);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  const redCount = students.filter((s) => s.riskZone === 'RED').length;
  const yellowCount = students.filter((s) => s.riskZone === 'YELLOW').length;
  const totalCount = students.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Зона риска (ГПВ)
        </h1>
        <p className="text-gray-500 mt-1">
          Группа Повышенного Внимания — ученики, требующие особого контроля по результатам тестирования
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-gray-500">Всего в зоне риска</p>
              <p className="text-2xl font-bold text-gray-900">{totalCount}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
              <div className="w-3 h-3 rounded-full bg-red-500" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Красная зона</p>
              <p className="text-2xl font-bold text-red-600">{redCount}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-yellow-100 flex items-center justify-center">
              <div className="w-3 h-3 rounded-full bg-yellow-500" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Жёлтая зона</p>
              <p className="text-2xl font-bold text-yellow-600">{yellowCount}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border p-4">
        <div className="flex flex-wrap gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Зона риска</label>
            <select
              value={filterZone}
              onChange={(e) => setFilterZone(e.target.value)}
              className="block w-44 rounded-lg border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 text-sm"
            >
              <option value="ALL">Все</option>
              <option value="RED">Красная</option>
              <option value="YELLOW">Жёлтая</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Категория</label>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="block w-44 rounded-lg border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 text-sm"
            >
              <option value="ALL">Все категории</option>
              {Object.entries(CATEGORIES).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-600" />
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <p className="text-red-600">{error}</p>
          <button onClick={fetchStudents} className="mt-3 text-sm text-red-700 underline">
            Попробовать снова
          </button>
        </div>
      ) : students.length === 0 ? (
        <div className="bg-white border rounded-xl p-12 text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900">Нет учеников в зоне риска</h3>
          <p className="text-gray-500 mt-1">Все результаты тестирования в пределах нормы</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ученик
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Зона
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Тест / Категория
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Балл
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Дата
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Действие
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {students.map((student, idx) => (
                  <tr
                    key={`${student.childId}-${idx}`}
                    className={student.riskZone === 'RED' ? 'bg-red-50/50' : ''}
                  >
                    {/* Name + age */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-purple-100 flex items-center justify-center text-sm font-medium text-purple-700">
                          {student.childName[0]}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{student.childName}</p>
                          <p className="text-xs text-gray-500">{student.age} лет</p>
                        </div>
                      </div>
                    </td>

                    {/* Risk badge */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                          student.riskZone === 'RED'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        <span
                          className={`w-2 h-2 rounded-full ${
                            student.riskZone === 'RED' ? 'bg-red-500' : 'bg-yellow-500'
                          }`}
                        />
                        {student.riskZone === 'RED' ? 'Красная' : 'Жёлтая'}
                      </span>
                    </td>

                    {/* Test + category */}
                    <td className="px-4 py-3">
                      <p className="text-sm text-gray-900 truncate max-w-[200px]">{student.testTitle}</p>
                      <span
                        className={`inline-block mt-1 px-2 py-0.5 rounded text-xs font-medium ${
                          CATEGORY_COLORS[student.category] || 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {CATEGORIES[student.category] || student.category}
                      </span>
                    </td>

                    {/* Score */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-900">{student.percentage}%</span>
                        <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              student.riskZone === 'RED' ? 'bg-red-500' : 'bg-yellow-500'
                            }`}
                            style={{ width: `${Math.min(student.percentage, 100)}%` }}
                          />
                        </div>
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {student.score} / {student.maxScore}
                      </p>
                    </td>

                    {/* Date */}
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                      {new Date(student.date).toLocaleDateString('ru-RU')}
                    </td>

                    {/* Action */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <Link
                        href={`/cases?childId=${student.childId}`}
                        className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-purple-700 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors"
                      >
                        Создать кейс
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
