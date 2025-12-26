'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

interface TestOption {
  id: string;
  title: string;
  description: string;
  duration: number;
  category: string;
  ageRange: string;
}

const availableTests: TestOption[] = [
  {
    id: 'test-anxiety-1',
    title: 'Тест на тревожность',
    description: 'Диагностика уровня тревожности у детей и подростков',
    duration: 15,
    category: 'Эмоциональное здоровье',
    ageRange: '10-17 лет',
  },
  {
    id: 'test-motivation-1',
    title: 'Школьная мотивация',
    description: 'Оценка учебной мотивации школьника',
    duration: 10,
    category: 'Учебная деятельность',
    ageRange: '10-17 лет',
  },
  {
    id: 'test-selfesteem-1',
    title: 'Самооценка',
    description: 'Диагностика уровня самооценки подростка',
    duration: 12,
    category: 'Личностное развитие',
    ageRange: '12-17 лет',
  },
  {
    id: 'test-attention-1',
    title: 'Внимание и концентрация',
    description: 'Оценка способности к концентрации',
    duration: 20,
    category: 'Когнитивное развитие',
    ageRange: '8-15 лет',
  },
  {
    id: 'test-emotions-1',
    title: 'Эмоциональный интеллект',
    description: 'Оценка способности понимать и управлять эмоциями',
    duration: 15,
    category: 'Эмоциональное здоровье',
    ageRange: '10-17 лет',
  },
  {
    id: 'test-social-1',
    title: 'Социальные навыки',
    description: 'Оценка навыков социального взаимодействия',
    duration: 15,
    category: 'Социальное развитие',
    ageRange: '8-16 лет',
  },
];

const classes = [
  { id: '1', name: '5-А', students: 28 },
  { id: '2', name: '5-Б', students: 30 },
  { id: '3', name: '6-А', students: 26 },
  { id: '4', name: '6-Б', students: 27 },
  { id: '5', name: '7-А', students: 29 },
];

export default function NewTestingPage() {
  const searchParams = useSearchParams();
  const preselectedClassId = searchParams.get('classId');

  const [selectedTests, setSelectedTests] = useState<string[]>([]);
  const [selectedClasses, setSelectedClasses] = useState<string[]>(
    preselectedClassId ? [preselectedClassId] : []
  );
  const [step, setStep] = useState(1);

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

  const handleStartTesting = () => {
    alert(`Тестирование запущено!\nТесты: ${selectedTests.length}\nКлассы: ${selectedClasses.length}`);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <Link href="/dashboard" className="text-indigo-600 hover:text-indigo-500 text-sm font-medium flex items-center mb-4">
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Назад к дашборду
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">Запуск тестирования</h1>
        <p className="mt-2 text-gray-600">Выберите тесты и классы для проведения диагностики</p>
      </div>

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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {availableTests.map((test) => (
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
                    <h3 className="font-semibold text-gray-900">{test.title}</h3>
                    <p className="text-sm text-gray-500 mt-1">{test.description}</p>
                    <div className="flex items-center mt-2 space-x-3 text-xs text-gray-400">
                      <span>{test.duration} мин</span>
                      <span>•</span>
                      <span>{test.ageRange}</span>
                      <span>•</span>
                      <span>{test.category}</span>
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
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {classes.map((cls) => (
              <div
                key={cls.id}
                onClick={() => toggleClass(cls.id)}
                className={`p-4 rounded-xl border-2 cursor-pointer transition-all text-center ${
                  selectedClasses.includes(cls.id)
                    ? 'border-indigo-600 bg-indigo-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <h3 className="text-xl font-bold text-gray-900">{cls.name}</h3>
                <p className="text-sm text-gray-500">{cls.students} учеников</p>
              </div>
            ))}
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
              {availableTests.filter(t => selectedTests.includes(t.id)).map(test => (
                <li key={test.id} className="flex items-center text-sm text-gray-600">
                  <svg className="w-4 h-4 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  {test.title} ({test.duration} мин)
                </li>
              ))}
            </ul>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
            <h3 className="font-medium text-gray-900 mb-3">Выбранные классы ({selectedClasses.length})</h3>
            <div className="flex flex-wrap gap-2">
              {classes.filter(c => selectedClasses.includes(c.id)).map(cls => (
                <span key={cls.id} className="px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-sm">
                  {cls.name} ({cls.students} уч.)
                </span>
              ))}
            </div>
          </div>
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6">
            <p className="text-sm text-yellow-800">
              <strong>Внимание:</strong> После запуска тестирования учителя и ученики получат уведомления.
              Общее количество участников: {classes.filter(c => selectedClasses.includes(c.id)).reduce((sum, c) => sum + c.students, 0)} учеников.
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
              className="px-8 py-3 bg-green-600 text-white font-medium rounded-xl hover:bg-green-700"
            >
              Запустить тестирование
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
