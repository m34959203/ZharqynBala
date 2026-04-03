'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';

interface Child {
  id: string;
  firstName: string;
  lastName: string;
  birthDate: string;
  gender: 'MALE' | 'FEMALE';
  lastTestDate?: string;
  averageScore?: number;
}

interface RecentResult {
  id: string;
  testTitle: string;
  childName: string;
  createdAt: string;
  percentage: number;
}

interface ParentDashboardProps {
  userName: string;
}

export default function ParentDashboard({ userName }: ParentDashboardProps) {
  const router = useRouter();
  const [children, setChildren] = useState<Child[]>([]);
  const [recentResults, setRecentResults] = useState<RecentResult[]>([]);
  const [totalTests, setTotalTests] = useState(0);
  const [loading, setLoading] = useState(true);
  const [checkingOnboarding, setCheckingOnboarding] = useState(true);

  // Check if user needs onboarding
  useEffect(() => {
    const checkOnboarding = async () => {
      // Skip if already completed (stored in localStorage)
      const onboardingComplete = localStorage.getItem('onboardingComplete');
      if (onboardingComplete === 'true') {
        setCheckingOnboarding(false);
        return;
      }

      try {
        // Check if user has any children
        const response = await api.get('/users/me/children');
        const userChildren = response.data || [];

        if (userChildren.length === 0) {
          // No children - redirect to onboarding
          router.push('/onboarding');
          return;
        }

        // Has children - mark as complete
        localStorage.setItem('onboardingComplete', 'true');
        setChildren(userChildren);
      } catch (error) {
        // If API fails, check localStorage or redirect
        console.error('Failed to check onboarding:', error);
      } finally {
        setCheckingOnboarding(false);
      }
    };

    checkOnboarding();
  }, [router]);

  useEffect(() => {
    if (checkingOnboarding) return;

    const fetchData = async () => {
      try {
        const [childrenRes, resultsRes] = await Promise.all([
          api.get('/users/me/children').catch(() => null),
          api.get('/results?limit=5').catch(() => null),
        ]);

        if (childrenRes?.data) {
          setChildren(childrenRes.data || []);
        }

        if (resultsRes?.data) {
          setRecentResults(resultsRes.data.results || []);
          setTotalTests(resultsRes.data.total || 0);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [checkingOnboarding]);

  const getAge = (birthDate: string) => {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const avgScore = recentResults.length > 0
    ? Math.round(recentResults.reduce((a, b) => a + (b.percentage || 0), 0) / recentResults.length)
    : 0;

  // Show loading while checking onboarding
  if (checkingOnboarding) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Загрузка...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Welcome Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          Добро пожаловать, {userName}!
        </h1>
        <p className="mt-1 text-gray-500">
          Вот обзор активности ваших детей.
        </p>
      </div>

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl p-5 shadow-sm border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-gray-500">Детей</p>
              <p className="text-2xl font-bold text-gray-900">{children.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 shadow-sm border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-gray-500">Пройдено тестов</p>
              <p className="text-2xl font-bold text-gray-900">{totalTests}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 shadow-sm border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
              <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-gray-500">Средний балл</p>
              <p className="text-2xl font-bold text-gray-900">
                {recentResults.length > 0 ? `${avgScore}%` : '\u2014'}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 shadow-sm border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
              <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-gray-500">Консультации</p>
              <p className="text-2xl font-bold text-gray-900">0</p>
            </div>
          </div>
        </div>
      </div>

      {/* Two-column: Children + Recent Results */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Child Cards */}
        {loading ? (
          <div className="bg-white rounded-xl p-6 shadow-sm border flex justify-center items-center min-h-[200px]">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-600"></div>
          </div>
        ) : children.length > 0 ? (
          <>
            {children.map((child) => {
              const childScore = child.averageScore !== undefined ? child.averageScore : 0;
              const age = getAge(child.birthDate);
              return (
                <div key={child.id} className="bg-white rounded-xl p-6 shadow-sm border">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-pink-100 flex items-center justify-center text-2xl">
                      {child.gender === 'FEMALE' ? '\uD83D\uDC67' : '\uD83D\uDC66'}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{child.firstName} {child.lastName}</h3>
                      <p className="text-sm text-gray-500">{age} лет</p>
                    </div>
                  </div>
                  <div className="mt-4">
                    <div className="flex justify-between items-center mb-1">
                      <p className="text-sm text-gray-500">Прогресс тестирования</p>
                      <p className="text-sm font-medium text-gray-700">{childScore}%</p>
                    </div>
                    <div className="w-full h-2 bg-gray-100 rounded-full">
                      <div className="h-2 bg-purple-600 rounded-full transition-all" style={{ width: `${childScore}%` }} />
                    </div>
                  </div>
                  <div className="flex gap-3 mt-4">
                    <Link
                      href={`/tests?childId=${child.id}`}
                      className="px-4 py-2 bg-purple-600 text-white rounded-full text-sm font-medium hover:bg-purple-700 transition-colors"
                    >
                      Пройти тест
                    </Link>
                    <Link
                      href={`/results?childId=${child.id}`}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-full text-sm font-medium hover:bg-gray-50 transition-colors"
                    >
                      Результаты
                    </Link>
                  </div>
                </div>
              );
            })}
          </>
        ) : (
          <div className="bg-white rounded-xl p-6 shadow-sm border text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Добавьте ребёнка</h3>
            <p className="text-gray-500 mb-4">Начните с добавления профиля вашего ребёнка</p>
            <Link
              href="/children"
              className="inline-flex items-center px-5 py-2 bg-purple-600 text-white font-medium rounded-full hover:bg-purple-700 transition-colors"
            >
              Добавить ребёнка
            </Link>
          </div>
        )}

        {/* Recent Results */}
        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Последние результаты</h3>
            <Link href="/results" className="text-sm text-purple-600 hover:text-purple-500 font-medium">
              Все
            </Link>
          </div>

          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
            </div>
          ) : recentResults.length > 0 ? (
            <div className="space-y-3">
              {recentResults.slice(0, 4).map((result) => {
                const pct = typeof result.percentage === 'number' ? result.percentage : 0;
                return (
                  <div key={result.id} className="flex items-center justify-between">
                    <span className="text-sm text-gray-700 truncate flex-1">{result.testTitle || 'Тест'}</span>
                    <div className="flex items-center gap-3 ml-4">
                      <div className="w-24 h-2 bg-gray-100 rounded-full">
                        <div className="h-2 bg-purple-600 rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-sm font-medium text-gray-900 w-10 text-right">{pct}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-6">
              <p className="text-sm text-gray-500">Пока нет результатов</p>
            </div>
          )}
        </div>
      </div>

      {/* AI Recommendation */}
      <div className="bg-gradient-to-r from-purple-600 to-purple-500 rounded-xl p-6 text-white">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
            <span className="text-lg">{'\uD83E\uDD16'}</span>
          </div>
          <div>
            <h3 className="font-semibold text-lg mb-1">AI Рекомендация</h3>
            <p className="text-white/90 text-sm mb-4">
              {children.length > 0
                ? `Основываясь на последних результатах, мы рекомендуем ${children[0]?.firstName} пройти тест "Развитие навыков общения" для углублённой оценки.`
                : 'Добавьте профиль ребёнка, чтобы получить персонализированные рекомендации.'}
            </p>
            {children.length > 0 && (
              <Link
                href="/tests"
                className="inline-flex px-5 py-2 bg-white text-purple-600 rounded-full text-sm font-semibold hover:bg-purple-50 transition-colors"
              >
                Пройти тест сейчас
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
