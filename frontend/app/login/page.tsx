'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { signIn } from 'next-auth/react';
import type { LoginRequest } from '@/types/auth';

interface AvailableProviders {
  google: boolean;
  mailru: boolean;
  credentials: boolean;
}

// Component that uses useSearchParams - must be wrapped in Suspense
function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [providers, setProviders] = useState<AvailableProviders>({
    google: false,
    mailru: false,
    credentials: true,
  });

  // Check for OAuth error in URL
  useEffect(() => {
    const errorParam = searchParams.get('error');
    if (errorParam === 'OAuthSignin') {
      setError('Ошибка OAuth авторизации. Провайдер не настроен.');
    } else if (errorParam) {
      setError('Ошибка авторизации: ' + errorParam);
    }
  }, [searchParams]);

  // Fetch available providers
  useEffect(() => {
    console.log('[LoginPage] Fetching providers...');
    fetch('/api/auth/providers')
      .then(res => {
        console.log('[LoginPage] Providers response status:', res.status);
        return res.json();
      })
      .then(data => {
        console.log('[LoginPage] Providers data:', JSON.stringify(data, null, 2));
        // NextAuth returns providers in format { providerId: { id, name, type, ... } }
        // We need to check if each provider exists
        const availableProviders = {
          google: !!data.google,
          mailru: !!data.mailru,
          credentials: !!data.credentials,
        };
        console.log('[LoginPage] Parsed providers:', availableProviders);
        setProviders(availableProviders);
      })
      .catch((err) => {
        console.error('[LoginPage] Failed to fetch providers:', err);
        // Default to credentials only if fetch fails
        setProviders({ google: false, mailru: false, credentials: true });
      });
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginRequest>();

  const onSubmit = async (data: LoginRequest) => {
    console.log('[LoginPage:onSubmit] ========== Login Started ==========');
    console.log('[LoginPage:onSubmit] Email:', data.email);
    console.log('[LoginPage:onSubmit] Has password:', !!data.password);

    try {
      setIsLoading(true);
      setError('');

      console.log('[LoginPage:onSubmit] Calling signIn...');
      const result = await signIn('credentials', {
        redirect: false,
        email: data.email,
        password: data.password,
      });

      console.log('[LoginPage:onSubmit] signIn result:', JSON.stringify(result, null, 2));
      console.log('[LoginPage:onSubmit] Result status:', result?.status);
      console.log('[LoginPage:onSubmit] Result ok:', result?.ok);
      console.log('[LoginPage:onSubmit] Result error:', result?.error);
      console.log('[LoginPage:onSubmit] Result url:', result?.url);

      if (result?.error) {
        console.error('[LoginPage:onSubmit] Login error:', result.error);
        setError(result.error);
      } else if (result?.ok) {
        console.log('[LoginPage:onSubmit] Login successful, redirecting to dashboard...');
        router.push('/dashboard');
      } else {
        console.error('[LoginPage:onSubmit] Unexpected result - no error but not ok');
        setError('Неизвестная ошибка авторизации');
      }
    } catch (err: any) {
      console.error('[LoginPage:onSubmit] ========== EXCEPTION ==========');
      console.error('[LoginPage:onSubmit] Error name:', err.name);
      console.error('[LoginPage:onSubmit] Error message:', err.message);
      console.error('[LoginPage:onSubmit] Error stack:', err.stack);
      setError('Ошибка входа. Проверьте данные.');
    } finally {
      setIsLoading(false);
      console.log('[LoginPage:onSubmit] ========== Login Finished ==========');
    }
  };

  const handleOAuthSignIn = async (provider: 'google' | 'mailru') => {
    try {
      setIsLoading(true);
      setError('');
      await signIn(provider, { callbackUrl: '/dashboard' });
    } catch (err) {
      setError('Ошибка авторизации через ' + provider);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Логотип и заголовок */}
        <div className="text-center">
          <h2 className="text-4xl font-bold text-gray-900 mb-2">
            Жарқын Бала
          </h2>
          <p className="text-sm text-gray-600">
            Платформа психологической диагностики детей
          </p>
        </div>

        {/* Форма входа */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="mb-6">
            <h3 className="text-2xl font-semibold text-gray-900 text-center">
              Вход в систему
            </h3>
            <p className="text-sm text-gray-500 text-center mt-2">
              Введите свои данные для продолжения
            </p>
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* OAuth кнопки - показываем только если провайдеры настроены */}
          {(providers.google || providers.mailru) && (
            <>
              <div className="space-y-3 mb-6">
                {providers.google && (
                  <button
                    type="button"
                    onClick={() => handleOAuthSignIn('google')}
                    disabled={isLoading}
                    className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-gray-300 rounded-lg font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition duration-200"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      />
                    </svg>
                    Войти через Google
                  </button>
                )}

                {providers.mailru && (
                  <button
                    type="button"
                    onClick={() => handleOAuthSignIn('mailru')}
                    disabled={isLoading}
                    className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-gray-300 rounded-lg font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition duration-200"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="12" fill="#005FF9"/>
                      <path d="M16.5 8.5C16.5 6.29086 14.7091 4.5 12.5 4.5C10.2909 4.5 8.5 6.29086 8.5 8.5C8.5 10.7091 10.2909 12.5 12.5 12.5C14.7091 12.5 16.5 10.7091 16.5 8.5Z" fill="white"/>
                      <path d="M12.5 13C9.18629 13 6.5 10.3137 6.5 7C6.5 3.68629 9.18629 1 12.5 1C15.8137 1 18.5 3.68629 18.5 7C18.5 10.3137 15.8137 13 12.5 13ZM12.5 11C14.7091 11 16.5 9.20914 16.5 7C16.5 4.79086 14.7091 3 12.5 3C10.2909 3 8.5 4.79086 8.5 7C8.5 9.20914 10.2909 11 12.5 11Z" fill="white"/>
                      <path d="M17 18.5C17 16.567 14.9853 15 12.5 15C10.0147 15 8 16.567 8 18.5V19H7V18.5C7 16.0147 9.46243 14 12.5 14C15.5376 14 18 16.0147 18 18.5V19H17V18.5Z" fill="white"/>
                      <path d="M19 19.5C19.2761 19.5 19.5 19.2761 19.5 19C19.5 18.7239 19.2761 18.5 19 18.5C18.7239 18.5 18.5 18.7239 18.5 19C18.5 19.2761 18.7239 19.5 19 19.5Z" fill="white"/>
                    </svg>
                    Войти через Mail.ru
                  </button>
                )}
              </div>

              {/* Разделитель */}
              <div className="relative mb-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">
                    Или используйте email
                  </span>
                </div>
              </div>
            </>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                {...register('email', {
                  required: 'Email обязателен',
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: 'Неверный формат email',
                  },
                })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition duration-200"
                placeholder="ivan@example.com"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
              )}
            </div>

            {/* Пароль */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Пароль
              </label>
              <input
                id="password"
                type="password"
                {...register('password', {
                  required: 'Пароль обязателен',
                  minLength: {
                    value: 6,
                    message: 'Пароль должен быть минимум 6 символов',
                  },
                })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition duration-200"
                placeholder="••••••••"
              />
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Забыли пароль */}
            <div className="flex items-center justify-end">
              <Link
                href="/forgot-password"
                className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
              >
                Забыли пароль?
              </Link>
            </div>

            {/* Кнопка входа */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-indigo-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition duration-200 transform hover:scale-[1.02]"
            >
              {isLoading ? 'Вход...' : 'Войти'}
            </button>
          </form>

          {/* Регистрация */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Нет аккаунта?{' '}
              <Link
                href="/register"
                className="font-medium text-indigo-600 hover:text-indigo-500"
              >
                Зарегистрироваться
              </Link>
            </p>
          </div>

          {/* Выбор языка */}
          <div className="mt-6 flex justify-center space-x-4">
            <button className="text-sm text-gray-600 hover:text-gray-900 font-medium">
              Русский
            </button>
            <span className="text-gray-300">|</span>
            <button className="text-sm text-gray-600 hover:text-gray-900 font-medium">
              Қазақша
            </button>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-gray-500">
          © 2025 Жарқын Бала. Все права защищены.
        </p>
      </div>
    </div>
  );
}

// Loading fallback for Suspense
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

// Main page component with Suspense boundary
export default function LoginPage() {
  return (
    <Suspense fallback={<LoginFallback />}>
      <LoginContent />
    </Suspense>
  );
}
