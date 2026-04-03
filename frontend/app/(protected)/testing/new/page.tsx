'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import api from '@/lib/api';
import { useSchool } from '@/lib/useSchool';
import { categoryLabels } from '@/lib/types';

interface TestOption {
  id: string;
  titleRu: string;
  descriptionRu?: string;
  durationMinutes?: number;
  category?: string;
  ageMin?: number;
  ageMax?: number;
}

interface ClassOption {
  id: string;
  grade: number;
  letter: string;
  academicYear: string;
  studentCount: number;
}

function NewTestingContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const preselectedClassId = searchParams.get('classId');

  const { schoolId, loading: schoolLoading, error: schoolError } = useSchool();
  const [tests, setTests] = useState<TestOption[]>([]);
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [selectedTests, setSelectedTests] = useState<string[]>([]);
  const [selectedClasses, setSelectedClasses] = useState<string[]>(
    preselectedClassId ? [preselectedClassId] : []
  );
  const [deadline, setDeadline] = useState('');
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (schoolId) {
      fetchOptions();
    }
  }, [schoolId]);

  const fetchOptions = async () => {
    try {
      const [testsRes, classesRes] = await Promise.allSettled([
        api.get('/tests'),
        api.get(`/schools/${schoolId}/classes`),
      ]);
      if (testsRes.status === 'fulfilled') {
        const data = testsRes.value.data;
        setTests(Array.isArray(data) ? data : data.tests || []);
      }
      if (classesRes.status === 'fulfilled') {
        setClasses(classesRes.value.data || []);
      }
    } catch {
      // non-critical
    }
  };

  const toggleTest = (testId: string) => {
    setSelectedTests((prev) =>
      prev.includes(testId) ? prev.filter((id) => id !== testId) : [...prev, testId]
    );
  };

  const toggleClass = (classId: string) => {
    setSelectedClasses((prev) =>
      prev.includes(classId) ? prev.filter((id) => id !== classId) : [...prev, classId]
    );
  };

  const handleStartTesting = async () => {
    setError('');
    setSubmitting(true);

    try {
      // Create a group test for each test + class combination
      const promises = [];
      for (const testId of selectedTests) {
        for (const classId of selectedClasses) {
          promises.push(
            api.post(`/schools/${schoolId}/group-tests`, {
              testId,
              classId,
              deadline: deadline || undefined,
            })
          );
        }
      }
      await Promise.all(promises);
      router.push('/testing');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Ошибка при создании тестирования');
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
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="p-6 bg-red-50 border border-red-200 rounded-xl text-red-700">{schoolError}</div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <Link href="/testing" className="text-indigo-600 hover:text-indigo-500 text-sm font-medium flex items-center mb-4">
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Назад к тестированию
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">Запуск тестирования</h1>
        <p className="mt-2 text-gray-600">Выберите тесты и классы для проведения диагностики</p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600">
          {error}
        </div>
      )}

      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center">
          <div className={`flex items-center justify-center w-10 h-10 rounded-full ${step >= 1 ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-500'}`}>
            1
          </div>
          <div className={`flex-1 h-1 mx-4 ${step >= 2 ? 'bg-indigo-600' : 'bg-gray-200'}`}></div>
          <div className={`flex items-center justify-center w-10 h-10 rounded-full ${step >= 2 ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-500'}`}>
            2
          </div>
          <div className={`flex-1 h-1 mx-4 ${step >= 3 ? 'bg-indigo-600' : 'bg-gray-200'}`}></div>
          <div className={`flex items-center justify-center w-10 h-10 rounded-full ${step >= 3 ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-500'}`}>
            3
          </div>
        </div>
        <div className="flex justify-between mt-2 text-sm text-gray-500">
          <span>Выбор тестов</span>
          <span>Выбор классов</span>
          <span>Подтверждение</span>
        </div>
      </div>

      {/* Step 1: Select Tests */}
      {step === 1 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Выберите тесты</h2>
          {tests.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl shadow-sm">
              <p className="text-gray-500">Нет доступных тестов в каталоге</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {tests.map((test) => (
                <div
                  key={test.id}
                  onClick={() => toggleTest(test.id)}
                  className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    selectedTests.includes(test.id)
                      ? 'border-indigo-600 bg-indigo-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{test.titleRu}</h3>
                      {test.descriptionRu && (
                        <p className="text-sm text-gray-500 mt-1">{test.descriptionRu}</p>
                      )}
                      <div className="flex items-center mt-2 space-x-3 text-xs text-gray-400">
                        {test.durationMinutes && <span>{test.durationMinutes} мин</span>}
                        {test.category && (
                          <>
                            <span>-</span>
                            <span>{categoryLabels[test.category as keyof typeof categoryLabels]?.ru || test.category}</span>
                          </>
                        )}
                        {test.ageMin && test.ageMax && (
                          <>
                            <span>-</span>
                            <span>{test.ageMin}-{test.ageMax} лет</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                      selectedTests.includes(test.id)
                        ? 'border-indigo-600 bg-indigo-600'
                        : 'border-gray-300'
                    }`}>
                      {selectedTests.includes(test.id) && (
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="mt-6 flex justify-end">
            <button
              onClick={() => setStep(2)}
              disabled={selectedTests.length === 0}
              className="px-6 py-3 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Далее: Выбор классов
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Select Classes */}
      {step === 2 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Выберите классы</h2>
          {classes.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl shadow-sm">
              <p className="text-gray-500 mb-4">Нет классов. Сначала создайте классы.</p>
              <Link href="/classes" className="text-indigo-600 hover:text-indigo-500 font-medium">
                Перейти к классам
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {classes
                .sort((a, b) => a.grade - b.grade || a.letter.localeCompare(b.letter))
                .map((cls) => (
                  <div
                    key={cls.id}
                    onClick={() => toggleClass(cls.id)}
                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all text-center ${
                      selectedClasses.includes(cls.id)
                        ? 'border-indigo-600 bg-indigo-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <h3 className="text-xl font-bold text-gray-900">
                      {cls.grade}-{cls.letter}
                    </h3>
                    <p className="text-sm text-gray-500">{cls.studentCount} учеников</p>
                  </div>
                ))}
            </div>
          )}

          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Дедлайн (необязательно)
            </label>
            <input
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="w-full md:w-64 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="mt-6 flex justify-between">
            <button
              onClick={() => setStep(1)}
              className="px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50"
            >
              Назад
            </button>
            <button
              onClick={() => setStep(3)}
              disabled={selectedClasses.length === 0}
              className="px-6 py-3 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Далее: Подтверждение
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Confirmation */}
      {step === 3 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Подтверждение</h2>
          <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
            <h3 className="font-medium text-gray-900 mb-3">Выбранные тесты ({selectedTests.length})</h3>
            <ul className="space-y-2">
              {tests
                .filter((t) => selectedTests.includes(t.id))
                .map((test) => (
                  <li key={test.id} className="flex items-center text-sm text-gray-600">
                    <svg className="w-4 h-4 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {test.titleRu}
                    {test.durationMinutes ? ` (${test.durationMinutes} мин)` : ''}
                  </li>
                ))}
            </ul>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
            <h3 className="font-medium text-gray-900 mb-3">Выбранные классы ({selectedClasses.length})</h3>
            <div className="flex flex-wrap gap-2">
              {classes
                .filter((c) => selectedClasses.includes(c.id))
                .map((cls) => (
                  <span key={cls.id} className="px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-sm">
                    {cls.grade}-{cls.letter} ({cls.studentCount} уч.)
                  </span>
                ))}
            </div>
          </div>

          {deadline && (
            <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
              <h3 className="font-medium text-gray-900 mb-2">Дедлайн</h3>
              <p className="text-gray-600">
                {new Date(deadline).toLocaleDateString('ru-RU', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </p>
            </div>
          )}

          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6">
            <p className="text-sm text-yellow-800">
              <strong>Внимание:</strong> Будет создано{' '}
              {selectedTests.length * selectedClasses.length} назначений тестов.
              Общее количество участников:{' '}
              {classes
                .filter((c) => selectedClasses.includes(c.id))
                .reduce((sum, c) => sum + c.studentCount, 0)}{' '}
              учеников.
            </p>
          </div>
          <div className="flex justify-between">
            <button
              onClick={() => setStep(2)}
              className="px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50"
            >
              Назад
            </button>
            <button
              onClick={handleStartTesting}
              disabled={submitting}
              className="px-8 py-3 bg-green-600 text-white font-medium rounded-xl hover:bg-green-700 disabled:opacity-50 flex items-center"
            >
              {submitting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Создание...
                </>
              ) : (
                'Запустить тестирование'
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function TestingFallback() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
        <div className="grid grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-gray-200 rounded-xl"></div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function NewTestingPage() {
  return (
    <Suspense fallback={<TestingFallback />}>
      <NewTestingContent />
    </Suspense>
  );
}
