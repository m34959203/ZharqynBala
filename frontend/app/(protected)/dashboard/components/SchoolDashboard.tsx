'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

interface ClassStats {
  id: string;
  name: string;
  studentsCount: number;
  testedCount: number;
  averageScore: number;
}

interface AtRiskStudent {
  id: string;
  name: string;
  className: string;
  concern: string;
  score: number;
}

interface SchoolDashboardProps {
  userName: string;
}

export default function SchoolDashboard({ userName }: SchoolDashboardProps) {
  const [classes, setClasses] = useState<ClassStats[]>([]);
  const [atRiskStudents, setAtRiskStudents] = useState<AtRiskStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalStudents: 0,
    testedStudents: 0,
    totalTests: 0,
    averageScore: 0,
  });

  useEffect(() => {
    // Simulate data loading
    setLoading(false);
    // Mock data
    setClasses([
      { id: '1', name: '1-А', studentsCount: 28, testedCount: 25, averageScore: 78 },
      { id: '2', name: '1-Б', studentsCount: 30, testedCount: 28, averageScore: 72 },
      { id: '3', name: '2-А', studentsCount: 26, testedCount: 24, averageScore: 81 },
      { id: '4', name: '2-Б', studentsCount: 27, testedCount: 22, averageScore: 69 },
      { id: '5', name: '3-А', studentsCount: 29, testedCount: 27, averageScore: 75 },
    ]);
    setAtRiskStudents([
      { id: '1', name: 'Иванов А.', className: '2-Б', concern: 'Тревожность', score: 35 },
      { id: '2', name: 'Петрова М.', className: '1-А', concern: 'Внимание', score: 42 },
      { id: '3', name: 'Сидоров К.', className: '3-А', concern: 'Эмоции', score: 38 },
    ]);
    setStats({
      totalStudents: 450,
      testedStudents: 320,
      totalTests: 1250,
      averageScore: 75,
    });
  }, []);

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getProgressWidth = (tested: number, total: number) => {
    return Math.round((tested / total) * 100);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Welcome Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Добро пожаловать!
        </h1>
        <p className="mt-2 text-gray-600">
          Панель управления школой • {userName}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl shadow-sm p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Всего учеников</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalStudents}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Протестировано</p>
              <p className="text-2xl font-bold text-gray-900">{stats.testedStudents}</p>
              <p className="text-xs text-green-600">
                {Math.round((stats.testedStudents / stats.totalStudents) * 100)}% охват
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Тестов пройдено</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalTests}</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Средний балл</p>
              <p className={`text-2xl font-bold ${getScoreColor(stats.averageScore)}`}>
                {stats.averageScore}%
              </p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Classes Table */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Статистика по классам</h2>
            <Link href="/classes" className="text-sm text-indigo-600 hover:text-indigo-500 font-medium">
              Все классы
            </Link>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Класс</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Учеников</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Охват</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Ср. балл</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-500"></th>
                  </tr>
                </thead>
                <tbody>
                  {classes.map((cls) => (
                    <tr key={cls.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <span className="font-medium text-gray-900">{cls.name}</span>
                      </td>
                      <td className="py-3 px-4 text-gray-600">{cls.studentsCount}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center">
                          <div className="w-24 bg-gray-200 rounded-full h-2 mr-2">
                            <div
                              className="bg-indigo-600 h-2 rounded-full"
                              style={{ width: `${getProgressWidth(cls.testedCount, cls.studentsCount)}%` }}
                            ></div>
                          </div>
                          <span className="text-sm text-gray-600">
                            {getProgressWidth(cls.testedCount, cls.studentsCount)}%
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`font-medium ${getScoreColor(cls.averageScore)}`}>
                          {cls.averageScore}%
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Link
                          href={`/classes/${cls.id}`}
                          className="text-indigo-600 hover:text-indigo-500 text-sm font-medium"
                        >
                          Подробнее
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* At Risk Students */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Требуют внимания</h2>
            <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded-full">
              {atRiskStudents.length}
            </span>
          </div>

          <div className="space-y-3">
            {atRiskStudents.map((student) => (
              <div key={student.id} className="p-3 bg-red-50 rounded-lg border border-red-100">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-gray-900">{student.name}</span>
                  <span className="text-sm text-red-600 font-medium">{student.score}%</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">{student.className}</span>
                  <span className="text-red-600">{student.concern}</span>
                </div>
              </div>
            ))}
          </div>

          <Link
            href="/students?filter=at-risk"
            className="mt-4 block text-center py-2 text-indigo-600 hover:text-indigo-500 text-sm font-medium"
          >
            Посмотреть всех
          </Link>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-4">
        <Link
          href="/testing/new"
          className="flex items-center p-4 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl text-white hover:from-indigo-600 hover:to-purple-700 transition-all"
        >
          <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </div>
          <div className="ml-4">
            <p className="font-semibold">Начать тестирование</p>
            <p className="text-sm text-white/80">Выбрать класс</p>
          </div>
        </Link>

        <Link
          href="/reports"
          className="flex items-center p-4 bg-gradient-to-r from-green-500 to-teal-600 rounded-xl text-white hover:from-green-600 hover:to-teal-700 transition-all"
        >
          <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div className="ml-4">
            <p className="font-semibold">Скачать отчёт</p>
            <p className="text-sm text-white/80">PDF / Excel</p>
          </div>
        </Link>

        <Link
          href="/students/import"
          className="flex items-center p-4 bg-gradient-to-r from-orange-500 to-pink-600 rounded-xl text-white hover:from-orange-600 hover:to-pink-700 transition-all"
        >
          <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
          </div>
          <div className="ml-4">
            <p className="font-semibold">Импорт учеников</p>
            <p className="text-sm text-white/80">Из Excel</p>
          </div>
        </Link>

        <Link
          href="/classes"
          className="flex items-center p-4 bg-gradient-to-r from-blue-500 to-cyan-600 rounded-xl text-white hover:from-blue-600 hover:to-cyan-700 transition-all"
        >
          <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <div className="ml-4">
            <p className="font-semibold">Управление классами</p>
            <p className="text-sm text-white/80">Добавить / изменить</p>
          </div>
        </Link>
      </div>
    </div>
  );
}
