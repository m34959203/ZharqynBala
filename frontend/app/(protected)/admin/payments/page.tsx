'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { adminApi } from '@/lib/api';
import { ExportButton } from '@/components/ui';

interface Payment {
  id: string;
  userId: string;
  amount: number;
  paymentType: 'DIAGNOSTIC' | 'CONSULTATION' | 'SUBSCRIPTION';
  provider?: 'KASPI' | 'PAYBOX';
  status: 'COMPLETED' | 'PENDING' | 'FAILED' | 'REFUNDED';
  createdAt: string;
  completedAt?: string | null;
}

interface PaymentTotals {
  lifetimeRevenue: number;
  monthRevenue: number;
  pendingAmount: number;
  failedCount: number;
}

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const [totals, setTotals] = useState<PaymentTotals>({
    lifetimeRevenue: 0, monthRevenue: 0, pendingAmount: 0, failedCount: 0,
  });

  useEffect(() => {
    const fetchPayments = async () => {
      try {
        setLoading(true);
        const params: { status?: string; page: number } = { page };
        if (statusFilter !== 'all') {
          params.status = statusFilter;
        }
        const [data, totalsRes] = await Promise.all([
          adminApi.getPayments(params),
          adminApi.getPaymentTotals().catch(() => null),
        ]);
        setPayments(data.payments || []);
        setTotalPages(data.totalPages || 1);
        if (totalsRes) setTotals(totalsRes);
      } catch (error) {
        console.error('Failed to fetch payments:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchPayments();
  }, [page, statusFilter]);

  const filteredPayments = payments.filter(payment => {
    const matchesType = typeFilter === 'all' || payment.paymentType === typeFilter;
    return matchesType;
  });

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'DIAGNOSTIC': return 'Диагностика';
      case 'CONSULTATION': return 'Консультация';
      case 'SUBSCRIPTION': return 'Подписка';
      default: return type || '—';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'DIAGNOSTIC': return 'bg-blue-100 text-blue-800';
      case 'CONSULTATION': return 'bg-purple-100 text-purple-800';
      case 'SUBSCRIPTION': return 'bg-emerald-100 text-emerald-800';
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

  // Всегда из API /payments/totals (по всей БД, не по странице) —
  // закрывает BUG-021 (3 разных значения revenue в 3 местах).
  const stats = {
    totalRevenue: totals.lifetimeRevenue,
    monthRevenue: totals.monthRevenue,
    pendingAmount: totals.pendingAmount,
    failedCount: totals.failedCount,
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
          <ExportButton url="/export/payments" filename="payments.xlsx" label="Экспорт" />
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
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center">
                    <div className="flex justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                    </div>
                  </td>
                </tr>
              ) : filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                    Платежи не найдены
                  </td>
                </tr>
              ) : (
                filteredPayments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-500">#{payment.id.slice(0, 8)}</td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-500">{payment.userId.slice(0, 8)}...</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getTypeColor(payment.paymentType)}`}>
                        {getTypeLabel(payment.paymentType)}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-bold text-gray-900">
                      {payment.amount.toLocaleString()} ₸
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {payment.provider === 'PAYBOX' ? 'PayBox' : 'Kaspi'}
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
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50"
            >
              Назад
            </button>
            <span className="text-sm text-gray-600">
              Страница {page} из {totalPages}
            </span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50"
            >
              Вперёд
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
