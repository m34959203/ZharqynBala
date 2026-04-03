'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';

type OnboardingStep = 'welcome' | 'child' | 'concerns' | 'complete';

interface ChildForm {
  firstName: string;
  lastName: string;
  birthDate: string;
  gender: 'MALE' | 'FEMALE';
  grade: string;
  schoolName: string;
}

interface User {
  firstName?: string;
  lastName?: string;
  email: string;
}

const concerns = [
  { id: 'ANXIETY', label: 'Тревожность', icon: '😰', description: 'Беспокойство, страхи, волнение' },
  { id: 'MOTIVATION', label: 'Учебная мотивация', icon: '📚', description: 'Нежелание учиться, прокрастинация' },
  { id: 'SELF_ESTEEM', label: 'Самооценка', icon: '💪', description: 'Неуверенность, самокритика' },
  { id: 'ATTENTION', label: 'Внимание', icon: '🎯', description: 'Рассеянность, проблемы с концентрацией' },
  { id: 'EMOTIONS', label: 'Эмоции', icon: '😤', description: 'Частые перепады настроения, вспышки' },
  { id: 'SOCIAL', label: 'Общение', icon: '👥', description: 'Проблемы с друзьями, замкнутость' },
];

export default function OnboardingPage() {
  const router = useRouter();

  const [step, setStep] = useState<OnboardingStep>('welcome');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [user, setUser] = useState<User | null>(null);

  const [childForm, setChildForm] = useState<ChildForm>({
    firstName: '',
    lastName: '',
    birthDate: '',
    gender: 'MALE',
    grade: '',
    schoolName: '',
  });

  const [selectedConcerns, setSelectedConcerns] = useState<string[]>([]);
  const [createdChildId, setCreatedChildId] = useState<string | null>(null);

  const [role, setRole] = useState<string>('PARENT');

  const roleContent: Record<string, { title: string; subtitle: string }> = {
    PARENT: { title: 'Добро пожаловать!', subtitle: 'ZharqynBala поможет вам лучше понять вашего ребёнка' },
    PSYCHOLOGIST: { title: 'Добро пожаловать!', subtitle: 'ZharqynBala — ваша платформа для работы с клиентами' },
    SCHOOL: { title: 'Добро пожаловать!', subtitle: 'ZharqynBala — система мониторинга учащихся вашей школы' },
    ADMIN: { title: 'Панель администратора', subtitle: 'Управление платформой ZharqynBala' },
  };

  // Get user from localStorage (set by layout)
  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        const parsed = JSON.parse(userData);
        setUser(parsed);
        setRole(parsed.role || 'PARENT');
      } catch {
        // Invalid user data, layout will handle redirect
      }
    }
  }, []);

  const handleChildFormChange = (field: keyof ChildForm, value: string) => {
    setChildForm(prev => ({ ...prev, [field]: value }));
    setError('');
  };

  const validateChildForm = (): boolean => {
    if (!childForm.firstName.trim()) {
      setError('Введите имя ребёнка');
      return false;
    }
    if (!childForm.lastName.trim()) {
      setError('Введите фамилию ребёнка');
      return false;
    }
    if (!childForm.birthDate) {
      setError('Укажите дату рождения');
      return false;
    }

    const birthDate = new Date(childForm.birthDate);
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();

    if (age < 5 || age > 18) {
      setError('Возраст ребёнка должен быть от 5 до 18 лет');
      return false;
    }

    return true;
  };

  const createChild = async () => {
    if (!validateChildForm()) return;

    setLoading(true);
    setError('');

    try {
      const response = await api.post('/users/me/children', {
        firstName: childForm.firstName.trim(),
        lastName: childForm.lastName.trim(),
        birthDate: childForm.birthDate,
        gender: childForm.gender,
        grade: childForm.grade || undefined,
        schoolName: childForm.schoolName || undefined,
      });

      setCreatedChildId(response.data.id);
      setStep('concerns');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Ошибка при создании профиля ребёнка');
    } finally {
      setLoading(false);
    }
  };

  const toggleConcern = (concernId: string) => {
    setSelectedConcerns(prev =>
      prev.includes(concernId)
        ? prev.filter(id => id !== concernId)
        : [...prev, concernId]
    );
  };

  const completeOnboarding = async () => {
    setLoading(true);

    try {
      // Save onboarding preferences
      await api.post('/users/me/onboarding', {
        completed: true,
        concerns: selectedConcerns,
        childId: createdChildId,
      }).catch(() => {
        // Endpoint may not exist yet, continue anyway
      });

      // Mark onboarding as complete in localStorage
      localStorage.setItem('onboardingComplete', 'true');

      setStep('complete');
    } catch (err) {
      // Continue even if save fails
      localStorage.setItem('onboardingComplete', 'true');
      setStep('complete');
    } finally {
      setLoading(false);
    }
  };

  const goToTests = () => {
    // Redirect to tests with recommended category
    const recommendedCategory = selectedConcerns[0] || 'ANXIETY';
    router.push(`/tests?category=${recommendedCategory}`);
  };

  const goToDashboard = () => {
    // Mark onboarding as complete to prevent redirect loop
    localStorage.setItem('onboardingComplete', 'true');
    router.push('/dashboard');
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-600">
              Шаг {step === 'welcome' ? 1 : step === 'child' ? 2 : step === 'concerns' ? 3 : 4} из 4
            </span>
            <button
              onClick={goToDashboard}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Пропустить
            </button>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500"
              style={{
                width: step === 'welcome' ? '25%' :
                       step === 'child' ? '50%' :
                       step === 'concerns' ? '75%' : '100%'
              }}
            />
          </div>
        </div>

        {/* Step Content */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* STEP 1: Welcome */}
          {step === 'welcome' && (
            <div className="p-8 text-center">
              <div className="w-24 h-24 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-12 h-12 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>

              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                {roleContent[role]?.title || 'Добро пожаловать'}, {user?.firstName || 'Пользователь'}!
              </h1>

              <p className="text-lg text-gray-600 mb-8 max-w-md mx-auto">
                {roleContent[role]?.subtitle || 'ZharqynBala поможет вам лучше понять вашего ребёнка'}
                {role === 'PARENT' ? ' через научные психологические тесты с AI-анализом.' : '.'}
              </p>

              <div className="grid grid-cols-3 gap-4 mb-8 text-center">
                <div className="p-4">
                  <div className="text-3xl mb-2">🧠</div>
                  <div className="text-sm text-gray-600">Научные тесты</div>
                </div>
                <div className="p-4">
                  <div className="text-3xl mb-2">🤖</div>
                  <div className="text-sm text-gray-600">AI-анализ</div>
                </div>
                <div className="p-4">
                  <div className="text-3xl mb-2">👨‍⚕️</div>
                  <div className="text-sm text-gray-600">Психологи онлайн</div>
                </div>
              </div>

              <button
                onClick={() => setStep('child')}
                className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all"
              >
                Начать настройку
              </button>
            </div>
          )}

          {/* STEP 2: Add Child */}
          {step === 'child' && (
            <div className="p-8">
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Добавьте профиль ребёнка
                </h2>
                <p className="text-gray-600">
                  Это займёт меньше минуты
                </p>
              </div>

              {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  {error}
                </div>
              )}

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Имя *
                    </label>
                    <input
                      type="text"
                      value={childForm.firstName}
                      onChange={(e) => handleChildFormChange('firstName', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 bg-white placeholder:text-gray-500"
                      placeholder="Алихан"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Фамилия *
                    </label>
                    <input
                      type="text"
                      value={childForm.lastName}
                      onChange={(e) => handleChildFormChange('lastName', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 bg-white placeholder:text-gray-500"
                      placeholder="Касымов"
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
                      value={childForm.birthDate}
                      onChange={(e) => handleChildFormChange('birthDate', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Пол
                    </label>
                    <select
                      value={childForm.gender}
                      onChange={(e) => handleChildFormChange('gender', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 bg-white"
                    >
                      <option value="MALE">Мальчик</option>
                      <option value="FEMALE">Девочка</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Класс
                    </label>
                    <select
                      value={childForm.grade}
                      onChange={(e) => handleChildFormChange('grade', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 bg-white"
                    >
                      <option value="">Не указан</option>
                      {[1,2,3,4,5,6,7,8,9,10,11].map(g => (
                        <option key={g} value={g.toString()}>{g} класс</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Школа
                    </label>
                    <input
                      type="text"
                      value={childForm.schoolName}
                      onChange={(e) => handleChildFormChange('schoolName', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 bg-white placeholder:text-gray-500"
                      placeholder="Гимназия №1"
                    />
                  </div>
                </div>
              </div>

              <div className="mt-8 flex space-x-4">
                <button
                  onClick={() => setStep('welcome')}
                  className="flex-1 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Назад
                </button>
                <button
                  onClick={createChild}
                  disabled={loading}
                  className="flex-1 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all disabled:opacity-50"
                >
                  {loading ? 'Сохранение...' : 'Продолжить'}
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Select Concerns */}
          {step === 'concerns' && (
            <div className="p-8">
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Что вас беспокоит?
                </h2>
                <p className="text-gray-600">
                  Выберите темы, которые важны для вас (можно несколько)
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-8">
                {concerns.map((concern) => (
                  <button
                    key={concern.id}
                    onClick={() => toggleConcern(concern.id)}
                    className={`p-4 rounded-xl border-2 text-left transition-all ${
                      selectedConcerns.includes(concern.id)
                        ? 'border-indigo-500 bg-indigo-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <span className="text-2xl">{concern.icon}</span>
                      <div>
                        <div className="font-medium text-gray-900">{concern.label}</div>
                        <div className="text-xs text-gray-500">{concern.description}</div>
                      </div>
                    </div>
                    {selectedConcerns.includes(concern.id) && (
                      <div className="absolute top-2 right-2">
                        <svg className="w-5 h-5 text-indigo-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                  </button>
                ))}
              </div>

              <div className="flex space-x-4">
                <button
                  onClick={() => setStep('child')}
                  className="flex-1 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Назад
                </button>
                <button
                  onClick={completeOnboarding}
                  disabled={loading}
                  className="flex-1 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all disabled:opacity-50"
                >
                  {loading ? 'Завершение...' : 'Завершить настройку'}
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: Complete */}
          {step === 'complete' && (
            <div className="p-8 text-center">
              <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-12 h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>

              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Всё готово!
              </h2>

              <p className="text-gray-600 mb-8">
                Профиль создан. Теперь вы можете пройти первый тест и получить рекомендации.
              </p>

              {selectedConcerns.length > 0 && (
                <div className="bg-indigo-50 rounded-xl p-4 mb-8">
                  <div className="text-sm text-indigo-700 font-medium mb-2">
                    Рекомендуем начать с:
                  </div>
                  <div className="text-indigo-900 font-semibold">
                    {concerns.find(c => c.id === selectedConcerns[0])?.label || 'Тест на тревожность'}
                  </div>
                </div>
              )}

              <div className="space-y-3">
                <button
                  onClick={goToTests}
                  className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all"
                >
                  Пройти первый тест
                </button>
                <button
                  onClick={goToDashboard}
                  className="w-full py-3 border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors"
                >
                  Перейти в личный кабинет
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Disclaimer */}
        <p className="text-center text-xs text-gray-500 mt-6">
          Результаты тестов носят рекомендательный характер и не являются диагнозом.
          При серьёзных проблемах рекомендуем обратиться к специалисту.
        </p>
      </div>
    </div>
  );
}
