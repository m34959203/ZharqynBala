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

        // Fetch dashboard stats
        const dashboardStats = await adminApi.getDashboardStats();

        // Fetch tests report for category breakdown
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/v1/admin/reports/tests`, {
          headers: {
            'Authorization': `Bearer ${document.cookie.split('accessToken=')[1]?.split(';')[0] || ''}`,
          },
        });
        const testsReport: TestReport[] = response.ok ? await response.json() : [];

        // Calculate category breakdown
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

        // Calculate average test score
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
      <div className="mb-8">
        <Link href="/dashboard" className="text-indigo-600 hover:text-indigo-500 text-sm font-medium flex items-center mb-4">
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Назад к дашборду
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Аналитика</h1>
          <p className="mt-2 text-gray-600">Статистика платформы</p>
        </div>
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl shadow-sm p-5">
          <p className="text-sm text-gray-500">Всего пользователей</p>
          <p className="text-2xl font-bold text-gray-900">{stats.totalUsers.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-5">
          <p className="text-sm text-gray-500">Тестов пройдено</p>
          <p className="text-2xl font-bold text-gray-900">{stats.totalTests.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-5">
          <p className="text-sm text-gray-500">Средний балл</p>
          <p className="text-2xl font-bold text-gray-900">
            {stats.avgTestScore > 0 ? `${stats.avgTestScore}%` : '—'}
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-5">
          <p className="text-sm text-gray-500">Общая выручка</p>
          <p className="text-2xl font-bold text-gray-900">
            {stats.totalRevenue > 0 ? formatCurrency(stats.totalRevenue) : '—'}
          </p>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Tests by Category */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Тесты по категориям</h2>
          {testsByCategory.length > 0 ? (
            <div className="space-y-4">
              {testsByCategory.map((cat, i) => (
                <div key={i}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-700">{cat.category}</span>
                    <span className="text-gray-500">{cat.count.toLocaleString()} ({cat.percentage}%)</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="h-2 rounded-full bg-indigo-500"
                      style={{ width: `${cat.percentage}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">Нет данных о тестах</p>
          )}
        </div>

        {/* General Statistics */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Общая статистика</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="font-medium text-gray-900">Всего пользователей</span>
              <span className="font-bold text-gray-900">{stats.totalUsers.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="font-medium text-gray-900">Пройдено тестов</span>
              <span className="font-bold text-gray-900">{stats.totalTests.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="font-medium text-gray-900">Средний балл</span>
              <span className="font-bold text-gray-900">
                {stats.avgTestScore > 0 ? `${stats.avgTestScore}%` : '—'}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="font-medium text-gray-900">Выручка</span>
              <span className="font-bold text-green-600">
                {stats.totalRevenue > 0 ? formatCurrency(stats.totalRevenue) : '—'}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="font-medium text-gray-900">Тестов на пользователя</span>
              <span className="font-bold text-gray-900">
                {stats.totalUsers > 0 ? (stats.totalTests / stats.totalUsers).toFixed(1) : '—'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
