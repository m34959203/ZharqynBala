'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Student {
  id: string;
  firstName: string;
  lastName: string;
}

interface ClassData {
  id: string;
  grade: number;
  letter: string;
  teacherName: string;
  students: Student[];
}

export default function ClassesPage() {
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load data - currently no backend API for school classes
    // Will show empty state until API is implemented
    setLoading(false);
    setClasses([]);
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Классы</h1>
          <p className="mt-2 text-gray-600">Управление классами и учениками</p>
        </div>
      </div>

      {/* Info Banner */}
      <div className="mb-8 p-6 bg-blue-50 border border-blue-200 rounded-xl">
        <div className="flex items-start">
          <svg className="w-6 h-6 text-blue-600 mt-0.5 mr-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <h3 className="text-lg font-medium text-blue-800">Функция в разработке</h3>
            <p className="mt-2 text-blue-700">
              Управление классами и учениками будет доступно в ближайшее время.
              Вы сможете добавлять классы, импортировать списки учеников и проводить групповое тестирование.
            </p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          <span className="ml-3 text-gray-600">Загрузка...</span>
        </div>
      ) : classes.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-12">
          <div className="text-center">
            <svg className="mx-auto h-16 w-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            <h3 className="mt-4 text-xl font-medium text-gray-900">Нет классов</h3>
            <p className="mt-2 text-gray-500 max-w-md mx-auto">
              Когда функция будет доступна, вы сможете добавлять классы и управлять списками учеников.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {classes.map((classData) => (
            <div
              key={classData.id}
              className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-gray-900">
                    {classData.grade}-{classData.letter}
                  </h3>
                </div>

                <p className="text-sm text-gray-500 mb-4">
                  Кл. руководитель: {classData.teacherName}
                </p>

                <div className="flex justify-between text-sm mb-4">
                  <span className="text-gray-500">Учеников</span>
                  <span className="font-medium">{classData.students.length}</span>
                </div>

                <Link
                  href={`/classes/${classData.id}`}
                  className="block text-center px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700"
                >
                  Подробнее
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Back to Dashboard */}
      <div className="mt-8">
        <Link
          href="/dashboard"
          className="inline-flex items-center px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Назад к дашборду
        </Link>
      </div>
    </div>
  );
}
