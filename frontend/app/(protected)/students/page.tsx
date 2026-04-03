'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import api from '@/lib/api';
import { useSchool } from '@/lib/useSchool';

interface Student {
  id: string;
  firstName: string;
  lastName: string;
  birthDate: string;
  gender: string;
  classId: string;
  className: string;
}

interface ClassOption {
  id: string;
  grade: number;
  letter: string;
  academicYear: string;
  studentCount: number;
}

function StudentsContent() {
  const searchParams = useSearchParams();
  const initialClassId = searchParams.get('classId') || '';

  const { schoolId, loading: schoolLoading, error: schoolError } = useSchool();
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [selectedClassId, setSelectedClassId] = useState(initialClassId);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (schoolId) {
      fetchClasses();
      fetchStudents(selectedClassId);
    }
  }, [schoolId]);

  useEffect(() => {
    if (schoolId) {
      fetchStudents(selectedClassId);
    }
  }, [selectedClassId, schoolId]);

  const fetchClasses = async () => {
    try {
      const res = await api.get(`/schools/${schoolId}/classes`);
      setClasses(res.data || []);
    } catch {
      // non-critical
    }
  };

  const fetchStudents = async (classId: string) => {
    try {
      setLoading(true);
      const params = classId ? `?classId=${classId}` : '';
      const res = await api.get(`/schools/${schoolId}/students${params}`);
      setStudents(res.data || []);
    } catch (err: any) {
      setError('Не удалось загрузить список учеников');
      console.error('Failed to fetch students:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const genderLabel = (g: string) => (g === 'MALE' ? 'М' : 'Ж');

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
            <h1 className="text-3xl font-bold text-gray-900">Ученики</h1>
            <p className="mt-2 text-gray-600">
              Список учеников школы{' '}
              {students.length > 0 && (
                <span className="text-indigo-600 font-medium">({students.length})</span>
              )}
            </p>
          </div>
          <div className="flex space-x-3">
            <Link
              href="/students/import"
              className="px-6 py-3 border border-indigo-600 text-indigo-600 font-medium rounded-xl hover:bg-indigo-50 flex items-center"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              Импорт
            </Link>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600">
          {error}
        </div>
      )}

      {/* Filter by class */}
      <div className="mb-6">
        <div className="flex items-center space-x-2 overflow-x-auto pb-2">
          <button
            onClick={() => setSelectedClassId('')}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              selectedClassId === ''
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Все классы
          </button>
          {classes
            .sort((a, b) => a.grade - b.grade || a.letter.localeCompare(b.letter))
            .map((cls) => (
              <button
                key={cls.id}
                onClick={() => setSelectedClassId(cls.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                  selectedClassId === cls.id
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {cls.grade}-{cls.letter} ({cls.studentCount})
              </button>
            ))}
        </div>
      </div>

      {/* Students Table */}
      {loading ? (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="space-y-4 animate-pulse">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center space-x-4">
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/6"></div>
                <div className="h-4 bg-gray-200 rounded w-1/12"></div>
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              </div>
            ))}
          </div>
        </div>
      ) : students.length === 0 ? (
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
              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
          <h3 className="mt-4 text-lg font-medium text-gray-900">Нет учеников</h3>
          <p className="mt-2 text-gray-500">
            {selectedClassId
              ? 'В этом классе пока нет учеников'
              : 'Добавьте учеников через импорт или вручную'}
          </p>
          <Link
            href="/students/import"
            className="mt-6 inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Добавить учеников
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ФИО
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Класс
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Пол
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Дата рождения
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {students.map((student) => (
                  <tr key={student.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-medium text-sm">
                          {student.firstName[0]}
                          {student.lastName[0]}
                        </div>
                        <div className="ml-3">
                          <p className="text-sm font-medium text-gray-900">
                            {student.lastName} {student.firstName}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2.5 py-0.5 bg-blue-100 text-blue-800 text-sm font-medium rounded-full">
                        {student.className}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {genderLabel(student.gender)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(student.birthDate)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function StudentsFallback() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
        <div className="h-64 bg-gray-200 rounded-xl"></div>
      </div>
    </div>
  );
}

export default function StudentsPage() {
  return (
    <Suspense fallback={<StudentsFallback />}>
      <StudentsContent />
    </Suspense>
  );
}
