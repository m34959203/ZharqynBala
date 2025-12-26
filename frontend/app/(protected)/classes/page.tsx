'use client';

import { useState } from 'react';
import Link from 'next/link';

interface Student {
  id: string;
  name: string;
  tested: boolean;
  lastScore?: number;
}

interface ClassData {
  id: string;
  grade: number;
  letter: string;
  teacherName: string;
  studentsCount: number;
  testedCount: number;
  averageScore: number;
  students: Student[];
}

const mockClasses: ClassData[] = [
  {
    id: '1',
    grade: 5,
    letter: 'А',
    teacherName: 'Алия Касымова',
    studentsCount: 28,
    testedCount: 25,
    averageScore: 78,
    students: [
      { id: '1', name: 'Абдуллаев Алихан', tested: true, lastScore: 82 },
      { id: '2', name: 'Байжанова Айгерим', tested: true, lastScore: 75 },
      { id: '3', name: 'Касымов Ернар', tested: false },
    ],
  },
  {
    id: '2',
    grade: 5,
    letter: 'Б',
    teacherName: 'Марат Жумабаев',
    studentsCount: 30,
    testedCount: 28,
    averageScore: 72,
    students: [],
  },
  {
    id: '3',
    grade: 6,
    letter: 'А',
    teacherName: 'Гульнара Оспанова',
    studentsCount: 26,
    testedCount: 24,
    averageScore: 81,
    students: [],
  },
  {
    id: '4',
    grade: 6,
    letter: 'Б',
    teacherName: 'Динара Сулейменова',
    studentsCount: 27,
    testedCount: 22,
    averageScore: 69,
    students: [],
  },
  {
    id: '5',
    grade: 7,
    letter: 'А',
    teacherName: 'Бауыржан Ахметов',
    studentsCount: 29,
    testedCount: 27,
    averageScore: 75,
    students: [],
  },
];

export default function ClassesPage() {
  const [selectedClass, setSelectedClass] = useState<ClassData | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getCoverageColor = (tested: number, total: number) => {
    const percentage = (tested / total) * 100;
    if (percentage >= 90) return 'bg-green-500';
    if (percentage >= 70) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Классы</h1>
          <p className="mt-2 text-gray-600">Управление классами и учениками</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-6 py-3 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 flex items-center"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Добавить класс
        </button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl shadow-sm p-5">
          <p className="text-sm font-medium text-gray-500">Всего классов</p>
          <p className="text-2xl font-bold text-gray-900">{mockClasses.length}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-5">
          <p className="text-sm font-medium text-gray-500">Всего учеников</p>
          <p className="text-2xl font-bold text-gray-900">
            {mockClasses.reduce((sum, c) => sum + c.studentsCount, 0)}
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-5">
          <p className="text-sm font-medium text-gray-500">Протестировано</p>
          <p className="text-2xl font-bold text-green-600">
            {mockClasses.reduce((sum, c) => sum + c.testedCount, 0)}
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-5">
          <p className="text-sm font-medium text-gray-500">Средний балл</p>
          <p className="text-2xl font-bold text-indigo-600">
            {Math.round(mockClasses.reduce((sum, c) => sum + c.averageScore, 0) / mockClasses.length)}%
          </p>
        </div>
      </div>

      {/* Classes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {mockClasses.map((classData) => (
          <div
            key={classData.id}
            className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow"
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-900">
                  {classData.grade}-{classData.letter}
                </h3>
                <span className={`text-lg font-bold ${getScoreColor(classData.averageScore)}`}>
                  {classData.averageScore}%
                </span>
              </div>

              <p className="text-sm text-gray-500 mb-4">
                Кл. руководитель: {classData.teacherName}
              </p>

              {/* Progress */}
              <div className="mb-4">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-500">Охват тестирования</span>
                  <span className="font-medium">
                    {classData.testedCount}/{classData.studentsCount}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${getCoverageColor(classData.testedCount, classData.studentsCount)}`}
                    style={{ width: `${(classData.testedCount / classData.studentsCount) * 100}%` }}
                  ></div>
                </div>
              </div>

              <div className="flex space-x-2">
                <Link
                  href={`/classes/${classData.id}`}
                  className="flex-1 text-center px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700"
                >
                  Подробнее
                </Link>
                <Link
                  href={`/testing/new?classId=${classData.id}`}
                  className="flex-1 text-center px-4 py-2 border border-indigo-600 text-indigo-600 text-sm font-medium rounded-lg hover:bg-indigo-50"
                >
                  Тестировать
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="mt-8 flex flex-wrap gap-4">
        <Link
          href="/students/import"
          className="px-6 py-3 bg-green-600 text-white font-medium rounded-xl hover:bg-green-700 flex items-center"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
          </svg>
          Импорт из Excel
        </Link>
        <Link
          href="/reports"
          className="px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50 flex items-center"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Скачать отчёты
        </Link>
      </div>
    </div>
  );
}
