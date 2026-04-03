'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { useSchool } from '@/lib/useSchool';

interface ClassData {
  id: string;
  grade: number;
  letter: string;
  academicYear: string;
  studentCount: number;
}

const GRADES = Array.from({ length: 12 }, (_, i) => i + 1);
const LETTERS = ['А', 'Б', 'В', 'Г'];

export default function ClassesPage() {
  const { schoolId, loading: schoolLoading, error: schoolError } = useSchool();
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [formGrade, setFormGrade] = useState(1);
  const [formLetter, setFormLetter] = useState('А');
  const [formYear, setFormYear] = useState(new Date().getFullYear().toString());
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    if (schoolId) {
      fetchClasses();
    }
  }, [schoolId]);

  const fetchClasses = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/schools/${schoolId}/classes`);
      setClasses(res.data || []);
    } catch (err: any) {
      setError('Не удалось загрузить список классов');
      console.error('Failed to fetch classes:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    try {
      setSubmitting(true);
      await api.post(`/schools/${schoolId}/classes`, {
        grade: formGrade,
        letter: formLetter,
        academicYear: formYear,
      });
      setShowForm(false);
      setFormGrade(1);
      setFormLetter('А');
      fetchClasses();
    } catch (err: any) {
      const msg = err.response?.data?.message;
      if (typeof msg === 'string' && msg.includes('Unique constraint')) {
        setFormError('Такой класс уже существует');
      } else {
        setFormError(msg || 'Ошибка при создании класса');
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (schoolLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        <span className="ml-3 text-gray-600">Загрузка...</span>
      </div>
    );
  }

  if (schoolError) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="p-6 bg-red-50 border border-red-200 rounded-xl text-red-700">
          {schoolError}
        </div>
      </div>
    );
  }

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
            <h1 className="text-3xl font-bold text-gray-900">Классы</h1>
            <p className="mt-2 text-gray-600">Управление классами и учениками</p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="px-6 py-3 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 flex items-center"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Добавить класс
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600">
          {error}
        </div>
      )}

      {/* Create Class Form */}
      {showForm && (
        <div className="bg-white rounded-xl shadow-sm p-6 mb-8 border border-indigo-200">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Новый класс</h2>
            <button
              onClick={() => setShowForm(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleCreateClass} className="space-y-4">
            {formError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                {formError}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Класс (1-12) *
                </label>
                <select
                  value={formGrade}
                  onChange={(e) => setFormGrade(Number(e.target.value))}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  {GRADES.map((g) => (
                    <option key={g} value={g}>
                      {g} класс
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Литера *
                </label>
                <select
                  value={formLetter}
                  onChange={(e) => setFormLetter(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  {LETTERS.map((l) => (
                    <option key={l} value={l}>
                      {l}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Учебный год *
                </label>
                <input
                  type="text"
                  value={formYear}
                  onChange={(e) => setFormYear(e.target.value)}
                  placeholder="2025"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
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
                {submitting ? 'Создание...' : 'Создать класс'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Classes Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-xl shadow-sm p-6 animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      ) : classes.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-12">
          <div className="text-center">
            <svg className="mx-auto h-16 w-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            <h3 className="mt-4 text-xl font-medium text-gray-900">Нет классов</h3>
            <p className="mt-2 text-gray-500 max-w-md mx-auto">
              Добавьте первый класс, чтобы начать работу с учениками и тестированием.
            </p>
            <button
              onClick={() => setShowForm(true)}
              className="mt-6 inline-flex items-center px-6 py-3 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Добавить класс
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {classes
            .sort((a, b) => a.grade - b.grade || a.letter.localeCompare(b.letter))
            .map((cls) => (
              <div
                key={cls.id}
                className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow"
              >
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-2xl font-bold text-gray-900">
                      {cls.grade}-{cls.letter}
                    </h3>
                    <span className="px-3 py-1 bg-indigo-100 text-indigo-800 text-sm font-medium rounded-full">
                      {cls.academicYear}
                    </span>
                  </div>

                  <div className="flex items-center text-gray-500 mb-4">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span>{cls.studentCount} учеников</span>
                  </div>

                  <div className="flex space-x-3">
                    <Link
                      href={`/students?classId=${cls.id}`}
                      className="flex-1 text-center px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700"
                    >
                      Ученики
                    </Link>
                    <Link
                      href={`/testing/new?classId=${cls.id}`}
                      className="flex-1 text-center px-4 py-2 border border-indigo-600 text-indigo-600 text-sm font-medium rounded-lg hover:bg-indigo-50"
                    >
                      Тестировать
                    </Link>
                  </div>
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
