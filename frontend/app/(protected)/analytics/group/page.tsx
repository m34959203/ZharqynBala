'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import api from '@/lib/api';

interface GroupAnalytics {
  totalStudents: number;
  testedStudents: number;
  participationRate: number;
  riskDistribution: { GREEN: number; YELLOW: number; RED: number };
  byCategory: {
    category: string;
    categoryName: string;
    avgScore: number;
    tested: number;
    redCount: number;
  }[];
  byClass: {
    classId: string;
    grade: number;
    letter: string;
    students: number;
    tested: number;
    avgScore: number;
    redCount: number;
  }[];
}

interface SchoolClass {
  id: string;
  grade: number;
  letter: string;
  academicYear: string;
  _count?: { students: number };
}

const QUARTERS = [
  { value: '', label: 'Все четверти' },
  { value: '1', label: '1 четверть' },
  { value: '2', label: '2 четверть' },
  { value: '3', label: '3 четверть' },
  { value: '4', label: '4 четверть' },
];

const CATEGORIES = [
  { value: '', label: 'Все категории' },
  { value: 'ANXIETY', label: 'Тревожность' },
  { value: 'MOTIVATION', label: 'Мотивация' },
  { value: 'ATTENTION', label: 'Внимание' },
  { value: 'EMOTIONS', label: 'Эмоции' },
  { value: 'CAREER', label: 'Профориентация' },
  { value: 'SELF_ESTEEM', label: 'Самооценка' },
  { value: 'SOCIAL', label: 'Социальные навыки' },
  { value: 'COGNITIVE', label: 'Когнитивные навыки' },
];

export default function GroupAnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<GroupAnalytics | null>(null);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [schoolId, setSchoolId] = useState<string | null>(null);

  // Filters
  const [quarter, setQuarter] = useState('');
  const [category, setCategory] = useState('');
  const [classId, setClassId] = useState('');
  const [gradeFilter, setGradeFilter] = useState('');

  // Get unique grades from classes
  const uniqueGrades = [...new Set(classes.map(c => c.grade))].sort((a, b) => a - b);

  const fetchSchool = useCallback(async () => {
    try {
      const res = await api.get('/schools/me');
      const school = res.data;
      setSchoolId(school.id);
      return school.id;
    } catch {
      return null;
    }
  }, []);

  const fetchClasses = useCallback(async (sid: string) => {
    try {
      const res = await api.get(`/schools/${sid}/classes`);
      setClasses(res.data || []);
    } catch {
      setClasses([]);
    }
  }, []);

  const fetchAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      const params: Record<string, string> = {};
      if (quarter) params.quarter = quarter;
      if (category) params.category = category;
      if (classId) params.classId = classId;
      if (gradeFilter) params.grade = gradeFilter;

      const res = await api.get('/analytics/group', { params });
      setData(res.data);
    } catch (err) {
      console.error('Failed to fetch group analytics:', err);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [quarter, category, classId, gradeFilter]);

  useEffect(() => {
    const init = async () => {
      const sid = await fetchSchool();
      if (sid) {
        await fetchClasses(sid);
      }
      await fetchAnalytics();
    };
    init();
  }, []);

  useEffect(() => {
    fetchAnalytics();
  }, [quarter, category, classId, gradeFilter]);

  const totalRisk = data
    ? data.riskDistribution.GREEN + data.riskDistribution.YELLOW + data.riskDistribution.RED
    : 0;

  const getRiskBarWidth = (count: number) => {
    if (totalRisk === 0) return 0;
    return Math.round((count / totalRisk) * 100);
  };

  const getScoreColor = (score: number) => {
    if (score >= 70) return 'text-green-600';
    if (score >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBarColor = (score: number) => {
    if (score >= 70) return 'bg-green-500';
    if (score >= 40) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  if (loading && !data) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Групповая аналитика (ПЭПУ)
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Сводная аналитика по результатам диагностики учащихся
            </p>
          </div>
          <Link
            href="/reports"
            className="px-4 py-2 text-sm font-medium text-purple-600 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors"
          >
            Экспорт отчётов
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Четверть</label>
            <select
              value={quarter}
              onChange={(e) => setQuarter(e.target.value)}
              className="w-full p-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            >
              {QUARTERS.map((q) => (
                <option key={q.value} value={q.value}>{q.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Категория</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full p-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            >
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Параллель</label>
            <select
              value={gradeFilter}
              onChange={(e) => {
                setGradeFilter(e.target.value);
                setClassId('');
              }}
              className="w-full p-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            >
              <option value="">Все параллели</option>
              {uniqueGrades.map((g) => (
                <option key={g} value={String(g)}>{g} класс</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Класс</label>
            <select
              value={classId}
              onChange={(e) => setClassId(e.target.value)}
              className="w-full p-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            >
              <option value="">Все классы</option>
              {classes
                .filter((c) => !gradeFilter || c.grade === parseInt(gradeFilter))
                .map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.grade}-{c.letter}
                  </option>
                ))}
            </select>
          </div>
        </div>
      </div>

      {!data ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <p className="text-gray-500 font-medium">Нет данных для отображения</p>
          <p className="text-sm text-gray-400 mt-1">Данные появятся после проведения диагностик</p>
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
            {/* Total Students */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Всего учащихся</p>
                  <p className="text-xl font-bold text-gray-900">{data.totalStudents}</p>
                </div>
              </div>
            </div>

            {/* Tested */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Протестировано</p>
                  <p className="text-xl font-bold text-gray-900">{data.testedStudents}</p>
                </div>
              </div>
            </div>

            {/* Participation Rate */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Охват</p>
                  <p className="text-xl font-bold text-gray-900">{data.participationRate}%</p>
                </div>
              </div>
            </div>

            {/* Green Zone */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Зеленая зона</p>
                  <p className="text-xl font-bold text-green-600">{data.riskDistribution.GREEN}</p>
                </div>
              </div>
            </div>

            {/* Red Zone */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <div className="w-4 h-4 bg-red-500 rounded-full"></div>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Красная зона</p>
                  <p className="text-xl font-bold text-red-600">
                    {data.riskDistribution.RED}
                    {data.riskDistribution.YELLOW > 0 && (
                      <span className="text-sm font-normal text-yellow-600 ml-1">
                        +{data.riskDistribution.YELLOW}
                      </span>
                    )}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Risk Distribution Bar */}
          {totalRisk > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 mb-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Распределение по зонам риска</h3>
              <div className="flex rounded-lg overflow-hidden h-8">
                {data.riskDistribution.GREEN > 0 && (
                  <div
                    className="bg-green-500 flex items-center justify-center text-white text-xs font-medium transition-all"
                    style={{ width: `${getRiskBarWidth(data.riskDistribution.GREEN)}%` }}
                  >
                    {getRiskBarWidth(data.riskDistribution.GREEN) > 10 && `${data.riskDistribution.GREEN}`}
                  </div>
                )}
                {data.riskDistribution.YELLOW > 0 && (
                  <div
                    className="bg-yellow-400 flex items-center justify-center text-white text-xs font-medium transition-all"
                    style={{ width: `${getRiskBarWidth(data.riskDistribution.YELLOW)}%` }}
                  >
                    {getRiskBarWidth(data.riskDistribution.YELLOW) > 10 && `${data.riskDistribution.YELLOW}`}
                  </div>
                )}
                {data.riskDistribution.RED > 0 && (
                  <div
                    className="bg-red-500 flex items-center justify-center text-white text-xs font-medium transition-all"
                    style={{ width: `${getRiskBarWidth(data.riskDistribution.RED)}%` }}
                  >
                    {getRiskBarWidth(data.riskDistribution.RED) > 10 && `${data.riskDistribution.RED}`}
                  </div>
                )}
              </div>
              <div className="flex gap-6 mt-3">
                <div className="flex items-center gap-2 text-xs text-gray-600">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  Норма ({data.riskDistribution.GREEN})
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-600">
                  <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                  Внимание ({data.riskDistribution.YELLOW})
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-600">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  Риск ({data.riskDistribution.RED})
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* By Class Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <h3 className="text-sm font-semibold text-gray-700 mb-4">Результаты по классам</h3>
              {data.byClass.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-gray-500 border-b">
                        <th className="pb-2 font-medium">Класс</th>
                        <th className="pb-2 font-medium text-center">Учеников</th>
                        <th className="pb-2 font-medium text-center">Тест.</th>
                        <th className="pb-2 font-medium text-center">Ср. балл</th>
                        <th className="pb-2 font-medium text-center">Риск</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {data.byClass.map((cls) => (
                        <tr key={cls.classId} className="hover:bg-gray-50">
                          <td className="py-2.5 font-medium text-gray-900">
                            {cls.grade}-{cls.letter}
                          </td>
                          <td className="py-2.5 text-center text-gray-600">{cls.students}</td>
                          <td className="py-2.5 text-center">
                            <span className={cls.tested === cls.students ? 'text-green-600' : 'text-gray-600'}>
                              {cls.tested}
                            </span>
                          </td>
                          <td className="py-2.5 text-center">
                            <span className={`font-semibold ${getScoreColor(cls.avgScore)}`}>
                              {cls.avgScore > 0 ? `${cls.avgScore}%` : '--'}
                            </span>
                          </td>
                          <td className="py-2.5 text-center">
                            {cls.redCount > 0 ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
                                {cls.redCount}
                              </span>
                            ) : (
                              <span className="text-gray-400">--</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-sm text-gray-400">Нет данных по классам</p>
                </div>
              )}
            </div>

            {/* By Category */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <h3 className="text-sm font-semibold text-gray-700 mb-4">Результаты по категориям</h3>
              {data.byCategory.length > 0 ? (
                <div className="space-y-4">
                  {data.byCategory.map((cat) => (
                    <div key={cat.category}>
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-700">{cat.categoryName}</span>
                          {cat.redCount > 0 && (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-red-100 text-red-700">
                              {cat.redCount} риск
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <span>{cat.tested} тест.</span>
                          <span className={`font-semibold text-sm ${getScoreColor(cat.avgScore)}`}>
                            {cat.avgScore}%
                          </span>
                        </div>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2.5">
                        <div
                          className={`h-2.5 rounded-full transition-all ${getScoreBarColor(cat.avgScore)}`}
                          style={{ width: `${Math.max(cat.avgScore, 3)}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-sm text-gray-400">Нет данных по категориям</p>
                </div>
              )}
            </div>
          </div>

          {/* Class Risk Distribution - Bar Chart Visualization */}
          {data.byClass.length > 1 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 mb-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-4">Средний балл по классам</h3>
              <div className="flex items-end gap-3 h-48">
                {data.byClass.map((cls) => {
                  const maxScore = Math.max(...data.byClass.map(c => c.avgScore), 1);
                  const heightPct = cls.avgScore > 0 ? Math.max((cls.avgScore / 100) * 100, 5) : 5;
                  return (
                    <div key={cls.classId} className="flex-1 flex flex-col items-center gap-1">
                      <span className={`text-xs font-semibold ${getScoreColor(cls.avgScore)}`}>
                        {cls.avgScore > 0 ? `${cls.avgScore}%` : '--'}
                      </span>
                      <div className="w-full relative" style={{ height: '140px' }}>
                        <div
                          className={`absolute bottom-0 w-full rounded-t-md transition-all ${getScoreBarColor(cls.avgScore)}`}
                          style={{ height: `${heightPct}%` }}
                        ></div>
                      </div>
                      <span className="text-xs text-gray-600 font-medium">
                        {cls.grade}-{cls.letter}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}

      {loading && data && (
        <div className="fixed top-20 right-6 bg-white border border-gray-200 rounded-lg shadow-lg px-4 py-2 flex items-center gap-2 z-50">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600"></div>
          <span className="text-sm text-gray-600">Обновление...</span>
        </div>
      )}
    </div>
  );
}
