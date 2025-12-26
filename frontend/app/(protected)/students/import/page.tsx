'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';

interface PreviewStudent {
  row: number;
  firstName: string;
  lastName: string;
  birthDate: string;
  class: string;
  valid: boolean;
  error?: string;
}

export default function ImportStudentsPage() {
  const [file, setFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<PreviewStudent[]>([]);
  const [step, setStep] = useState<'upload' | 'preview' | 'result'>('upload');
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      // Simulate file parsing
      setPreviewData([
        { row: 1, firstName: 'Алихан', lastName: 'Абдуллаев', birthDate: '2013-05-15', class: '5-А', valid: true },
        { row: 2, firstName: 'Айгерим', lastName: 'Байжанова', birthDate: '2013-08-20', class: '5-А', valid: true },
        { row: 3, firstName: 'Ернар', lastName: 'Касымов', birthDate: '2012-03-10', class: '5-А', valid: true },
        { row: 4, firstName: '', lastName: 'Нурланов', birthDate: '2013-11-05', class: '5-А', valid: false, error: 'Отсутствует имя' },
        { row: 5, firstName: 'Камила', lastName: 'Оспанова', birthDate: 'invalid', class: '5-А', valid: false, error: 'Неверный формат даты' },
      ]);
      setStep('preview');
    }
  };

  const handleImport = () => {
    setImporting(true);
    setTimeout(() => {
      setImporting(false);
      setStep('result');
    }, 2000);
  };

  const validCount = previewData.filter(s => s.valid).length;
  const invalidCount = previewData.filter(s => !s.valid).length;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <Link href="/classes" className="text-indigo-600 hover:text-indigo-500 text-sm font-medium flex items-center mb-4">
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Назад к классам
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">Импорт учеников</h1>
        <p className="mt-2 text-gray-600">Загрузите файл Excel для массового добавления учеников</p>
      </div>

      {/* Step: Upload */}
      {step === 'upload' && (
        <div className="bg-white rounded-xl shadow-sm p-8">
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-gray-300 rounded-xl p-12 text-center hover:border-indigo-500 cursor-pointer transition-colors"
          >
            <svg className="mx-auto h-16 w-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <p className="mt-4 text-lg font-medium text-gray-900">Перетащите файл сюда</p>
            <p className="mt-2 text-sm text-gray-500">или нажмите для выбора</p>
            <p className="mt-4 text-xs text-gray-400">Поддерживаемые форматы: .xlsx, .xls, .csv</p>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={handleFileSelect}
            className="hidden"
          />

          {/* Template Download */}
          <div className="mt-8 bg-gray-50 rounded-xl p-6">
            <h3 className="font-medium text-gray-900 mb-2">Шаблон файла</h3>
            <p className="text-sm text-gray-500 mb-4">
              Скачайте шаблон Excel для правильного формата данных
            </p>
            <div className="flex items-center space-x-4">
              <button className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 flex items-center">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Скачать шаблон
              </button>
              <span className="text-sm text-gray-400">template_students.xlsx</span>
            </div>
          </div>

          {/* Instructions */}
          <div className="mt-6">
            <h3 className="font-medium text-gray-900 mb-3">Требования к файлу:</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-start">
                <svg className="w-5 h-5 text-green-500 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Первая строка должна содержать заголовки: Имя, Фамилия, Дата рождения, Класс
              </li>
              <li className="flex items-start">
                <svg className="w-5 h-5 text-green-500 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Дата рождения в формате ДД.ММ.ГГГГ или ГГГГ-ММ-ДД
              </li>
              <li className="flex items-start">
                <svg className="w-5 h-5 text-green-500 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Класс в формате: 5-А, 6-Б и т.д.
              </li>
            </ul>
          </div>
        </div>
      )}

      {/* Step: Preview */}
      {step === 'preview' && (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="p-6 border-b">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Предпросмотр данных</h2>
                <p className="text-sm text-gray-500 mt-1">Файл: {file?.name}</p>
              </div>
              <div className="flex items-center space-x-4">
                <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                  {validCount} корректных
                </span>
                {invalidCount > 0 && (
                  <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium">
                    {invalidCount} с ошибками
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Строка</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Имя</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Фамилия</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Дата рождения</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Класс</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Статус</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {previewData.map((student) => (
                  <tr key={student.row} className={student.valid ? '' : 'bg-red-50'}>
                    <td className="px-4 py-3 text-sm text-gray-500">{student.row}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">{student.firstName || '—'}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">{student.lastName}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">{student.birthDate}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">{student.class}</td>
                    <td className="px-4 py-3">
                      {student.valid ? (
                        <span className="text-green-600 text-sm">✓ OK</span>
                      ) : (
                        <span className="text-red-600 text-sm">{student.error}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="p-6 border-t flex justify-between">
            <button
              onClick={() => { setStep('upload'); setFile(null); setPreviewData([]); }}
              className="px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50"
            >
              Выбрать другой файл
            </button>
            <button
              onClick={handleImport}
              disabled={validCount === 0 || importing}
              className="px-8 py-3 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {importing ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Импортируем...
                </>
              ) : (
                `Импортировать ${validCount} учеников`
              )}
            </button>
          </div>
        </div>
      )}

      {/* Step: Result */}
      {step === 'result' && (
        <div className="bg-white rounded-xl shadow-sm p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Импорт завершён!</h2>
          <p className="text-gray-500 mb-6">
            Успешно добавлено {validCount} учеников
            {invalidCount > 0 && `, пропущено ${invalidCount} записей с ошибками`}
          </p>
          <div className="flex justify-center space-x-4">
            <Link
              href="/classes"
              className="px-6 py-3 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700"
            >
              Перейти к классам
            </Link>
            <button
              onClick={() => { setStep('upload'); setFile(null); setPreviewData([]); }}
              className="px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50"
            >
              Загрузить ещё
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
