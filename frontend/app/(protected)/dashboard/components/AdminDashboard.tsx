'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

interface RecentUser {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
}

interface RecentPayment {
  id: string;
  userName: string;
  amount: number;
  status: string;
  createdAt: string;
}

interface AdminDashboardProps {
  userName: string;
}

export default function AdminDashboard({ userName }: AdminDashboardProps) {
  const [recentUsers, setRecentUsers] = useState<RecentUser[]>([]);
  const [recentPayments, setRecentPayments] = useState<RecentPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    revenue: 0,
    testsCompleted: 0,
    growthUsers: 0,
    growthRevenue: 0,
  });

  useEffect(() => {
    // Simulate data loading
    setLoading(false);
    // Mock data
    setRecentUsers([
      { id: '1', name: 'Асем Нурпеисова', email: 'asem@mail.kz', role: 'PARENT', createdAt: '2025-12-25T10:30:00' },
      { id: '2', name: 'Марат Сагынбаев', email: 'marat@mail.kz', role: 'PARENT', createdAt: '2025-12-25T09:15:00' },
      { id: '3', name: 'СШ №45', email: 'school45@edu.kz', role: 'SCHOOL', createdAt: '2025-12-24T16:45:00' },
      { id: '4', name: 'Др. Айгуль К.', email: 'aigul@psych.kz', role: 'PSYCHOLOGIST', createdAt: '2025-12-24T14:20:00' },
    ]);
    setRecentPayments([
      { id: '1', userName: 'Асем Н.', amount: 5000, status: 'COMPLETED', createdAt: '2025-12-25T11:00:00' },
      { id: '2', userName: 'Марат С.', amount: 15000, status: 'COMPLETED', createdAt: '2025-12-25T10:30:00' },
      { id: '3', userName: 'СШ №45', amount: 150000, status: 'COMPLETED', createdAt: '2025-12-24T15:00:00' },
      { id: '4', userName: 'Динара Ж.', amount: 5000, status: 'PENDING', createdAt: '2025-12-24T12:00:00' },
    ]);
    setStats({
      totalUsers: 12450,
      activeUsers: 3250,
      revenue: 2500000,
      testsCompleted: 8920,
      growthUsers: 15,
      growthRevenue: 23,
    });
  }, []);

  const formatCurrency = (amount: number) => {
    if (amount >= 1000000) {
      return `${(amount / 1000000).toFixed(1)}M ₸`;
    }
    if (amount >= 1000) {
      return `${(amount / 1000).toFixed(0)}K ₸`;
    }
    return `${amount} ₸`;
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'PARENT': return 'Родитель';
      case 'PSYCHOLOGIST': return 'Психолог';
      case 'SCHOOL': return 'Школа';
      case 'ADMIN': return 'Админ';
      default: return role;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'PARENT': return 'bg-blue-100 text-blue-800';
      case 'PSYCHOLOGIST': return 'bg-purple-100 text-purple-800';
      case 'SCHOOL': return 'bg-green-100 text-green-800';
      case 'ADMIN': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'bg-green-100 text-green-800';
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      case 'FAILED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));

    if (hours < 1) return 'Только что';
    if (hours < 24) return `${hours}ч назад`;
    return date.toLocaleDateString('ru-RU');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Welcome Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Панель администратора
        </h1>
        <p className="mt-2 text-gray-600">
          Добро пожаловать, {userName}
        </p>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl shadow-sm p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Пользователей</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalUsers.toLocaleString()}</p>
              <p className="text-xs text-green-600 flex items-center mt-1">
                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                </svg>
                +{stats.growthUsers}% за месяц
              </p>
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
              <p className="text-sm font-medium text-gray-500">Активных (MAU)</p>
              <p className="text-2xl font-bold text-gray-900">{stats.activeUsers.toLocaleString()}</p>
              <p className="text-xs text-gray-500 mt-1">
                {Math.round((stats.activeUsers / stats.totalUsers) * 100)}% от всех
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Выручка</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.revenue)}</p>
              <p className="text-xs text-green-600 flex items-center mt-1">
                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                </svg>
                +{stats.growthRevenue}% за месяц
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Тестов пройдено</p>
              <p className="text-2xl font-bold text-gray-900">{stats.testsCompleted.toLocaleString()}</p>
              <p className="text-xs text-gray-500 mt-1">за всё время</p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Users */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Новые пользователи</h2>
            <Link href="/admin/users" className="text-sm text-indigo-600 hover:text-indigo-500 font-medium">
              Все пользователи
            </Link>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
            </div>
          ) : (
            <div className="space-y-4">
              {recentUsers.map((user) => (
                <div key={user.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                      {user.name[0]}
                    </div>
                    <div className="ml-3">
                      <p className="font-medium text-gray-900">{user.name}</p>
                      <p className="text-sm text-gray-500">{user.email}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getRoleColor(user.role)}`}>
                      {getRoleLabel(user.role)}
                    </span>
                    <p className="text-xs text-gray-400 mt-1">{formatTime(user.createdAt)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Payments */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Последние платежи</h2>
            <Link href="/admin/payments" className="text-sm text-indigo-600 hover:text-indigo-500 font-medium">
              Все платежи
            </Link>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
            </div>
          ) : (
            <div className="space-y-4">
              {recentPayments.map((payment) => (
                <div key={payment.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                      <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="font-medium text-gray-900">{payment.userName}</p>
                      <p className="text-sm text-gray-500">{formatTime(payment.createdAt)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-900">{payment.amount.toLocaleString()} ₸</p>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPaymentStatusColor(payment.status)}`}>
                      {payment.status === 'COMPLETED' ? 'Оплачено' : payment.status === 'PENDING' ? 'Ожидает' : payment.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-4">
        <Link
          href="/admin/users"
          className="flex items-center p-4 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow border border-gray-100"
        >
          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <div className="ml-4">
            <p className="font-medium text-gray-900">Пользователи</p>
            <p className="text-sm text-gray-500">Управление</p>
          </div>
        </Link>

        <Link
          href="/admin/tests"
          className="flex items-center p-4 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow border border-gray-100"
        >
          <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
            <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div className="ml-4">
            <p className="font-medium text-gray-900">Тесты</p>
            <p className="text-sm text-gray-500">Каталог</p>
          </div>
        </Link>

        <Link
          href="/admin/analytics"
          className="flex items-center p-4 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow border border-gray-100"
        >
          <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <div className="ml-4">
            <p className="font-medium text-gray-900">Аналитика</p>
            <p className="text-sm text-gray-500">Отчёты</p>
          </div>
        </Link>

        <Link
          href="/admin/settings"
          className="flex items-center p-4 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow border border-gray-100"
        >
          <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
            <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <div className="ml-4">
            <p className="font-medium text-gray-900">Настройки</p>
            <p className="text-sm text-gray-500">Система</p>
          </div>
        </Link>
      </div>
    </div>
  );
}
