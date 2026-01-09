'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { authApi } from '@/lib/api';
import type { RegisterRequest } from '@/types/auth';

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<RegisterRequest & { confirmPassword: string }>({
    defaultValues: {
      role: 'PARENT',
      language: 'RU',
    },
  });

  const selectedRole = watch('role');

  const password = watch('password');

  const onSubmit = async (data: RegisterRequest & { confirmPassword: string }) => {
    try {
      setIsLoading(true);
      setError('');

      // Удаляем confirmPassword перед отправкой
      const { confirmPassword, ...registerData } = data;

      await authApi.register(registerData);
      router.push('/dashboard');
    } catch (err: any) {
      setError(
        err.response?.data?.message || 'Ошибка регистрации. Проверьте данные.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4 sm:px-6 lg:px-8 py-12">
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

        {/* Форма регистрации */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="mb-6">
            <h3 className="text-2xl font-semibold text-gray-900 text-center">
              Регистрация
            </h3>
            <p className="text-sm text-gray-500 text-center mt-2">
              Создайте аккаунт для доступа к платформе
            </p>
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Выбор роли */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Кто вы? *
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label
                  className={`relative flex flex-col items-center p-4 border-2 rounded-xl cursor-pointer transition-all ${
                    selectedRole === 'PARENT'
                      ? 'border-indigo-500 bg-indigo-50'
                      : 'border-gray-200 hover:border-indigo-200'
                  }`}
                >
                  <input
                    type="radio"
                    value="PARENT"
                    {...register('role', { required: 'Выберите роль' })}
                    className="sr-only"
                  />
                  <span className="text-2xl mb-1">👨‍👩‍👧</span>
                  <span className="text-sm font-medium text-gray-900">Родитель</span>
                  <span className="text-xs text-gray-500 text-center mt-1">
                    Для диагностики своих детей
                  </span>
                </label>

                <label
                  className={`relative flex flex-col items-center p-4 border-2 rounded-xl cursor-pointer transition-all ${
                    selectedRole === 'PSYCHOLOGIST'
                      ? 'border-indigo-500 bg-indigo-50'
                      : 'border-gray-200 hover:border-indigo-200'
                  }`}
                >
                  <input
                    type="radio"
                    value="PSYCHOLOGIST"
                    {...register('role', { required: 'Выберите роль' })}
                    className="sr-only"
                  />
                  <span className="text-2xl mb-1">🧠</span>
                  <span className="text-sm font-medium text-gray-900">Психолог</span>
                  <span className="text-xs text-gray-500 text-center mt-1">
                    Для работы с клиентами
                  </span>
                </label>

                <label
                  className={`relative flex flex-col items-center p-4 border-2 rounded-xl cursor-pointer transition-all ${
                    selectedRole === 'SCHOOL'
                      ? 'border-indigo-500 bg-indigo-50'
                      : 'border-gray-200 hover:border-indigo-200'
                  }`}
                >
                  <input
                    type="radio"
                    value="SCHOOL"
                    {...register('role', { required: 'Выберите роль' })}
                    className="sr-only"
                  />
                  <span className="text-2xl mb-1">🏫</span>
                  <span className="text-sm font-medium text-gray-900">Школа</span>
                  <span className="text-xs text-gray-500 text-center mt-1">
                    Для учебных заведений
                  </span>
                </label>
              </div>
              {errors.role && (
                <p className="mt-2 text-sm text-red-600">{errors.role.message}</p>
              )}
            </div>

            {/* Имя и Фамилия в одной строке */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="firstName"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Имя *
                </label>
                <input
                  id="firstName"
                  type="text"
                  {...register('firstName', {
                    required: 'Имя обязательно',
                    minLength: {
                      value: 2,
                      message: 'Минимум 2 символа',
                    },
                  })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition duration-200 text-gray-900 bg-white placeholder:text-gray-500"
                  placeholder="Иван"
                />
                {errors.firstName && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.firstName.message}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="lastName"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Фамилия *
                </label>
                <input
                  id="lastName"
                  type="text"
                  {...register('lastName', {
                    required: 'Фамилия обязательна',
                    minLength: {
                      value: 2,
                      message: 'Минимум 2 символа',
                    },
                  })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition duration-200 text-gray-900 bg-white placeholder:text-gray-500"
                  placeholder="Иванов"
                />
                {errors.lastName && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.lastName.message}
                  </p>
                )}
              </div>
            </div>

            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Email *
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
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition duration-200 text-gray-900 bg-white placeholder:text-gray-500"
                placeholder="ivan@example.com"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
              )}
            </div>

            {/* Телефон */}
            <div>
              <label
                htmlFor="phone"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Телефон
              </label>
              <input
                id="phone"
                type="tel"
                {...register('phone', {
                  pattern: {
                    value: /^\+7\d{10}$/,
                    message: 'Формат: +77771234567',
                  },
                })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition duration-200 text-gray-900 bg-white placeholder:text-gray-500"
                placeholder="+77771234567"
              />
              {errors.phone && (
                <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>
              )}
            </div>

            {/* Пароль */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Пароль *
              </label>
              <input
                id="password"
                type="password"
                {...register('password', {
                  required: 'Пароль обязателен',
                  minLength: {
                    value: 8,
                    message: 'Пароль должен быть минимум 8 символов',
                  },
                  pattern: {
                    value: /^(?=.*[A-Za-z])(?=.*\d)/,
                    message: 'Пароль должен содержать буквы и цифры',
                  },
                })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition duration-200 text-gray-900 bg-white placeholder:text-gray-500"
                placeholder="••••••••"
              />
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.password.message}
                </p>
              )}
              <p className="mt-1 text-xs text-gray-500">
                Минимум 8 символов, буквы и цифры
              </p>
            </div>

            {/* Подтверждение пароля */}
            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Подтвердите пароль *
              </label>
              <input
                id="confirmPassword"
                type="password"
                {...register('confirmPassword', {
                  required: 'Подтверждение пароля обязательно',
                  validate: (value) =>
                    value === password || 'Пароли не совпадают',
                })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition duration-200 text-gray-900 bg-white placeholder:text-gray-500"
                placeholder="••••••••"
              />
              {errors.confirmPassword && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.confirmPassword.message}
                </p>
              )}
            </div>

            {/* Выбор языка */}
            <div>
              <label
                htmlFor="language"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Язык интерфейса
              </label>
              <select
                id="language"
                {...register('language')}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition duration-200 text-gray-900 bg-white placeholder:text-gray-500"
              >
                <option value="RU">Русский</option>
                <option value="KZ">Қазақша</option>
              </select>
            </div>

            {/* Кнопка регистрации */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-indigo-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition duration-200 transform hover:scale-[1.02] mt-6"
            >
              {isLoading ? 'Регистрация...' : 'Зарегистрироваться'}
            </button>
          </form>

          {/* Вход */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Уже есть аккаунт?{' '}
              <Link
                href="/login"
                className="font-medium text-indigo-600 hover:text-indigo-500"
              >
                Войти
              </Link>
            </p>
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
