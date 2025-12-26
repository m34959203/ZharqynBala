'use client';

import { useState } from 'react';
import Link from 'next/link';

interface Payment {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  amount: number;
  type: 'SUBSCRIPTION' | 'CONSULTATION' | 'TEST_PACK' | 'SCHOOL_LICENSE';
  status: 'COMPLETED' | 'PENDING' | 'FAILED' | 'REFUNDED';
  createdAt: string;
  paymentMethod: string;
}

const mockPayments: Payment[] = [
  { id: '1', userId: '1', userName: 'Асем Нурпеисова', userEmail: 'asem@mail.kz', amount: 5000, type: 'SUBSCRIPTION', status: 'COMPLETED', createdAt: '2025-12-26T10:30:00', paymentMethod: 'Kaspi' },
  { id: '2', userId: '2', userName: 'Марат Сагынбаев', userEmail: 'marat@mail.kz', amount: 15000, type: 'CONSULTATION', status: 'COMPLETED', createdAt: '2025-12-25T15:45:00', paymentMethod: 'Kaspi' },
  { id: '3', userId: '3', userName: 'СШ №45', userEmail: 'school45@edu.kz', amount: 150000, type: 'SCHOOL_LICENSE', status: 'COMPLETED', createdAt: '2025-12-24T09:00:00', paymentMethod: 'Bank Transfer' },
  { id: '4', userId: '4', userName: 'Динара Жумабаева', userEmail: 'dinara@mail.kz', amount: 5000, type: 'SUBSCRIPTION', status: 'PENDING', createdAt: '2025-12-24T14:20:00', paymentMethod: 'Kaspi' },
  { id: '5', userId: '5', userName: 'Бауыржан Касымов', userEmail: 'baurz@mail.kz', amount: 10000, type: 'TEST_PACK', status: 'FAILED', createdAt: '2025-12-23T11:15:00', paymentMethod: 'Card' },
  { id: '6', userId: '6', userName: 'Гимназия №56', userEmail: 'gym56@edu.kz', amount: 200000, type: 'SCHOOL_LICENSE', status: 'COMPLETED', createdAt: '2025-12-22T16:30:00', paymentMethod: 'Bank Transfer' },
  { id: '7', userId: '7', userName: 'Алия Мухамедова', userEmail: 'aliya@mail.kz', amount: 15000, type: 'CONSULTATION', status: 'REFUNDED', createdAt: '2025-12-21T10:00:00', paymentMethod: 'Kaspi' },
];

export default function AdminPaymentsPage() {
  const [payments] = useState<Payment[]>(mockPayments);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filteredPayments = payments.filter(payment => {
    const matchesSearch = payment.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         payment.userEmail.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === 'all' || payment.type === typeFilter;
    const matchesStatus = statusFilter === 'all' || payment.status === statusFilter;
    return matchesSearch && matchesType && matchesStatus;
  });

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'SUBSCRIPTION': return 'Подписка';
      case 'CONSULTATION': return 'Консультация';
      case 'TEST_PACK': return 'Пакет тестов';
      case 'SCHOOL_LICENSE': return 'Лицензия школы';
      default: return type;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'SUBSCRIPTION': return 'bg-blue-100 text-blue-800';
      case 'CONSULTATION': return 'bg-purple-100 text-purple-800';
      case 'TEST_PACK': return 'bg-orange-100 text-orange-800';
      case 'SCHOOL_LICENSE': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'bg-green-100 text-green-800';
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      case 'FAILED': return 'bg-red-100 text-red-800';
      case 'REFUNDED': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'Оплачено';
      case 'PENDING': return 'Ожидает';
      case 'FAILED': return 'Ошибка';
      case 'REFUNDED': return 'Возврат';
      default: return status;
    }
  };

  const stats = {
    totalRevenue: payments.filter(p => p.status === 'COMPLETED').reduce((sum, p) => sum + p.amount, 0),
    monthRevenue: payments.filter(p => p.status === 'COMPLETED' && new Date(p.createdAt).getMonth() === new Date().getMonth()).reduce((sum, p) => sum + p.amount, 0),
    pendingAmount: payments.filter(p => p.status === 'PENDING').reduce((sum, p) => sum + p.amount, 0),
    failedCount: payments.filter(p => p.status === 'FAILED').length,
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
            <h1 className="text-3xl font-bold text-gray-900">Платежи</h1>
            <p className="mt-2 text-gray-600">История всех платежей на платформе</p>
          </div>
          <button className="px-6 py-3 bg-green-600 text-white font-medium rounded-xl hover:bg-green-700 flex items-center">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Экспорт в Excel
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl p-5 text-white">
          <p className="text-white/80 text-sm">Общая выручка</p>
          <p className="text-3xl font-bold">{stats.totalRevenue.toLocaleString()} ₸</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-5">
          <p className="text-sm text-gray-500">За этот месяц</p>
          <p className="text-2xl font-bold text-gray-900">{stats.monthRevenue.toLocaleString()} ₸</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-5">
          <p className="text-sm text-gray-500">Ожидает оплаты</p>
          <p className="text-2xl font-bold text-yellow-600">{stats.pendingAmount.toLocaleString()} ₸</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-5">
          <p className="text-sm text-gray-500">Неудачных платежей</p>
          <p className="text-2xl font-bold text-red-600">{stats.failedCount}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Поиск по имени или email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">Все типы</option>
            <option value="SUBSCRIPTION">Подписки</option>
            <option value="CONSULTATION">Консультации</option>
            <option value="TEST_PACK">Пакеты тестов</option>
            <option value="SCHOOL_LICENSE">Лицензии школ</option>
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">Все статусы</option>
            <option value="COMPLETED">Оплачено</option>
            <option value="PENDING">Ожидает</option>
            <option value="FAILED">Ошибка</option>
            <option value="REFUNDED">Возврат</option>
          </select>
        </div>
      </div>

      {/* Payments Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Пользователь</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Тип</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Сумма</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Способ</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Статус</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Дата</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Действия</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredPayments.map((payment) => (
                <tr key={payment.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm text-gray-500">#{payment.id}</td>
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-medium text-gray-900">{payment.userName}</p>
                      <p className="text-sm text-gray-500">{payment.userEmail}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getTypeColor(payment.type)}`}>
                      {getTypeLabel(payment.type)}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-bold text-gray-900">
                    {payment.amount.toLocaleString()} ₸
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {payment.paymentMethod}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(payment.status)}`}>
                      {getStatusLabel(payment.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {new Date(payment.createdAt).toLocaleString('ru-RU', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </td>
                  <td className="px-6 py-4">
                    <button className="text-indigo-600 hover:text-indigo-500 text-sm font-medium">
                      Подробнее
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
