'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import api from '@/lib/api';

const QUARTERS = [
  { num: 1, label: 'I четверть (сент-окт)' },
  { num: 2, label: 'II четверть (нояб-дек)' },
  { num: 3, label: 'III четверть (янв-март)' },
  { num: 4, label: 'IV четверть (апр-май)' },
];

const STATUS_COLORS: Record<string, string> = {
  PLANNED: 'bg-blue-100 text-blue-800',
  ACTIVE: 'bg-green-100 text-green-800',
  COMPLETED: 'bg-gray-100 text-gray-600',
  CANCELLED: 'bg-red-100 text-red-800',
};

const STATUS_LABELS: Record<string, string> = {
  PLANNED: 'Запланирован',
  ACTIVE: 'Активен',
  COMPLETED: 'Завершён',
  CANCELLED: 'Отменён',
};

interface CalendarEvent {
  id: string;
  title: string;
  testId: string;
  testTitle: string;
  classId: string;
  className: string;
  quarter: number;
  startDate: string;
  endDate: string;
  status: string;
  createdAt: string;
}

interface TestOption {
  id: string;
  titleRu: string;
}

interface ClassOption {
  id: string;
  name: string;
}

export default function CalendarPage() {
  const [activeQuarter, setActiveQuarter] = useState(1);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);

  // Form state
  const [formTitle, setFormTitle] = useState('');
  const [formTestId, setFormTestId] = useState('');
  const [formClassId, setFormClassId] = useState('');
  const [formStartDate, setFormStartDate] = useState('');
  const [formEndDate, setFormEndDate] = useState('');
  const [formQuarter, setFormQuarter] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Options for selects
  const [tests, setTests] = useState<TestOption[]>([]);
  const [classes, setClasses] = useState<ClassOption[]>([]);

  useEffect(() => {
    fetchEvents();
    fetchOptions();
  }, []);

  // Set current quarter based on month
  useEffect(() => {
    const month = new Date().getMonth() + 1;
    if (month >= 9 && month <= 10) setActiveQuarter(1);
    else if (month >= 11 && month <= 12) setActiveQuarter(2);
    else if (month >= 1 && month <= 3) setActiveQuarter(3);
    else setActiveQuarter(4);
  }, []);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const response = await api.get('/calendar');
      setEvents(response.data.events || response.data || []);
    } catch (err: any) {
      setError('Не удалось загрузить расписание');
      console.error('Failed to fetch calendar events:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchOptions = async () => {
    try {
      const [testsRes, classesRes] = await Promise.allSettled([
        api.get('/tests'),
        api.get('/classes'),
      ]);
      if (testsRes.status === 'fulfilled') {
        setTests(testsRes.value.data.tests || testsRes.value.data || []);
      }
      if (classesRes.status === 'fulfilled') {
        setClasses(classesRes.value.data.classes || classesRes.value.data || []);
      }
    } catch {
      // Options are optional, page still works
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!formTitle.trim()) {
      setFormError('Введите название мероприятия');
      return;
    }
    if (!formStartDate || !formEndDate) {
      setFormError('Укажите даты начала и окончания');
      return;
    }

    try {
      setSubmitting(true);
      await api.post('/calendar', {
        title: formTitle,
        testId: formTestId || undefined,
        classId: formClassId || undefined,
        quarter: formQuarter,
        startDate: formStartDate,
        endDate: formEndDate,
      });
      // Reset form
      setFormTitle('');
      setFormTestId('');
      setFormClassId('');
      setFormStartDate('');
      setFormEndDate('');
      setShowForm(false);
      fetchEvents();
    } catch (err: any) {
      setFormError(err.response?.data?.message || 'Ошибка при создании мероприятия');
    } finally {
      setSubmitting(false);
    }
  };

  const quarterEvents = events.filter((e) => e.quarter === activeQuarter);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Календарь тестирования</h1>
            <p className="mt-2 text-gray-600">
              Планирование и управление расписанием тестирования
            </p>
          </div>
          <button
            onClick={() => {
              setFormQuarter(activeQuarter);
              setShowForm(true);
            }}
            className="px-6 py-3 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 flex items-center"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Запланировать тест
          </button>
        </div>
      </div>

      {/* Quarter Tabs */}
      <div className="flex space-x-1 bg-gray-100 rounded-xl p-1 mb-8">
        {QUARTERS.map((q) => (
          <button
            key={q.num}
            onClick={() => setActiveQuarter(q.num)}
            className={`flex-1 py-3 px-4 rounded-lg text-sm font-medium transition-all ${
              activeQuarter === q.num
                ? 'bg-white text-indigo-700 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {q.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600">
          {error}
        </div>
      )}

      {/* Create Event Form */}
      {showForm && (
        <div className="bg-white rounded-xl shadow-sm p-6 mb-8 border border-indigo-200">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Новое мероприятие</h2>
            <button
              onClick={() => setShowForm(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {formError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                {formError}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Название мероприятия *
              </label>
              <input
                type="text"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                placeholder="Например: Диагностика тревожности 5-х классов"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Тест</label>
                <select
                  value={formTestId}
                  onChange={(e) => setFormTestId(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Выберите тест</option>
                  {tests.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.titleRu}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Класс</label>
                <select
                  value={formClassId}
                  onChange={(e) => setFormClassId(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Выберите класс</option>
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Четверть</label>
                <select
                  value={formQuarter}
                  onChange={(e) => setFormQuarter(Number(e.target.value))}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                >
                  {QUARTERS.map((q) => (
                    <option key={q.num} value={q.num}>
                      {q.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Дата начала *
                </label>
                <input
                  type="date"
                  value={formStartDate}
                  onChange={(e) => setFormStartDate(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Дата окончания *
                </label>
                <input
                  type="date"
                  value={formEndDate}
                  onChange={(e) => setFormEndDate(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50"
              >
                Отмена
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-3 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 disabled:opacity-50"
              >
                {submitting ? 'Сохранение...' : 'Создать'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Events List */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-xl shadow-sm p-6 animate-pulse">
              <div className="h-5 bg-gray-200 rounded w-1/3 mb-3"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            </div>
          ))}
        </div>
      ) : quarterEvents.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl shadow-sm">
          <svg
            className="mx-auto h-16 w-16 text-gray-300"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <h3 className="mt-4 text-lg font-medium text-gray-900">
            Нет запланированных мероприятий
          </h3>
          <p className="mt-2 text-gray-500">
            В {QUARTERS[activeQuarter - 1].label.toLowerCase()} пока нет запланированных тестирований
          </p>
          <button
            onClick={() => {
              setFormQuarter(activeQuarter);
              setShowForm(true);
            }}
            className="mt-6 inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Запланировать тест
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {quarterEvents.map((event) => (
            <div
              key={event.id}
              className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">{event.title}</h3>
                    <span
                      className={`px-2.5 py-0.5 text-xs font-medium rounded-full ${
                        STATUS_COLORS[event.status] || 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {STATUS_LABELS[event.status] || event.status}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                    {event.testTitle && (
                      <span className="flex items-center">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        {event.testTitle}
                      </span>
                    )}
                    {event.className && (
                      <span className="flex items-center">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                        {event.className}
                      </span>
                    )}
                    <span className="flex items-center">
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      {new Date(event.startDate).toLocaleDateString('ru-RU', {
                        day: 'numeric',
                        month: 'short',
                      })}
                      {' \u2014 '}
                      {new Date(event.endDate).toLocaleDateString('ru-RU', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
