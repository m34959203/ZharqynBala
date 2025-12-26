'use client';

import { useState } from 'react';
import Link from 'next/link';

interface Transaction {
  id: string;
  date: string;
  clientName: string;
  type: 'CONSULTATION' | 'TEST_REVIEW';
  amount: number;
  status: 'COMPLETED' | 'PENDING' | 'WITHDRAWN';
}

const mockTransactions: Transaction[] = [
  { id: '1', date: '2025-12-25', clientName: 'Асем Нурпеисова', type: 'CONSULTATION', amount: 15000, status: 'COMPLETED' },
  { id: '2', date: '2025-12-24', clientName: 'Марат Сагынбаев', type: 'CONSULTATION', amount: 15000, status: 'COMPLETED' },
  { id: '3', date: '2025-12-23', clientName: 'Динара Жумабаева', type: 'TEST_REVIEW', amount: 5000, status: 'COMPLETED' },
  { id: '4', date: '2025-12-22', clientName: 'Бауыржан Касымов', type: 'CONSULTATION', amount: 15000, status: 'PENDING' },
  { id: '5', date: '2025-12-20', clientName: 'Вывод средств', type: 'CONSULTATION', amount: -100000, status: 'WITHDRAWN' },
];

export default function EarningsPage() {
  const [period, setPeriod] = useState<'week' | 'month' | 'year'>('month');

  const stats = {
    balance: 145000,
    monthEarnings: 450000,
    consultations: 28,
    avgPerConsultation: 15000,
    pending: 30000,
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'CONSULTATION': return 'Консультация';
      case 'TEST_REVIEW': return 'Обзор теста';
      default: return type;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'bg-green-100 text-green-800';
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      case 'WITHDRAWN': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Финансы</h1>
          <p className="mt-2 text-gray-600">Управление доходами и выплатами</p>
        </div>
        <button className="px-6 py-3 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 flex items-center">
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          Вывести средства
        </button>
      </div>

      {/* Balance Card */}
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl p-8 text-white mb-8">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-white/80 mb-2">Текущий баланс</p>
            <p className="text-4xl font-bold">{stats.balance.toLocaleString()} ₸</p>
            <p className="text-white/80 mt-2">Ожидает: {stats.pending.toLocaleString()} ₸</p>
          </div>
          <div className="text-right">
            <p className="text-white/80 mb-2">За этот месяц</p>
            <p className="text-3xl font-bold">+{stats.monthEarnings.toLocaleString()} ₸</p>
            <p className="text-white/80 mt-2">{stats.consultations} консультаций</p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl shadow-sm p-5">
          <p className="text-sm font-medium text-gray-500">Консультаций</p>
          <p className="text-2xl font-bold text-gray-900">{stats.consultations}</p>
          <p className="text-xs text-green-600 mt-1">+12% от прошлого месяца</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-5">
          <p className="text-sm font-medium text-gray-500">Средний чек</p>
          <p className="text-2xl font-bold text-gray-900">{stats.avgPerConsultation.toLocaleString()} ₸</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-5">
          <p className="text-sm font-medium text-gray-500">Обзоры тестов</p>
          <p className="text-2xl font-bold text-gray-900">15</p>
          <p className="text-xs text-gray-500 mt-1">по 5,000 ₸</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-5">
          <p className="text-sm font-medium text-gray-500">Комиссия платформы</p>
          <p className="text-2xl font-bold text-gray-900">15%</p>
          <p className="text-xs text-gray-500 mt-1">уже вычтена</p>
        </div>
      </div>

      {/* Period Filter */}
      <div className="flex items-center space-x-2 mb-6">
        <button
          onClick={() => setPeriod('week')}
          className={`px-4 py-2 rounded-lg text-sm font-medium ${
            period === 'week' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700'
          }`}
        >
          Неделя
        </button>
        <button
          onClick={() => setPeriod('month')}
          className={`px-4 py-2 rounded-lg text-sm font-medium ${
            period === 'month' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700'
          }`}
        >
          Месяц
        </button>
        <button
          onClick={() => setPeriod('year')}
          className={`px-4 py-2 rounded-lg text-sm font-medium ${
            period === 'year' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700'
          }`}
        >
          Год
        </button>
      </div>

      {/* Transactions */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="p-6 border-b">
          <h2 className="text-lg font-semibold text-gray-900">История операций</h2>
        </div>
        <div className="divide-y">
          {mockTransactions.map((transaction) => (
            <div key={transaction.id} className="p-4 hover:bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    transaction.amount > 0 ? 'bg-green-100' : 'bg-blue-100'
                  }`}>
                    {transaction.amount > 0 ? (
                      <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                    )}
                  </div>
                  <div className="ml-4">
                    <p className="font-medium text-gray-900">{transaction.clientName}</p>
                    <p className="text-sm text-gray-500">
                      {getTypeLabel(transaction.type)} • {new Date(transaction.date).toLocaleDateString('ru-RU')}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-bold ${transaction.amount > 0 ? 'text-green-600' : 'text-blue-600'}`}>
                    {transaction.amount > 0 ? '+' : ''}{transaction.amount.toLocaleString()} ₸
                  </p>
                  <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getStatusColor(transaction.status)}`}>
                    {transaction.status === 'COMPLETED' ? 'Завершено' : transaction.status === 'PENDING' ? 'Ожидает' : 'Выведено'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
