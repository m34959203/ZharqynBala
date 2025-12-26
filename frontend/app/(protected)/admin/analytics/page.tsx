'use client';

import { useState } from 'react';
import Link from 'next/link';

interface ChartData {
  label: string;
  value: number;
}

const monthlyUsers: ChartData[] = [
  { label: 'Янв', value: 850 },
  { label: 'Фев', value: 1120 },
  { label: 'Мар', value: 1340 },
  { label: 'Апр', value: 1580 },
  { label: 'Май', value: 1420 },
  { label: 'Июн', value: 980 },
  { label: 'Июл', value: 750 },
  { label: 'Авг', value: 890 },
  { label: 'Сен', value: 2100 },
  { label: 'Окт', value: 2450 },
  { label: 'Ноя', value: 2680 },
  { label: 'Дек', value: 2890 },
];

const monthlyRevenue: ChartData[] = [
  { label: 'Янв', value: 450000 },
  { label: 'Фев', value: 580000 },
  { label: 'Мар', value: 720000 },
  { label: 'Апр', value: 890000 },
  { label: 'Май', value: 780000 },
  { label: 'Июн', value: 520000 },
  { label: 'Июл', value: 380000 },
  { label: 'Авг', value: 450000 },
  { label: 'Сен', value: 1200000 },
  { label: 'Окт', value: 1450000 },
  { label: 'Ноя', value: 1680000 },
  { label: 'Дек', value: 1920000 },
];

const testsByCategory = [
  { category: 'Эмоциональное здоровье', count: 4520, percentage: 35 },
  { category: 'Учебная деятельность', count: 3890, percentage: 30 },
  { category: 'Личностное развитие', count: 2340, percentage: 18 },
  { category: 'Когнитивное развитие', count: 1560, percentage: 12 },
  { category: 'Социальное развитие', count: 650, percentage: 5 },
];

const topRegions = [
  { name: 'Алматы', users: 4520, tests: 12500 },
  { name: 'Нур-Султан', users: 2890, tests: 8900 },
  { name: 'Шымкент', users: 1450, tests: 4200 },
  { name: 'Караганда', users: 980, tests: 2800 },
  { name: 'Актобе', users: 650, tests: 1900 },
];

export default function AdminAnalyticsPage() {
  const [period, setPeriod] = useState<'week' | 'month' | 'year'>('year');

  const maxUsers = Math.max(...monthlyUsers.map(d => d.value));
  const maxRevenue = Math.max(...monthlyRevenue.map(d => d.value));

  const kpis = {
    totalUsers: 12450,
    activeUsers: 3250,
    totalTests: 28960,
    avgTestScore: 72,
    conversionRate: 12.5,
    churnRate: 4.2,
    nps: 68,
    cac: 2500,
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
            <h1 className="text-3xl font-bold text-gray-900">Аналитика</h1>
            <p className="mt-2 text-gray-600">Статистика и метрики платформы</p>
          </div>
          <div className="flex items-center space-x-2">
            {(['week', 'month', 'year'] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-4 py-2 rounded-lg text-sm font-medium ${
                  period === p ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {p === 'week' ? 'Неделя' : p === 'month' ? 'Месяц' : 'Год'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl shadow-sm p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Всего пользователей</p>
              <p className="text-2xl font-bold text-gray-900">{kpis.totalUsers.toLocaleString()}</p>
            </div>
            <div className="text-green-600 text-sm font-medium">+15%</div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Активных (MAU)</p>
              <p className="text-2xl font-bold text-gray-900">{kpis.activeUsers.toLocaleString()}</p>
            </div>
            <div className="text-green-600 text-sm font-medium">+8%</div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Тестов пройдено</p>
              <p className="text-2xl font-bold text-gray-900">{kpis.totalTests.toLocaleString()}</p>
            </div>
            <div className="text-green-600 text-sm font-medium">+22%</div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Ср. балл</p>
              <p className="text-2xl font-bold text-gray-900">{kpis.avgTestScore}%</p>
            </div>
            <div className="text-gray-500 text-sm font-medium">±0</div>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Users Chart */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Новые пользователи</h2>
          <div className="flex items-end justify-between h-48 gap-2">
            {monthlyUsers.map((data, i) => (
              <div key={i} className="flex flex-col items-center flex-1">
                <div
                  className="w-full bg-indigo-500 rounded-t-sm transition-all hover:bg-indigo-600"
                  style={{ height: `${(data.value / maxUsers) * 100}%` }}
                ></div>
                <span className="text-xs text-gray-500 mt-2">{data.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Revenue Chart */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Выручка</h2>
          <div className="flex items-end justify-between h-48 gap-2">
            {monthlyRevenue.map((data, i) => (
              <div key={i} className="flex flex-col items-center flex-1">
                <div
                  className="w-full bg-green-500 rounded-t-sm transition-all hover:bg-green-600"
                  style={{ height: `${(data.value / maxRevenue) * 100}%` }}
                ></div>
                <span className="text-xs text-gray-500 mt-2">{data.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Additional Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl p-5 text-white">
          <p className="text-white/80 text-sm">Conversion Rate</p>
          <p className="text-3xl font-bold">{kpis.conversionRate}%</p>
          <p className="text-white/60 text-xs mt-1">Регистрация → Оплата</p>
        </div>
        <div className="bg-gradient-to-r from-red-500 to-pink-600 rounded-xl p-5 text-white">
          <p className="text-white/80 text-sm">Churn Rate</p>
          <p className="text-3xl font-bold">{kpis.churnRate}%</p>
          <p className="text-white/60 text-xs mt-1">За последний месяц</p>
        </div>
        <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl p-5 text-white">
          <p className="text-white/80 text-sm">NPS Score</p>
          <p className="text-3xl font-bold">{kpis.nps}</p>
          <p className="text-white/60 text-xs mt-1">Индекс лояльности</p>
        </div>
        <div className="bg-gradient-to-r from-purple-500 to-violet-600 rounded-xl p-5 text-white">
          <p className="text-white/80 text-sm">CAC</p>
          <p className="text-3xl font-bold">{kpis.cac.toLocaleString()} ₸</p>
          <p className="text-white/60 text-xs mt-1">Стоимость привлечения</p>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Tests by Category */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Тесты по категориям</h2>
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
        </div>

        {/* Top Regions */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Топ регионов</h2>
          <div className="space-y-4">
            {topRegions.map((region, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center">
                  <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-sm font-bold mr-3">
                    {i + 1}
                  </span>
                  <span className="font-medium text-gray-900">{region.name}</span>
                </div>
                <div className="text-right">
                  <p className="font-bold text-gray-900">{region.users.toLocaleString()}</p>
                  <p className="text-xs text-gray-500">{region.tests.toLocaleString()} тестов</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
