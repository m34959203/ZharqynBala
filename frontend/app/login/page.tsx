'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  // SEC-CRIT-001: токен в HttpOnly cookie, со страницы его не видно.
  // Проверяем активность сессии через /auth/me — это единственный
  // надёжный способ узнать «логин ещё валиден».
  useEffect(() => {
    let cancelled = false;
    fetch(`${API_URL}/api/v1/auth/me`, { credentials: 'include' })
      .then(r => {
        if (!cancelled && r.ok) router.push('/dashboard');
      })
      .catch(() => { /* not logged in — оставляем форму */ });
    return () => { cancelled = true; };
  }, [router]);

  // Check for error in URL
  useEffect(() => {
    const errorParam = searchParams.get('error');
    if (errorParam) {
      setError('Ошибка авторизации: ' + errorParam);
    }
  }, [searchParams]);

  const performLogin = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      setError('');

      const response = await fetch(`${API_URL}/api/v1/auth/login`, {
        method: 'POST',
        // SEC-CRIT-001: получаем Set-Cookie с HttpOnly accessToken/refreshToken.
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.message || 'Неверный email или пароль');
        return;
      }

      // Clear stale onboarding-complete flag from previous role.
      // user-объект кешируем в localStorage — это не секрет (имя/роль),
      // токенов тут больше не храним: они в HttpOnly cookie.
      localStorage.removeItem('onboardingComplete');
      localStorage.setItem('user', JSON.stringify(result.user));

      router.push('/dashboard');
    } catch (err: any) {
      console.error('Login error:', err);
      if (err instanceof TypeError && err.message === 'Failed to fetch') {
        setError('Сервер недоступен. Проверьте подключение к интернету.');
      } else {
        setError(err?.response?.data?.message || 'Ошибка входа. Попробуйте позже.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Тестовые учётки (все пароль Admin123!). На прод-запуске убрать,
  // вернуть обычную форму. См. issue #?? «restore production login».
  type TestRole = {
    key: string;
    email: string;
    label: string;
    role: string;
    accent: string;
    description: string;
  };
  const TEST_ROLES: TestRole[] = [
    {
      key: 'parent',
      email: 'parent@test.kz',
      label: 'Айгуль Тестова',
      role: 'Родитель',
      accent: 'from-purple-500 to-violet-500',
      description: '2 ребёнка, 30 тестов, AI-рекомендация активна',
    },
    {
      key: 'psy',
      email: 'psychologist@test.kz',
      label: 'Алия Серикова',
      role: 'Психолог',
      accent: 'from-blue-500 to-indigo-600',
      description: 'Очередь консультаций, расписание, заработок',
    },
    {
      key: 'school',
      email: 'school@test.kz',
      label: 'Школа Тестовая',
      role: 'Школа',
      accent: 'from-emerald-500 to-teal-600',
      description: 'Классы, групповые тесты, риск-мониторинг',
    },
    {
      key: 'admin',
      email: 'admin@zharqynbala.kz',
      label: 'Админ Системы',
      role: 'Администратор',
      accent: 'from-gray-700 to-gray-900',
      description: 'Операционный центр платформы, аналитика',
    },
  ];

  const loginAs = (email: string) => performLogin(email, 'Admin123!');

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="text-4xl font-bold text-gray-900 mb-2">
            Жарқын Бала
          </h2>
          <p className="text-sm text-gray-600">
            Платформа психологической диагностики детей
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="mb-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 border border-amber-200">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              <span className="text-xs font-semibold text-amber-800 uppercase tracking-wider">Тестовый стенд</span>
            </div>
            <h3 className="text-2xl font-semibold text-gray-900 mt-3">
              Войти как
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              Логин/пароль временно отключены. Выберите роль для входа.
            </p>
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <div className="space-y-3">
            {TEST_ROLES.map(r => (
              <button
                key={r.key}
                type="button"
                disabled={isLoading}
                onClick={() => loginAs(r.email)}
                className="w-full group relative overflow-hidden rounded-xl border border-gray-200 hover:border-transparent hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed text-left bg-white"
                aria-label={`Войти как ${r.role}: ${r.label}`}
              >
                <div className="flex items-center gap-4 px-4 py-4 min-h-[72px]">
                  <div
                    className={`shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br ${r.accent} flex items-center justify-center text-white font-bold text-lg shadow-md`}
                  >
                    {r.label.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-900">{r.role}</span>
                      <span className="text-xs text-gray-400">·</span>
                      <span className="text-sm text-gray-600 truncate">{r.label}</span>
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5 truncate">{r.description}</div>
                  </div>
                  <svg className="w-4 h-4 text-gray-400 group-hover:text-gray-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </button>
            ))}
          </div>

          {isLoading && (
            <div className="mt-4 flex items-center justify-center gap-2 text-sm text-gray-500">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600"></div>
              Вход...
            </div>
          )}

          <div className="mt-6 pt-5 border-t border-gray-100">
            <p className="text-xs text-gray-400 text-center">
              На production обычный логин/пароль будет восстановлен.
              Все тестовые учётки используют пароль <code className="font-mono bg-gray-100 px-1.5 py-0.5 rounded text-[10px]">Admin123!</code>
            </p>
          </div>
        </div>

        <p className="text-center text-sm text-gray-500">
          © {new Date().getFullYear()} Жарқын Бала. Все права защищены.
        </p>
      </div>
    </div>
  );
}

function LoginFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Загрузка...</p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginFallback />}>
      <LoginContent />
    </Suspense>
  );
}
