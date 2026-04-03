'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import api from '@/lib/api';

interface Child {
  id: string;
  firstName: string;
  lastName: string;
}

interface CaseNote {
  id: string;
  content: string;
  createdAt: string;
}

interface StudentCase {
  id: string;
  title: string;
  description: string | null;
  priority: string;
  status: string;
  category: string | null;
  openedAt: string;
  child: { id: string; firstName: string; lastName: string };
  psychologist: { user: { firstName: string; lastName: string } } | null;
  caseNotes: CaseNote[];
}

interface CaseStats {
  total: number;
  byStatus: Record<string, number>;
  byPriority: Record<string, number>;
}

const PRIORITIES = [
  { value: 'CRITICAL', label: 'Критический', color: 'bg-red-100 text-red-800', dot: 'bg-red-500' },
  { value: 'HIGH', label: 'Высокий', color: 'bg-orange-100 text-orange-800', dot: 'bg-orange-500' },
  { value: 'MEDIUM', label: 'Средний', color: 'bg-blue-100 text-blue-800', dot: 'bg-blue-500' },
  { value: 'LOW', label: 'Низкий', color: 'bg-gray-100 text-gray-800', dot: 'bg-gray-400' },
];

const STATUSES = [
  { value: 'OPEN', label: 'Открыт', color: 'bg-blue-100 text-blue-800' },
  { value: 'IN_PROGRESS', label: 'В работе', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'ON_HOLD', label: 'На паузе', color: 'bg-gray-100 text-gray-800' },
  { value: 'RESOLVED', label: 'Решён', color: 'bg-green-100 text-green-800' },
  { value: 'CLOSED', label: 'Закрыт', color: 'bg-gray-100 text-gray-600' },
];

const CATEGORIES = [
  'Поведение', 'Обучение', 'Эмоции', 'Социализация',
  'Семья', 'Здоровье', 'Адаптация', 'Другое',
];

function getPriorityConfig(value: string) {
  return PRIORITIES.find(p => p.value === value) || PRIORITIES[2];
}

function getStatusConfig(value: string) {
  return STATUSES.find(s => s.value === value) || STATUSES[0];
}

export default function CasesPage() {
  const [cases, setCases] = useState<StudentCase[]>([]);
  const [stats, setStats] = useState<CaseStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [children, setChildren] = useState<Child[]>([]);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  // Create form state
  const [form, setForm] = useState({
    childId: '',
    title: '',
    description: '',
    priority: 'MEDIUM',
    category: '',
  });

  const loadCases = useCallback(async () => {
    try {
      const params: Record<string, string> = {};
      if (statusFilter) params.status = statusFilter;
      if (priorityFilter) params.priority = priorityFilter;

      const response = await api.get('/cases', { params });
      setCases(response.data.cases);
    } catch (err) {
      console.error('Error loading cases:', err);
    }
  }, [statusFilter, priorityFilter]);

  const loadStats = useCallback(async () => {
    try {
      const response = await api.get('/cases/stats');
      setStats(response.data);
    } catch (err) {
      console.error('Error loading stats:', err);
    }
  }, []);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await Promise.all([loadCases(), loadStats()]);
      setLoading(false);
    };
    load();
  }, [loadCases, loadStats]);

  const loadChildren = async () => {
    try {
      const response = await api.get('/users/me/children');
      setChildren(response.data);
    } catch {
      // For psychologists, try a different endpoint or just keep empty
      setChildren([]);
    }
  };

  const handleOpenCreate = () => {
    setShowCreateModal(true);
    loadChildren();
    setForm({ childId: '', title: '', description: '', priority: 'MEDIUM', category: '' });
    setError('');
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.childId || !form.title) {
      setError('Выберите ребёнка и укажите название кейса');
      return;
    }

    setCreating(true);
    setError('');
    try {
      await api.post('/cases', {
        childId: form.childId,
        title: form.title,
        description: form.description || undefined,
        priority: form.priority,
        category: form.category || undefined,
      });
      setShowCreateModal(false);
      await Promise.all([loadCases(), loadStats()]);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Ошибка создания кейса');
    } finally {
      setCreating(false);
    }
  };

  const statOpen = stats?.byStatus?.OPEN || 0;
  const statInProgress = stats?.byStatus?.IN_PROGRESS || 0;
  const statResolved = stats?.byStatus?.RESOLVED || 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Кейсы</h1>
          <p className="mt-2 text-gray-600">Управление кейсами учеников</p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Создать кейс
        </button>
      </div>

      {/* Stats Bar */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-sm p-4">
            <p className="text-sm text-gray-500">Всего</p>
            <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4">
            <p className="text-sm text-blue-600">Открытые</p>
            <p className="text-2xl font-bold text-blue-700">{statOpen}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4">
            <p className="text-sm text-yellow-600">В работе</p>
            <p className="text-2xl font-bold text-yellow-700">{statInProgress}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4">
            <p className="text-sm text-green-600">Решённые</p>
            <p className="text-2xl font-bold text-green-700">{statResolved}</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Статус</label>
            <div className="flex items-center flex-wrap gap-2">
              <button
                onClick={() => setStatusFilter('')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  !statusFilter ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Все
              </button>
              {STATUSES.map(s => (
                <button
                  key={s.value}
                  onClick={() => setStatusFilter(statusFilter === s.value ? '' : s.value)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    statusFilter === s.value ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Приоритет</label>
            <div className="flex items-center flex-wrap gap-2">
              <button
                onClick={() => setPriorityFilter('')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  !priorityFilter ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Все
              </button>
              {PRIORITIES.map(p => (
                <button
                  key={p.value}
                  onClick={() => setPriorityFilter(priorityFilter === p.value ? '' : p.value)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    priorityFilter === p.value ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white rounded-xl shadow-sm p-6 animate-pulse">
              <div className="h-5 bg-gray-200 rounded w-1/3 mb-3" />
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-2" />
              <div className="h-3 bg-gray-200 rounded w-2/3" />
            </div>
          ))}
        </div>
      )}

      {/* Cases List */}
      {!loading && cases.length > 0 && (
        <div className="space-y-4">
          {cases.map(c => {
            const priorityConf = getPriorityConfig(c.priority);
            const statusConf = getStatusConfig(c.status);
            const lastNote = c.caseNotes?.[0];

            return (
              <Link key={c.id} href={`/cases/${c.id}`} className="block">
                <div className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow border border-gray-100">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-lg font-semibold text-gray-900 truncate">{c.title}</h3>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${priorityConf.color}`}>
                          {priorityConf.label}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusConf.color}`}>
                          {statusConf.label}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-gray-600">
                        <span className="font-medium">{c.child.firstName} {c.child.lastName}</span>
                        {c.category && <span className="ml-2 text-gray-400">/ {c.category}</span>}
                      </p>
                      {c.description && (
                        <p className="mt-2 text-sm text-gray-500 line-clamp-2">{c.description}</p>
                      )}
                      {lastNote && (
                        <div className="mt-3 p-2 bg-gray-50 rounded-lg">
                          <p className="text-xs text-gray-400 mb-0.5">Последняя заметка</p>
                          <p className="text-sm text-gray-600 line-clamp-1">{lastNote.content}</p>
                        </div>
                      )}
                    </div>
                    <div className="ml-4 text-right shrink-0">
                      <p className="text-sm text-gray-500">
                        {new Date(c.openedAt).toLocaleDateString('ru-RU')}
                      </p>
                      {c.psychologist && (
                        <p className="text-xs text-gray-400 mt-1">
                          {c.psychologist.user.firstName} {c.psychologist.user.lastName}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* Empty State */}
      {!loading && cases.length === 0 && (
        <div className="text-center py-12">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">Кейсов не найдено</h3>
          <p className="mt-1 text-sm text-gray-500">Создайте новый кейс для начала работы</p>
          <button
            onClick={handleOpenCreate}
            className="mt-4 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700"
          >
            Создать кейс
          </button>
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">Новый кейс</h2>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded-lg">{error}</div>
              )}

              <form onSubmit={handleCreate} className="space-y-4">
                {/* Child select */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ребёнок *</label>
                  {children.length > 0 ? (
                    <select
                      value={form.childId}
                      onChange={e => setForm(f => ({ ...f, childId: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    >
                      <option value="">Выберите ребёнка</option>
                      {children.map(ch => (
                        <option key={ch.id} value={ch.id}>
                          {ch.firstName} {ch.lastName}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      placeholder="ID ребёнка"
                      value={form.childId}
                      onChange={e => setForm(f => ({ ...f, childId: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  )}
                </div>

                {/* Title */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Название *</label>
                  <input
                    type="text"
                    value={form.title}
                    onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                    placeholder="Краткое описание проблемы"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Описание</label>
                  <textarea
                    value={form.description}
                    onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                    rows={3}
                    placeholder="Подробное описание ситуации..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                  />
                </div>

                {/* Priority */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Приоритет</label>
                  <div className="grid grid-cols-4 gap-2">
                    {PRIORITIES.map(p => (
                      <button
                        key={p.value}
                        type="button"
                        onClick={() => setForm(f => ({ ...f, priority: p.value }))}
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors border ${
                          form.priority === p.value
                            ? `${p.color} border-current`
                            : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Category */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Категория</label>
                  <select
                    value={form.category}
                    onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  >
                    <option value="">Без категории</option>
                    {CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Отмена
                  </button>
                  <button
                    type="submit"
                    disabled={creating}
                    className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
                  >
                    {creating ? 'Создание...' : 'Создать'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
