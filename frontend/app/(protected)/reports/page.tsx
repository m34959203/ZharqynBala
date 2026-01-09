'use client';

import { useState } from 'react';
import Link from 'next/link';

interface Report {
  id: string;
  title: string;
  description: string;
  type: 'class' | 'grade' | 'school';
  generatedAt?: string;
}

const reportTypes: Report[] = [
  {
    id: 'class-report',
    title: 'Отчёт по классу',
    description: 'Детальная статистика по отдельному классу с результатами каждого ученика',
    type: 'class',
  },
  {
    id: 'grade-report',
    title: 'Отчёт по параллели',
    description: 'Сравнительный анализ всех классов одной параллели',
    type: 'grade',
  },
  {
    id: 'school-report',
    title: 'Общешкольный отчёт',
    description: 'Полная статистика по всей школе с аналитикой и рекомендациями',
    type: 'school',
  },
];

// Reports will be stored on the server once generation is implemented
const recentReports: { id: string; name: string; date: string; type: string }[] = [];

export default function ReportsPage() {
  const [selectedReport, setSelectedReport] = useState<string | null>(null);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedGrade, setSelectedGrade] = useState('');
  const [format, setFormat] = useState<'pdf' | 'excel'>('pdf');

  const handleGenerateReport = () => {
    alert(`Отчёт генерируется...\nТип: ${selectedReport}\nФормат: ${format.toUpperCase()}`);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Отчёты</h1>
        <p className="mt-2 text-gray-600">Генерация и скачивание отчётов по диагностике</p>
      </div>

      {/* Report Types */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {reportTypes.map((report) => (
          <div
            key={report.id}
            onClick={() => setSelectedReport(report.id)}
            className={`p-6 rounded-xl border-2 cursor-pointer transition-all ${
              selectedReport === report.id
                ? 'border-indigo-600 bg-indigo-50'
                : 'border-gray-200 hover:border-gray-300 bg-white'
            }`}
          >
            <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-4">
              {report.type === 'class' && (
                <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              )}
              {report.type === 'grade' && (
                <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              )}
              {report.type === 'school' && (
                <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              )}
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">{report.title}</h3>
            <p className="text-sm text-gray-500">{report.description}</p>
          </div>
        ))}
      </div>

      {/* Report Options */}
      {selectedReport && (
        <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Параметры отчёта</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {selectedReport === 'class-report' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Выберите класс</label>
                <select
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Выберите...</option>
                  <option value="5a">5-А</option>
                  <option value="5b">5-Б</option>
                  <option value="6a">6-А</option>
                  <option value="6b">6-Б</option>
                  <option value="7a">7-А</option>
                </select>
              </div>
            )}

            {selectedReport === 'grade-report' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Выберите параллель</label>
                <select
                  value={selectedGrade}
                  onChange={(e) => setSelectedGrade(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Выберите...</option>
                  <option value="5">5 классы</option>
                  <option value="6">6 классы</option>
                  <option value="7">7 классы</option>
                </select>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Формат</label>
              <div className="flex space-x-4">
                <button
                  onClick={() => setFormat('pdf')}
                  className={`flex-1 p-3 rounded-lg border-2 font-medium ${
                    format === 'pdf'
                      ? 'border-red-500 bg-red-50 text-red-700'
                      : 'border-gray-200 text-gray-700'
                  }`}
                >
                  PDF
                </button>
                <button
                  onClick={() => setFormat('excel')}
                  className={`flex-1 p-3 rounded-lg border-2 font-medium ${
                    format === 'excel'
                      ? 'border-green-500 bg-green-50 text-green-700'
                      : 'border-gray-200 text-gray-700'
                  }`}
                >
                  Excel
                </button>
              </div>
            </div>
          </div>

          <button
            onClick={handleGenerateReport}
            className="mt-6 w-full md:w-auto px-8 py-3 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700"
          >
            Сгенерировать отчёт
          </button>
        </div>
      )}

      {/* Recent Reports */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Последние отчёты</h2>
        {recentReports.length === 0 ? (
          <div className="py-8 text-center">
            <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-gray-500">Нет сгенерированных отчётов</p>
            <p className="text-sm text-gray-400 mt-1">Сгенерированные отчёты будут отображаться здесь</p>
          </div>
        ) : (
          <div className="divide-y">
            {recentReports.map((report) => (
              <div key={report.id} className="py-4 flex items-center justify-between">
                <div className="flex items-center">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    report.type === 'PDF' ? 'bg-red-100' : 'bg-green-100'
                  }`}>
                    <span className={`text-xs font-bold ${
                      report.type === 'PDF' ? 'text-red-600' : 'text-green-600'
                    }`}>
                      {report.type}
                    </span>
                  </div>
                  <div className="ml-4">
                    <p className="font-medium text-gray-900">{report.name}</p>
                    <p className="text-sm text-gray-500">{new Date(report.date).toLocaleDateString('ru-RU')}</p>
                  </div>
                </div>
                <button className="px-4 py-2 text-indigo-600 hover:text-indigo-500 font-medium text-sm">
                  Скачать
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
