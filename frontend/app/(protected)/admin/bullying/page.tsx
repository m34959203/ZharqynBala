'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import api from '@/lib/api';

interface BullyingReport {
  id: string;
  type: string;
  description: string;
  location?: string;
  victimGrade?: number;
  anonymous: boolean;
  reporterName?: string;
  reporterContact?: string;
  status: 'NEW' | 'IN_PROGRESS' | 'RESOLVED' | 'DISMISSED';
  schoolId?: string;
  adminNotes?: string;
  createdAt: string;
  updatedAt: string;
}

const TYPE_LABELS: Record<string, string> = {
  PHYSICAL: 'Физическое',
  VERBAL: 'Словесное',
  SOCIAL: 'Социальная изоляция',
  CYBER: 'Кибербуллинг',
  OTHER: 'Другое',
};

const STATUS_LABELS: Record<string, string> = {
  NEW: 'Новое',
  IN_PROGRESS: 'В работе',
  RESOLVED: 'Решено',
  DISMISSED: 'Отклонено',
};

const STATUS_COLORS: Record<string, string> = {
  NEW: 'bg-red-100 text-red-800',
  IN_PROGRESS: 'bg-yellow-100 text-yellow-800',
  RESOLVED: 'bg-green-100 text-green-800',
  DISMISSED: 'bg-gray-100 text-gray-800',
};

const TYPE_COLORS: Record<string, string> = {
  PHYSICAL: 'bg-red-50 text-red-700',
  VERBAL: 'bg-orange-50 text-orange-700',
  SOCIAL: 'bg-purple-50 text-purple-700',
  CYBER: 'bg-blue-50 text-blue-700',
  OTHER: 'bg-gray-50 text-gray-700',
};

export default function AdminBullyingPage() {
  const [reports, setReports] = useState<BullyingReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [adminNotes, setAdminNotes] = useState<Record<string, string>>({});

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    try {
      setLoading(true);
      const response = await api.get('/bullying/reports');
      setReports(response.data.reports || response.data || []);
    } catch (error) {
      console.error('Failed to load bullying reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: string, status: string) => {
    try {
      setUpdatingId(id);
      await api.patch(`/bullying/reports/${id}`, {
        status,
        adminNotes: adminNotes[id] || undefined,
      });
      await loadReports();
      if (expandedId === id && status === 'RESOLVED') {
        setExpandedId(null);
      }
    } catch (error) {
      console.error('Failed to update report status:', error);
      alert('Ошибка при обновлении статуса');
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredReports = reports.filter((r) => {
    if (statusFilter !== 'all' && r.status !== statusFilter) return false;
    if (typeFilter !== 'all' && r.type !== typeFilter) return false;
    return true;
  });

  const stats = {
    total: reports.length,
    new: reports.filter((r) => r.status === 'NEW').length,
    inProgress: reports.filter((r) => r.status === 'IN_PROGRESS').length,
    resolved: reports.filter((r) => r.status === 'RESOLVED').length,
    dismissed: reports.filter((r) => r.status === 'DISMISSED').length,
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <Link
          href="/dashboard"
          className="text-indigo-600 hover:text-indigo-500 text-sm font-medium flex items-center mb-4"
        >
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Назад к дашборду
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">Обращения о буллинге</h1>
        <p className="mt-2 text-gray-600">Просмотр и управление сообщениями о буллинге</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        <div className="bg-white rounded-xl shadow-sm p-4">
          <p className="text-sm text-gray-500">Всего</p>
          <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4 border-l-4 border-red-400">
          <p className="text-sm text-gray-500">Новых</p>
          <p className="text-2xl font-bold text-red-600">{stats.new}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4 border-l-4 border-yellow-400">
          <p className="text-sm text-gray-500">В работе</p>
          <p className="text-2xl font-bold text-yellow-600">{stats.inProgress}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4 border-l-4 border-green-400">
          <p className="text-sm text-gray-500">Решено</p>
          <p className="text-2xl font-bold text-green-600">{stats.resolved}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4 border-l-4 border-gray-400">
          <p className="text-sm text-gray-500">Отклонено</p>
          <p className="text-2xl font-bold text-gray-600">{stats.dismissed}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">Все статусы</option>
            <option value="NEW">Новые</option>
            <option value="IN_PROGRESS">В работе</option>
            <option value="RESOLVED">Решённые</option>
            <option value="DISMISSED">Отклонённые</option>
          </select>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">Все типы</option>
            <option value="PHYSICAL">Физическое</option>
            <option value="VERBAL">Словесное</option>
            <option value="SOCIAL">Социальная изоляция</option>
            <option value="CYBER">Кибербуллинг</option>
            <option value="OTHER">Другое</option>
          </select>
        </div>
      </div>

      {/* Reports List */}
      <div className="space-y-4">
        {loading ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <p className="text-gray-500">Загрузка...</p>
          </div>
        ) : filteredReports.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <svg
              className="w-12 h-12 text-gray-300 mx-auto mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
              />
            </svg>
            <p className="text-gray-500">Обращений не найдено</p>
          </div>
        ) : (
          filteredReports.map((report) => (
            <div key={report.id} className="bg-white rounded-xl shadow-sm overflow-hidden">
              {/* Report Header Row */}
              <div
                className="px-6 py-4 flex items-center justify-between cursor-pointer hover:bg-gray-50"
                onClick={() => setExpandedId(expandedId === report.id ? null : report.id)}
              >
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <div className="flex-shrink-0">
                    <span
                      className={`inline-block px-2.5 py-1 text-xs font-medium rounded-full ${STATUS_COLORS[report.status]}`}
                    >
                      {STATUS_LABELS[report.status]}
                    </span>
                  </div>
                  <div className="flex-shrink-0">
                    <span
                      className={`inline-block px-2.5 py-1 text-xs font-medium rounded-full ${TYPE_COLORS[report.type] || TYPE_COLORS.OTHER}`}
                    >
                      {TYPE_LABELS[report.type] || report.type}
                    </span>
                  </div>
                  <p className="text-sm text-gray-900 truncate flex-1">{report.description}</p>
                  <div className="flex-shrink-0 text-sm text-gray-500">
                    {new Date(report.createdAt).toLocaleDateString('ru-RU', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                </div>
                <svg
                  className={`w-5 h-5 text-gray-400 ml-4 transition-transform flex-shrink-0 ${expandedId === report.id ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>

              {/* Expanded Details */}
              {expandedId === report.id && (
                <div className="px-6 pb-6 border-t border-gray-100 pt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Left: Details */}
                    <div className="space-y-4">
                      <div>
                        <h4 className="text-xs font-medium text-gray-500 uppercase mb-1">Описание</h4>
                        <p className="text-sm text-gray-900 whitespace-pre-wrap">{report.description}</p>
                      </div>

                      {report.location && (
                        <div>
                          <h4 className="text-xs font-medium text-gray-500 uppercase mb-1">Место</h4>
                          <p className="text-sm text-gray-900">{report.location}</p>
                        </div>
                      )}

                      {report.victimGrade && (
                        <div>
                          <h4 className="text-xs font-medium text-gray-500 uppercase mb-1">Класс пострадавшего</h4>
                          <p className="text-sm text-gray-900">{report.victimGrade} класс</p>
                        </div>
                      )}

                      <div>
                        <h4 className="text-xs font-medium text-gray-500 uppercase mb-1">Автор</h4>
                        <p className="text-sm text-gray-900">
                          {report.anonymous ? (
                            <span className="text-gray-500 italic">Анонимно</span>
                          ) : (
                            <>
                              {report.reporterName || 'Не указано'}
                              {report.reporterContact && (
                                <span className="text-gray-500 ml-2">({report.reporterContact})</span>
                              )}
                            </>
                          )}
                        </p>
                      </div>
                    </div>

                    {/* Right: Actions */}
                    <div className="space-y-4">
                      <div>
                        <h4 className="text-xs font-medium text-gray-500 uppercase mb-2">Изменить статус</h4>
                        <div className="flex flex-wrap gap-2">
                          {(['NEW', 'IN_PROGRESS', 'RESOLVED', 'DISMISSED'] as const).map((status) => (
                            <button
                              key={status}
                              onClick={() => updateStatus(report.id, status)}
                              disabled={report.status === status || updatingId === report.id}
                              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                                report.status === status
                                  ? STATUS_COLORS[status] + ' ring-2 ring-offset-1 ring-gray-300'
                                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                              }`}
                            >
                              {STATUS_LABELS[status]}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <h4 className="text-xs font-medium text-gray-500 uppercase mb-2">Заметки администратора</h4>
                        <textarea
                          value={adminNotes[report.id] ?? report.adminNotes ?? ''}
                          onChange={(e) =>
                            setAdminNotes({ ...adminNotes, [report.id]: e.target.value })
                          }
                          rows={3}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                          placeholder="Внутренние заметки..."
                        />
                        <button
                          onClick={() => updateStatus(report.id, report.status)}
                          disabled={updatingId === report.id}
                          className="mt-2 px-4 py-1.5 text-xs font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                        >
                          Сохранить заметки
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
