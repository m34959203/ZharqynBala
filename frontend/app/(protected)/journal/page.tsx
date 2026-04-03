'use client';

import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';

interface ActivityLog {
  id: string;
  type: string;
  title: string;
  description: string | null;
  date: string;
  classGrade: number | null;
  classLetter: string | null;
  studentsCount: number | null;
  duration: number | null;
  result: string | null;
  schoolId: string | null;
  psychologist: {
    user: { firstName: string; lastName: string };
  };
}

interface JournalStats {
  total: number;
  totalHours: number;
  totalStudents: number;
  byType: Record<string, { count: number; hours: number }>;
}

const ACTIVITY_TYPES = [
  { value: 'DIAGNOSTIC', label: 'Диагностика', color: 'bg-blue-100 text-blue-800' },
  { value: 'CONSULTATION', label: 'Консультация', color: 'bg-purple-100 text-purple-800' },
  { value: 'CORRECTION', label: 'Коррекция', color: 'bg-orange-100 text-orange-800' },
  { value: 'EDUCATION', label: 'Просвещение', color: 'bg-green-100 text-green-800' },
  { value: 'METHODOLOGY', label: 'Методическая', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'OTHER', label: 'Другое', color: 'bg-gray-100 text-gray-800' },
];

function getTypeConfig(value: string) {
  return ACTIVITY_TYPES.find(t => t.value === value) || ACTIVITY_TYPES[5];
}

function formatDuration(minutes: number | null) {
  if (!minutes) return '-';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m} мин`;
  if (m === 0) return `${h} ч`;
  return `${h} ч ${m} мин`;
}

export default function JournalPage() {
  const [entries, setEntries] = useState<ActivityLog[]>([]);
  const [stats, setStats] = useState<JournalStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [classGradeFilter, setClassGradeFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const [form, setForm] = useState({
    type: 'DIAGNOSTIC',
    title: '',
    description: '',
    date: new Date().toISOString().slice(0, 10),
    classGrade: '',
    classLetter: '',
    studentsCount: '',
    duration: '',
    result: '',
  });

  const loadEntries = useCallback(async () => {
    try {
      const params: Record<string, string> = { page: String(page), limit: '20' };
      if (typeFilter) params.type = typeFilter;
      if (dateFrom) params.dateFrom = dateFrom;
      if (dateTo) params.dateTo = dateTo;
      if (classGradeFilter) params.classGrade = classGradeFilter;

      const response = await api.get('/journal', { params });
      setEntries(response.data.entries);
      setTotal(response.data.total);
    } catch (err) {
      console.error('Error loading journal:', err);
    }
  }, [typeFilter, dateFrom, dateTo, classGradeFilter, page]);

  const loadStats = useCallback(async () => {
    try {
      const response = await api.get('/journal/stats');
      setStats(response.data);
    } catch (err) {
      console.error('Error loading stats:', err);
    }
  }, []);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await Promise.all([loadEntries(), loadStats()]);
      setLoading(false);
    };
    load();
  }, [loadEntries, loadStats]);

  const resetForm = () => {
    setForm({
      type: 'DIAGNOSTIC',
      title: '',
      description: '',
      date: new Date().toISOString().slice(0, 10),
      classGrade: '',
      classLetter: '',
      studentsCount: '',
      duration: '',
      result: '',
    });
    setEditingId(null);
    setError('');
  };

  const handleOpenCreate = () => {
    resetForm();
    setShowModal(true);
  };

  const handleEdit = (entry: ActivityLog) => {
    setForm({
      type: entry.type,
      title: entry.title,
      description: entry.description || '',
      date: entry.date.slice(0, 10),
      classGrade: entry.classGrade?.toString() || '',
      classLetter: entry.classLetter || '',
      studentsCount: entry.studentsCount?.toString() || '',
      duration: entry.duration?.toString() || '',
      result: entry.result || '',
    });
    setEditingId(entry.id);
    setError('');
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Удалить эту запись?')) return;
    try {
      await api.delete(`/journal/${id}`);
      await Promise.all([loadEntries(), loadStats()]);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Ошибка удаления');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) {
      setError('Укажите название мероприятия');
      return;
    }

    setSaving(true);
    setError('');

    const payload: any = {
      type: form.type,
      title: form.title.trim(),
      date: new Date(form.date).toISOString(),
    };
    if (form.description.trim()) payload.description = form.description.trim();
    if (form.classGrade) payload.classGrade = parseInt(form.classGrade);
    if (form.classLetter.trim()) payload.classLetter = form.classLetter.trim();
    if (form.studentsCount) payload.studentsCount = parseInt(form.studentsCount);
    if (form.duration) payload.duration = parseInt(form.duration);
    if (form.result.trim()) payload.result = form.result.trim();

    try {
      if (editingId) {
        await api.patch(`/journal/${editingId}`, payload);
      } else {
        await api.post('/journal', payload);
      }
      setShowModal(false);
      resetForm();
      await Promise.all([loadEntries(), loadStats()]);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Ошибка сохранения');
    } finally {
      setSaving(false);
    }
  };

  const totalPages = Math.ceil(total / 20);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Журнал мероприятий</h1>
          <p className="mt-2 text-gray-600">Учёт деятельности психолога</p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Добавить запись
        </button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-sm p-4">
            <p className="text-sm text-gray-500">Всего записей</p>
            <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4">
            <p className="text-sm text-indigo-600">Всего часов</p>
            <p className="text-2xl font-bold text-indigo-700">{stats.totalHours}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4">
            <p className="text-sm text-green-600">Охват учеников</p>
            <p className="text-2xl font-bold text-green-700">{stats.totalStudents}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4">
            <p className="text-sm text-gray-500">По типам</p>
            <div className="mt-1 flex flex-wrap gap-1">
              {ACTIVITY_TYPES.map(at => {
                const typeData = stats.byType[at.value];
                if (!typeData) return null;
                return (
                  <span key={at.value} className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${at.color}`}>
                    {at.label}: {typeData.count}
                  </span>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Тип мероприятия</label>
            <select
              value={typeFilter}
              onChange={e => { setTypeFilter(e.target.value); setPage(1); }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="">Все типы</option>
              {ACTIVITY_TYPES.map(t => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Дата от</label>
            <input
              type="date"
              value={dateFrom}
              onChange={e => { setDateFrom(e.target.value); setPage(1); }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Дата до</label>
            <input
              type="date"
              value={dateTo}
              onChange={e => { setDateTo(e.target.value); setPage(1); }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Класс</label>
            <select
              value={classGradeFilter}
              onChange={e => { setClassGradeFilter(e.target.value); setPage(1); }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="">Все классы</option>
              {[1,2,3,4,5,6,7,8,9,10,11].map(g => (
                <option key={g} value={g}>{g} класс</option>
              ))}
            </select>
          </div>
        </div>
        {(typeFilter || dateFrom || dateTo || classGradeFilter) && (
          <button
            onClick={() => { setTypeFilter(''); setDateFrom(''); setDateTo(''); setClassGradeFilter(''); setPage(1); }}
            className="mt-3 text-sm text-indigo-600 hover:text-indigo-800"
          >
            Сбросить фильтры
          </button>
        )}
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

      {/* Entries Table */}
      {!loading && entries.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Дата</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Тип</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Название</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Класс</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Учеников</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Длит.</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Действия</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {entries.map(entry => {
                  const typeConf = getTypeConfig(entry.type);
                  return (
                    <tr key={entry.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap">
                        {new Date(entry.date).toLocaleDateString('ru-RU')}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${typeConf.color}`}>
                          {typeConf.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 max-w-xs truncate">
                        {entry.title}
                        {entry.description && (
                          <p className="text-xs text-gray-400 truncate mt-0.5">{entry.description}</p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
                        {entry.classGrade ? `${entry.classGrade}${entry.classLetter || ''}` : '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
                        {entry.studentsCount ?? '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
                        {formatDuration(entry.duration)}
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <button
                          onClick={() => handleEdit(entry)}
                          className="text-indigo-600 hover:text-indigo-800 text-sm mr-3"
                        >
                          Изменить
                        </button>
                        <button
                          onClick={() => handleDelete(entry.id)}
                          className="text-red-600 hover:text-red-800 text-sm"
                        >
                          Удалить
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
              <p className="text-sm text-gray-500">
                Показано {(page - 1) * 20 + 1}-{Math.min(page * 20, total)} из {total}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1 text-sm border rounded-lg disabled:opacity-40 hover:bg-gray-50"
                >
                  Назад
                </button>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-3 py-1 text-sm border rounded-lg disabled:opacity-40 hover:bg-gray-50"
                >
                  Вперёд
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Empty State */}
      {!loading && entries.length === 0 && (
        <div className="text-center py-12">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">Записей не найдено</h3>
          <p className="mt-1 text-sm text-gray-500">Добавьте первую запись в журнал мероприятий</p>
          <button
            onClick={handleOpenCreate}
            className="mt-4 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700"
          >
            Добавить запись
          </button>
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">
                  {editingId ? 'Редактировать запись' : 'Новая запись'}
                </h2>
                <button
                  onClick={() => { setShowModal(false); resetForm(); }}
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

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Тип мероприятия *</label>
                  <select
                    value={form.type}
                    onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  >
                    {ACTIVITY_TYPES.map(t => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>

                {/* Title */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Название *</label>
                  <input
                    type="text"
                    value={form.title}
                    onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                    placeholder="Название мероприятия"
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
                    placeholder="Подробности мероприятия..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                  />
                </div>

                {/* Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Дата *</label>
                  <input
                    type="date"
                    value={form.date}
                    onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>

                {/* Class Grade + Letter */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Класс</label>
                    <select
                      value={form.classGrade}
                      onChange={e => setForm(f => ({ ...f, classGrade: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    >
                      <option value="">-</option>
                      {[1,2,3,4,5,6,7,8,9,10,11].map(g => (
                        <option key={g} value={g}>{g}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Буква</label>
                    <input
                      type="text"
                      value={form.classLetter}
                      onChange={e => setForm(f => ({ ...f, classLetter: e.target.value.toUpperCase() }))}
                      placeholder="А, Б, В..."
                      maxLength={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Students + Duration */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Кол-во учеников</label>
                    <input
                      type="number"
                      min="0"
                      value={form.studentsCount}
                      onChange={e => setForm(f => ({ ...f, studentsCount: e.target.value }))}
                      placeholder="0"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Длительность (мин)</label>
                    <input
                      type="number"
                      min="1"
                      value={form.duration}
                      onChange={e => setForm(f => ({ ...f, duration: e.target.value }))}
                      placeholder="45"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Result */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Результат</label>
                  <textarea
                    value={form.result}
                    onChange={e => setForm(f => ({ ...f, result: e.target.value }))}
                    rows={2}
                    placeholder="Итоги, выводы, рекомендации..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                  />
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => { setShowModal(false); resetForm(); }}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Отмена
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
                  >
                    {saving ? 'Сохранение...' : editingId ? 'Сохранить' : 'Создать'}
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
