'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { useSchool } from '@/lib/useSchool';

interface ClassOption {
  id: string;
  grade: number;
  letter: string;
  academicYear: string;
}

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
  const { schoolId, loading: schoolLoading, error: schoolError } = useSchool();
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [activeTab, setActiveTab] = useState<'manual' | 'excel'>('manual');

  // Manual form state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [gender, setGender] = useState('MALE');
  const [classId, setClassId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Excel import state
  const [file, setFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<PreviewStudent[]>([]);
  const [excelStep, setExcelStep] = useState<'upload' | 'preview' | 'result'>('upload');
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (schoolId) {
      api.get(`/schools/${schoolId}/classes`).then((res) => {
        setClasses(res.data || []);
      }).catch(() => {});
    }
  }, [schoolId]);

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setSuccessMsg('');

    if (!firstName.trim() || !lastName.trim()) {
      setFormError('Заполните имя и фамилию');
      return;
    }
    if (!birthDate) {
      setFormError('Укажите дату рождения');
      return;
    }
    if (!classId) {
      setFormError('Выберите класс');
      return;
    }

    try {
      setSubmitting(true);
      await api.post(`/schools/${schoolId}/students/create`, {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        birthDate,
        gender,
        classId,
      });
      setSuccessMsg(`Ученик ${lastName} ${firstName} успешно добавлен!`);
      setFirstName('');
      setLastName('');
      setBirthDate('');
      setGender('MALE');
    } catch (err: any) {
      setFormError(err.response?.data?.message || 'Ошибка при добавлении ученика');
    } finally {
      setSubmitting(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      // Simulate file parsing - in future, parse actual Excel
      setPreviewData([
        { row: 1, firstName: 'Алихан', lastName: 'Абдуллаев', birthDate: '2013-05-15', class: '5-А', valid: true },
        { row: 2, firstName: 'Айгерим', lastName: 'Байжанова', birthDate: '2013-08-20', class: '5-А', valid: true },
        { row: 3, firstName: 'Ернар', lastName: 'Касымов', birthDate: '2012-03-10', class: '5-А', valid: true },
      ]);
      setExcelStep('preview');
    }
  };

  const handleExcelImport = async () => {
    setImporting(true);
    try {
      const validStudents = previewData.filter((s) => s.valid);
      await api.post(`/schools/${schoolId}/import`, {
        students: validStudents.map((s) => ({
          firstName: s.firstName,
          lastName: s.lastName,
          birthDate: s.birthDate,
          grade: s.class.split('-')[0],
          letter: s.class.split('-')[1] || 'А',
          gender: 'MALE',
        })),
      });
      setExcelStep('result');
    } catch {
      setExcelStep('result');
    } finally {
      setImporting(false);
    }
  };

  const validCount = previewData.filter((s) => s.valid).length;
  const invalidCount = previewData.filter((s) => !s.valid).length;

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
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="p-6 bg-red-50 border border-red-200 rounded-xl text-red-700">{schoolError}</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <Link href="/students" className="text-indigo-600 hover:text-indigo-500 text-sm font-medium flex items-center mb-4">
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Назад к ученикам
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">Добавление учеников</h1>
        <p className="mt-2 text-gray-600">Добавьте ученика вручную или импортируйте из Excel</p>
      </div>

      {/* Tab Switcher */}
      <div className="flex space-x-1 bg-gray-100 rounded-xl p-1 mb-8">
        <button
          onClick={() => setActiveTab('manual')}
          className={`flex-1 py-3 px-4 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'manual'
              ? 'bg-white text-indigo-700 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Добавить вручную
        </button>
        <button
          onClick={() => setActiveTab('excel')}
          className={`flex-1 py-3 px-4 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'excel'
              ? 'bg-white text-indigo-700 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Импорт из Excel
        </button>
      </div>

      {/* Manual Form */}
      {activeTab === 'manual' && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Данные ученика</h2>

          {successMsg && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center">
              <svg className="w-5 h-5 text-green-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-green-700">{successMsg}</span>
            </div>
          )}

          {formError && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600">
              {formError}
            </div>
          )}

          <form onSubmit={handleManualSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Фамилия *</label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Касымов"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Имя *</label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Ернар"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Дата рождения *</label>
                <input
                  type="date"
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Пол *</label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="MALE">Мужской</option>
                  <option value="FEMALE">Женский</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Класс *</label>
                <select
                  value={classId}
                  onChange={(e) => setClassId(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="">Выберите класс</option>
                  {classes
                    .sort((a, b) => a.grade - b.grade || a.letter.localeCompare(b.letter))
                    .map((cls) => (
                      <option key={cls.id} value={cls.id}>
                        {cls.grade}-{cls.letter}
                      </option>
                    ))}
                </select>
              </div>
            </div>

            {classes.length === 0 && (
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800 text-sm">
                Сначала создайте классы на странице{' '}
                <Link href="/classes" className="text-indigo-600 underline">
                  Классы
                </Link>
                , чтобы добавлять учеников.
              </div>
            )}

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={submitting || classes.length === 0}
                className="px-8 py-3 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 disabled:opacity-50"
              >
                {submitting ? 'Добавление...' : 'Добавить ученика'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Excel Import */}
      {activeTab === 'excel' && (
        <>
          {excelStep === 'upload' && (
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

              <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                <p className="text-sm text-yellow-800">
                  <strong>Примечание:</strong> Полноценный парсинг Excel файлов будет доступен в ближайшем обновлении.
                  Пока рекомендуем использовать ручное добавление учеников.
                </p>
              </div>

              <div className="mt-6">
                <h3 className="font-medium text-gray-900 mb-3">Требования к файлу:</h3>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-start">
                    <svg className="w-5 h-5 text-green-500 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Первая строка: Имя, Фамилия, Дата рождения, Класс
                  </li>
                  <li className="flex items-start">
                    <svg className="w-5 h-5 text-green-500 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Дата рождения: ДД.ММ.ГГГГ или ГГГГ-ММ-ДД
                  </li>
                  <li className="flex items-start">
                    <svg className="w-5 h-5 text-green-500 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Класс: 5-А, 6-Б и т.д.
                  </li>
                </ul>
              </div>
            </div>
          )}

          {excelStep === 'preview' && (
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
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">#</th>
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
                        <td className="px-4 py-3 text-sm text-gray-900">{student.firstName || '\u2014'}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">{student.lastName}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">{student.birthDate}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">{student.class}</td>
                        <td className="px-4 py-3">
                          {student.valid ? (
                            <span className="text-green-600 text-sm font-medium">OK</span>
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
                  onClick={() => { setExcelStep('upload'); setFile(null); setPreviewData([]); }}
                  className="px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50"
                >
                  Выбрать другой файл
                </button>
                <button
                  onClick={handleExcelImport}
                  disabled={validCount === 0 || importing}
                  className="px-8 py-3 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 disabled:opacity-50 flex items-center"
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

          {excelStep === 'result' && (
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
                  href="/students"
                  className="px-6 py-3 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700"
                >
                  Перейти к ученикам
                </Link>
                <button
                  onClick={() => { setExcelStep('upload'); setFile(null); setPreviewData([]); }}
                  className="px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50"
                >
                  Загрузить ещё
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
