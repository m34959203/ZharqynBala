'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { adminApi } from '@/lib/api';

interface TestReport {
  id: string;
  title: string;
  category: string;
  totalSessions: number;
  completedSessions: number;
  averageScore: number;
}

export default function AdminAnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [testsByCategory, setTestsByCategory] = useState<{ category: string; count: number; percentage: number }[]>([]);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalTests: 0,
    avgTestScore: 0,
    totalRevenue: 0,
  });

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);

        const dashboardStats = await adminApi.getDashboardStats();

        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/v1/admin/reports/tests`, {
          headers: {
            'Authorization': `Bearer ${document.cookie.split('accessToken=')[1]?.split(';')[0] || ''}`,
          },
        });
        const testsReport: TestReport[] = response.ok ? await response.json() : [];

        const categoryMap = new Map<string, number>();
        let totalSessions = 0;
        testsReport.forEach((test: TestReport) => {
          const count = test.completedSessions || 0;
          totalSessions += count;
          categoryMap.set(test.category, (categoryMap.get(test.category) || 0) + count);
        });

        const categories = Array.from(categoryMap.entries())
          .map(([category, count]) => ({
            category: getCategoryName(category),
            count,
            percentage: totalSessions > 0 ? Math.round((count / totalSessions) * 100) : 0,
          }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5);

        setTestsByCategory(categories);

        const avgScore = testsReport.length > 0
          ? Math.round(testsReport.reduce((sum, t) => sum + (t.averageScore || 0), 0) / testsReport.length)
          : 0;

        setStats({
          totalUsers: dashboardStats.totalUsers || 0,
          totalTests: dashboardStats.completedSessions || 0,
          avgTestScore: avgScore,
          totalRevenue: dashboardStats.totalRevenue || 0,
        });

      } catch (error) {
        console.error('Failed to fetch analytics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  const getCategoryName = (category: string) => {
    const names: Record<string, string> = {
      'MOTIVATION': 'Мотивация',
      'ANXIETY': 'Тревожность',
      'SELF_ESTEEM': 'Самооценка',
      'ATTENTION': 'Внимание',
      'EMOTIONAL': 'Эмоции',
      'SOCIAL': 'Социальное развитие',
      'CAREER': 'Профориентация',
      'COGNITIVE': 'Когнитивное развитие',
    };
    return names[category] || category;
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('ru-RU').format(value) + ' ₸';
  };

  const getCategoryColor = (index: number) => {
    const colors = [
      'bg-indigo-500',
      'bg-purple-500',
      'bg-pink-500',
      'bg-blue-500',
      'bg-teal-500',
    ];
    return colors[index % colors.length];
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <Link href="/dashboard" className="text-indigo-600 hover:text-indigo-500 text-sm font-medium flex items-center mb-4">
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Назад к дашборду
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">Аналитика</h1>
        <p className="mt-2 text-gray-600">Статистика платформы в реальном времени</p>
      </div>

      {/* Main Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Users */}
        <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
          </div>
          <p className="text-white/80 text-sm font-medium">Пользователей</p>
          <p className="text-3xl font-bold mt-1">{stats.totalUsers.toLocaleString()}</p>
        </div>

        {/* Tests */}
        <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <p className="text-white/80 text-sm font-medium">Тестов пройдено</p>
          <p className="text-3xl font-bold mt-1">{stats.totalTests.toLocaleString()}</p>
        </div>

        {/* Average Score */}
        <div className="bg-gradient-to-br from-amber-500 to-orange-500 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
          </div>
          <p className="text-white/80 text-sm font-medium">Средний балл</p>
          <p className="text-3xl font-bold mt-1">
            {stats.avgTestScore > 0 ? `${stats.avgTestScore}%` : '—'}
          </p>
        </div>

        {/* Revenue */}
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <p className="text-white/80 text-sm font-medium">Выручка</p>
          <p className="text-3xl font-bold mt-1">
            {stats.totalRevenue > 0 ? formatCurrency(stats.totalRevenue) : '—'}
          </p>
        </div>
      </div>

      {/* Bottom Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Tests by Category */}
        <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Тесты по категориям</h2>
            <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
              <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
              </svg>
            </div>
          </div>

          {testsByCategory.length > 0 ? (
            <div className="space-y-5">
              {testsByCategory.map((cat, i) => (
                <div key={i}>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="font-medium text-gray-700">{cat.category}</span>
                    <span className="text-gray-500">{cat.count} ({cat.percentage}%)</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-3">
                    <div
                      className={`h-3 rounded-full ${getCategoryColor(i)} transition-all duration-500`}
                      style={{ width: `${Math.max(cat.percentage, 3)}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <p className="text-gray-500">Данные появятся после прохождения тестов</p>
            </div>
          )}
        </div>

        {/* Detailed Statistics */}
        <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Детальная статистика</h2>
            <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
              <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-indigo-50 to-indigo-100/50 rounded-xl">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-indigo-500 rounded-lg flex items-center justify-center mr-3">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <span className="font-medium text-gray-700">Всего пользователей</span>
              </div>
              <span className="text-xl font-bold text-gray-900">{stats.totalUsers}</span>
            </div>

            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-emerald-50 to-emerald-100/50 rounded-xl">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-emerald-500 rounded-lg flex items-center justify-center mr-3">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <span className="font-medium text-gray-700">Пройдено тестов</span>
              </div>
              <span className="text-xl font-bold text-gray-900">{stats.totalTests}</span>
            </div>

            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-amber-50 to-amber-100/50 rounded-xl">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-amber-500 rounded-lg flex items-center justify-center mr-3">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
                <span className="font-medium text-gray-700">Средний балл</span>
              </div>
              <span className="text-xl font-bold text-gray-900">
                {stats.avgTestScore > 0 ? `${stats.avgTestScore}%` : '—'}
              </span>
            </div>

            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-purple-100/50 rounded-xl">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center mr-3">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <span className="font-medium text-gray-700">Общая выручка</span>
              </div>
              <span className="text-xl font-bold text-green-600">
                {stats.totalRevenue > 0 ? formatCurrency(stats.totalRevenue) : '—'}
              </span>
            </div>

            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-blue-100/50 rounded-xl">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center mr-3">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                  </svg>
                </div>
                <span className="font-medium text-gray-700">Тестов на пользователя</span>
              </div>
              <span className="text-xl font-bold text-gray-900">
                {stats.totalUsers > 0 ? (stats.totalTests / stats.totalUsers).toFixed(1) : '—'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
