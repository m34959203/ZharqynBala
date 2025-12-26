'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Spinner, useToast } from '@/components/ui';
import api from '@/lib/api';

interface ChildData {
  firstName: string;
  lastName: string;
  birthDate: string;
  gender: 'MALE' | 'FEMALE';
  grade: string;
}

interface OnboardingWizardProps {
  onComplete: () => void;
  onSkip: () => void;
}

const concernOptions = [
  { id: 'anxiety', label: 'Тревожность', emoji: '😰' },
  { id: 'motivation', label: 'Учёба и мотивация', emoji: '📚' },
  { id: 'social', label: 'Общение со сверстниками', emoji: '👥' },
  { id: 'behavior', label: 'Поведение', emoji: '😤' },
  { id: 'sleep', label: 'Сон и режим', emoji: '💤' },
  { id: 'gadgets', label: 'Гаджеты и экраны', emoji: '📱' },
  { id: 'self_esteem', label: 'Самооценка', emoji: '💪' },
  { id: 'emotions', label: 'Эмоции', emoji: '🎭' },
];

const gradeOptions = [
  '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11',
];

export function OnboardingWizard({ onComplete, onSkip }: OnboardingWizardProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const toast = useToast();

  // Step 1: Child data
  const [childData, setChildData] = useState<ChildData>({
    firstName: '',
    lastName: '',
    birthDate: '',
    gender: 'MALE',
    grade: '',
  });

  // Step 2: Concerns
  const [selectedConcerns, setSelectedConcerns] = useState<string[]>([]);

  const totalSteps = 4;

  const handleAddChild = async () => {
    if (!childData.firstName || !childData.birthDate) {
      toast.error('Заполните обязательные поля');
      return;
    }

    setLoading(true);
    try {
      await api.post('/users/children', {
        firstName: childData.firstName,
        lastName: childData.lastName || undefined,
        birthDate: new Date(childData.birthDate).toISOString(),
        gender: childData.gender,
        grade: childData.grade || undefined,
      });
      toast.success('Ребёнок добавлен!');
      setCurrentStep(2);
    } catch (error: any) {
      toast.error('Ошибка', error.response?.data?.message || 'Не удалось добавить ребёнка');
    } finally {
      setLoading(false);
    }
  };

  const handleConcernToggle = (concernId: string) => {
    setSelectedConcerns((prev) =>
      prev.includes(concernId)
        ? prev.filter((id) => id !== concernId)
        : [...prev, concernId]
    );
  };

  const handleNext = () => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleGoToTests = () => {
    onComplete();
    router.push('/tests');
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0: // Welcome
        return (
          <div className="text-center">
            <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">
              Добро пожаловать в Zharqyn Bala!
            </h2>
            <p className="text-gray-600 mb-2">
              Платформа психологической диагностики детей поможет вам лучше понять вашего ребёнка.
            </p>
            <p className="text-sm text-gray-500">
              Давайте настроим ваш аккаунт за несколько шагов.
            </p>
          </div>
        );

      case 1: // Add child
        return (
          <div>
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                Добавьте профиль ребёнка
              </h2>
              <p className="text-gray-600 text-sm">
                Это поможет нам персонализировать тесты и рекомендации
              </p>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Имя *
                  </label>
                  <input
                    type="text"
                    value={childData.firstName}
                    onChange={(e) => setChildData({ ...childData, firstName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="Алихан"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Фамилия
                  </label>
                  <input
                    type="text"
                    value={childData.lastName}
                    onChange={(e) => setChildData({ ...childData, lastName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="Сагынбаев"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Дата рождения *
                  </label>
                  <input
                    type="date"
                    value={childData.birthDate}
                    onChange={(e) => setChildData({ ...childData, birthDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Класс
                  </label>
                  <select
                    value={childData.grade}
                    onChange={(e) => setChildData({ ...childData, grade: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  >
                    <option value="">Выберите</option>
                    {gradeOptions.map((grade) => (
                      <option key={grade} value={grade}>
                        {grade} класс
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Пол
                </label>
                <div className="flex space-x-4">
                  <button
                    type="button"
                    onClick={() => setChildData({ ...childData, gender: 'MALE' })}
                    className={`flex-1 py-2 px-4 rounded-lg border-2 transition-colors ${
                      childData.gender === 'MALE'
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    👦 Мальчик
                  </button>
                  <button
                    type="button"
                    onClick={() => setChildData({ ...childData, gender: 'FEMALE' })}
                    className={`flex-1 py-2 px-4 rounded-lg border-2 transition-colors ${
                      childData.gender === 'FEMALE'
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    👧 Девочка
                  </button>
                </div>
              </div>
            </div>
          </div>
        );

      case 2: // Select concerns
        return (
          <div>
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                Что вас беспокоит?
              </h2>
              <p className="text-gray-600 text-sm">
                Выберите темы, которые вас интересуют (можно несколько)
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {concernOptions.map((concern) => (
                <button
                  key={concern.id}
                  onClick={() => handleConcernToggle(concern.id)}
                  className={`p-3 rounded-lg border-2 transition-colors text-left ${
                    selectedConcerns.includes(concern.id)
                      ? 'border-indigo-600 bg-indigo-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <span className="text-xl mr-2">{concern.emoji}</span>
                  <span className="text-sm font-medium text-gray-700">
                    {concern.label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        );

      case 3: // Ready
        return (
          <div className="text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">
              Всё готово!
            </h2>
            <p className="text-gray-600 mb-6">
              Теперь вы можете пройти первый тест и получить персонализированные рекомендации с AI-анализом.
            </p>
            <div className="bg-indigo-50 rounded-lg p-4 mb-4">
              <h3 className="font-medium text-indigo-900 mb-2">Рекомендуем начать с:</h3>
              <ul className="text-sm text-indigo-700 space-y-1">
                {selectedConcerns.includes('anxiety') && <li>• Тест на тревожность</li>}
                {selectedConcerns.includes('motivation') && <li>• Диагностика учебной мотивации</li>}
                {selectedConcerns.includes('self_esteem') && <li>• Тест на самооценку</li>}
                {selectedConcerns.includes('emotions') && <li>• Тест эмоционального интеллекта</li>}
                {selectedConcerns.length === 0 && (
                  <li>• Комплексная экспресс-диагностика</li>
                )}
              </ul>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const renderActions = () => {
    switch (currentStep) {
      case 0:
        return (
          <Button onClick={handleNext} size="lg" className="w-full">
            Начать настройку
          </Button>
        );

      case 1:
        return (
          <div className="space-y-3">
            <Button onClick={handleAddChild} size="lg" className="w-full" isLoading={loading}>
              Добавить ребёнка
            </Button>
            <button
              onClick={() => setCurrentStep(2)}
              className="w-full text-sm text-gray-500 hover:text-gray-700"
            >
              Пропустить этот шаг
            </button>
          </div>
        );

      case 2:
        return (
          <Button onClick={handleNext} size="lg" className="w-full">
            Продолжить
          </Button>
        );

      case 3:
        return (
          <div className="space-y-3">
            <Button onClick={handleGoToTests} size="lg" className="w-full">
              Выбрать тест
            </Button>
            <button
              onClick={onComplete}
              className="w-full text-sm text-gray-500 hover:text-gray-700"
            >
              Перейти в кабинет
            </button>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
        {/* Progress */}
        <div className="h-1 bg-gray-200">
          <div
            className="h-full bg-indigo-600 transition-all duration-300"
            style={{ width: `${((currentStep + 1) / totalSteps) * 100}%` }}
          />
        </div>

        <div className="p-6">
          {/* Step indicator */}
          <div className="flex justify-center space-x-2 mb-6">
            {Array.from({ length: totalSteps }).map((_, index) => (
              <div
                key={index}
                className={`w-2.5 h-2.5 rounded-full transition-colors ${
                  index === currentStep
                    ? 'bg-indigo-600'
                    : index < currentStep
                    ? 'bg-indigo-300'
                    : 'bg-gray-200'
                }`}
              />
            ))}
          </div>

          {/* Content */}
          <div className="mb-6">{renderStep()}</div>

          {/* Actions */}
          <div className="space-y-3">
            {renderActions()}
            {currentStep > 0 && currentStep < 3 && (
              <button
                onClick={handleBack}
                className="w-full text-sm text-gray-500 hover:text-gray-700"
              >
                ← Назад
              </button>
            )}
            {currentStep === 0 && (
              <button
                onClick={onSkip}
                className="w-full text-sm text-gray-500 hover:text-gray-700"
              >
                Пропустить настройку
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
