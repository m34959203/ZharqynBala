'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api, { parentsApi, type ParentOverviewDto } from '@/lib/api';
import { plural, pluralW, W } from '@/lib/i18n/plural';

interface ParentDashboardProps {
  userName: string;
}

const fmt = (n: number) => n.toLocaleString('ru-RU').replace(/,/g, ' ');
const signed = (n: number, suffix = '') =>
  n === 0 ? null : `${n > 0 ? '+' : ''}${fmt(n)}${suffix ? ' ' + suffix : ''}`;

const MONTHS_RU_PREP = [
  'январе', 'феврале', 'марте', 'апреле', 'мае', 'июне',
  'июле', 'августе', 'сентябре', 'октябре', 'ноябре', 'декабре',
];

const formatRelativeJoin = (iso: string): string => {
  const d = new Date(iso);
  const now = new Date();
  const yearsAgo = now.getFullYear() - d.getFullYear();
  if (yearsAgo > 1) return d.toLocaleDateString('ru-RU');
  return `${MONTHS_RU_PREP[d.getMonth()]} ${d.getFullYear()}`;
};

const formatConsultDate = (iso: string): string => {
  const d = new Date(iso);
  const days = ['воскресенье', 'понедельник', 'вторник', 'среду', 'четверг', 'пятницу', 'субботу'];
  const months = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
  return `${days[d.getDay()]}, ${d.getDate()} ${months[d.getMonth()]} в ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};

// Plural helpers вынесены в @/lib/i18n/plural — здесь только импорт

const toneStyle: Record<string, string> = {
  'tone-warm': 'linear-gradient(135deg, #FFB36B 0%, #FF7BB5 100%)',
  'tone-sky':  'linear-gradient(135deg, #6BC8FF 0%, #6D4AFF 100%)',
  'tone-mint': 'linear-gradient(135deg, #6BE0B5 0%, #6BC8FF 100%)',
  'tone-rose': 'linear-gradient(135deg, #FF8FB1 0%, #B66BFF 100%)',
  'tone-sun':  'linear-gradient(135deg, #FFD56B 0%, #FF8F6B 100%)',
};

const riskBadge = (zone: 'GREEN' | 'YELLOW' | 'RED'): { bg: string; fg: string; label: string } => {
  if (zone === 'RED')    return { bg: '#FEF3F2', fg: '#B42318', label: 'Красная' };
  if (zone === 'YELLOW') return { bg: '#FFFAEB', fg: '#B54708', label: 'Жёлтая' };
  return { bg: '#ECFDF3', fg: '#027A48', label: 'Норма' };
};

export default function ParentDashboard({ userName }: ParentDashboardProps) {
  const router = useRouter();
  const [overview, setOverview] = useState<ParentOverviewDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [checkingOnboarding, setCheckingOnboarding] = useState(true);

  // Onboarding gate — same as before
  useEffect(() => {
    (async () => {
      const onboardingComplete = localStorage.getItem('onboardingComplete');
      if (onboardingComplete === 'true') {
        setCheckingOnboarding(false);
        return;
      }
      try {
        const response = await api.get('/users/me/children');
        const userChildren = response.data || [];
        if (userChildren.length === 0) {
          router.push('/onboarding');
          return;
        }
        localStorage.setItem('onboardingComplete', 'true');
      } catch {
        // continue regardless
      } finally {
        setCheckingOnboarding(false);
      }
    })();
  }, [router]);

  const fetchOverview = () => {
    setLoading(true);
    setError(false);
    parentsApi.getOverview()
      .then(setOverview)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (checkingOnboarding) return;
    fetchOverview();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checkingOnboarding]);

  if (checkingOnboarding || loading) {
    return <ParentDashboardSkeleton />;
  }

  if (error || !overview) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-sm p-8 max-w-md w-full text-center">
          <h3 className="font-semibold text-lg mb-2" style={{ fontFamily: 'Manrope, Inter, sans-serif' }}>
            Не удалось загрузить ваш кабинет
          </h3>
          <p className="text-sm text-gray-500 mb-4">
            Проверьте интернет и попробуйте снова. Если повторится, напишите в поддержку.
          </p>
          <div className="flex gap-2 justify-center">
            <button
              type="button"
              onClick={fetchOverview}
              className="px-5 py-2 bg-purple-600 text-white rounded-full text-sm font-semibold hover:bg-purple-700 min-h-[44px]"
            >
              Повторить
            </button>
            <a
              href="mailto:support@zharqynbala.kz"
              className="px-5 py-2 text-gray-700 rounded-full text-sm font-medium hover:bg-gray-100 min-h-[44px] inline-flex items-center"
            >
              Связаться с поддержкой
            </a>
          </div>
        </div>
      </div>
    );
  }

  const { children, totals, recentResults, attentionZone, aiRecommendation, upcomingConsultation } = overview;

  // Empty state — no children
  if (!children.length) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 px-4 py-12 flex items-center justify-center">
        <div className="bg-white/80 backdrop-blur rounded-2xl p-8 shadow-sm max-w-md w-full text-center">
          <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 4v16m8-8H4" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Добавьте ребёнка, чтобы начать</h2>
          <p className="text-sm text-gray-500 mb-6">
            Платформа подберёт подходящие методики по возрасту и поможет с интерпретацией.
          </p>
          <Link
            href="/children"
            className="inline-flex items-center px-5 py-2 bg-purple-600 text-white rounded-full text-sm font-semibold hover:bg-purple-700 min-h-[44px]"
          >
            Добавить ребёнка
          </Link>
          <p className="text-xs text-gray-400 mt-3">Это бесплатно, без подписки.</p>
        </div>
      </div>
    );
  }

  const manyChildren = children.length >= 4;
  // Threshold for AI rec readiness (kept in sync with backend rule_v1 fallback)
  const AI_THRESHOLD = 3;
  const testsToThreshold = Math.max(0, AI_THRESHOLD - totals.testsPassed);
  const showDeltaTests = totals.testsPassed >= 5;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {/* Welcome Header */}
        <div className="mb-6">
          <h1
            className="text-2xl font-bold text-gray-900"
            style={{ fontFamily: 'Manrope, Inter, sans-serif' }}
          >
            Добро пожаловать, {userName}!
          </h1>
          <p className="mt-0.5 text-sm text-gray-400">
            Вот обзор активности ваших детей.
          </p>
        </div>

        {/* 4 Stat pills */}
        <div className="flex flex-wrap gap-3 mb-8">
          <StatPill
            iconBg="bg-blue-100" iconColor="text-blue-600"
            label="Детей" value={fmt(totals.childrenCount)}
            icon="users"
          />
          <StatPill
            iconBg="bg-green-100" iconColor="text-green-600"
            label="Пройдено тестов" value={fmt(totals.testsPassed)}
            delta={showDeltaTests ? signed(totals.testsPassedDeltaMonth, 'за месяц') : null}
            icon="check"
          />
          <StatPill
            iconBg="bg-purple-100" iconColor="text-purple-600"
            label="Средний балл"
            value={totals.avgScore !== null ? `${totals.avgScore}%` : '—'}
            delta={totals.avgScore !== null && totals.avgScoreDeltaMonth !== null
              ? signed(totals.avgScoreDeltaMonth, plural(Math.abs(totals.avgScoreDeltaMonth), ...W.point))
              : null}
            meta={totals.avgScore === null ? 'Появится после первого теста' : null}
            icon="chart"
          />
          {totals.consultationsTotal > 0 ? (
            <StatPill
              iconBg="bg-amber-100" iconColor="text-amber-600"
              label="Консультации" value={fmt(totals.consultationsTotal)}
              meta={totals.consultationsThisMonth > 0
                ? `${totals.consultationsThisMonth} в этом мес.`
                : null}
              icon="chat"
            />
          ) : (
            <Link
              href="/psychologists"
              className="flex items-center gap-2.5 bg-white/80 backdrop-blur rounded-2xl px-5 py-3 shadow-sm hover:bg-white transition min-h-[44px]"
            >
              <div className="w-9 h-9 rounded-full bg-amber-100 flex items-center justify-center">
                <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
              </div>
              <div>
                <p className="text-[11px] text-gray-400 leading-tight">Консультации</p>
                <p className="text-sm font-semibold text-purple-600 leading-tight mt-0.5">Записаться</p>
              </div>
            </Link>
          )}
        </div>

        {/* Upcoming consultation banner */}
        {upcomingConsultation && (
          <Link
            href="/consultations"
            className="block mb-6 rounded-2xl p-5 bg-white/80 backdrop-blur shadow-sm border border-purple-100 hover:border-purple-300 transition"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #6D4AFF 0%, #B66BFF 100%)' }}>
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="flex-1">
                <div className="text-xs uppercase tracking-wider text-purple-600 font-semibold mb-1">
                  Ближайшая консультация
                </div>
                <div className="text-base font-bold text-gray-900">
                  {upcomingConsultation.psychologist.fullName} · {formatConsultDate(upcomingConsultation.startsAt)}
                </div>
                {upcomingConsultation.topic && (
                  <div className="text-sm text-gray-500 mt-0.5">{upcomingConsultation.topic}</div>
                )}
              </div>
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </Link>
        )}

        {/* Children + Recent Results row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-8">
          {/* Children section */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2
                className="text-lg font-semibold text-gray-900"
                style={{ fontFamily: 'Manrope, Inter, sans-serif' }}
              >
                Мои дети
              </h2>
              <div className="flex items-center gap-2">
                {manyChildren && (
                  <Link href="/children" className="text-xs font-semibold text-purple-600 hover:text-purple-700">
                    Все {children.length}
                  </Link>
                )}
                <Link
                  href="/children/new"
                  className="inline-flex items-center gap-1 text-xs font-medium text-gray-600 px-3 py-1.5 rounded-full border border-gray-200 hover:border-purple-300 hover:text-purple-600 transition min-h-[32px]"
                  aria-label="Добавить ребёнка"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14M5 12h14" />
                  </svg>
                  Добавить
                </Link>
              </div>
            </div>
            <div
              className={
                manyChildren
                  ? 'flex gap-4 overflow-x-auto snap-x snap-mandatory pb-2 -mx-1 px-1'
                  : 'space-y-4'
              }
              style={manyChildren ? { scrollbarWidth: 'thin' } : undefined}
            >
            {children.map(child => (
              <div
                key={child.id}
                className={
                  manyChildren
                    ? 'bg-white/80 backdrop-blur rounded-2xl p-6 shadow-sm snap-center shrink-0 w-[320px]'
                    : 'bg-white/80 backdrop-blur rounded-2xl p-6 shadow-sm'
                }
              >
                <div className="flex items-center gap-4">
                  <div
                    className="w-14 h-14 rounded-full flex items-center justify-center text-white font-bold text-lg"
                    style={{ background: toneStyle[child.avatarTone] ?? toneStyle['tone-sky'] }}
                  >
                    {child.firstName[0]}{child.lastName[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3
                      className="text-lg font-semibold text-gray-900"
                      style={{ fontFamily: 'Manrope, Inter, sans-serif' }}
                    >
                      {child.firstName} {child.lastName}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {pluralW(W.year, child.ageYears)}
                      {child.gradeLevel !== null && ` · ${child.gradeLevel} класс`}
                      {` · в системе с ${formatRelativeJoin(child.joinedAt)}`}
                    </p>
                  </div>
                </div>
                <div className="mt-4">
                  <div className="flex justify-between items-center mb-1">
                    <p className="text-sm text-gray-500">Программа диагностики</p>
                    <p className="text-sm font-medium text-gray-700">{child.progressPct}%</p>
                  </div>
                  <div className="w-full h-2 bg-gray-100 rounded-full">
                    <div
                      className="h-2 rounded-full transition-all"
                      style={{
                        width: `${child.progressPct}%`,
                        background: 'linear-gradient(90deg, #8A6BFF 0%, #B66BFF 100%)',
                      }}
                    />
                  </div>
                  {child.testsInProgress > 0 && (
                    <p className="text-xs text-purple-600 font-medium mt-2">
                      У {child.firstName} {pluralW(W.testInProgress, child.testsInProgress)}
                    </p>
                  )}
                </div>
                <div className="flex gap-2 mt-4 flex-wrap">
                  <Link
                    href={`/tests?childId=${child.id}`}
                    className="px-4 py-2 bg-purple-600 text-white rounded-full text-sm font-medium hover:bg-purple-700 transition-colors min-h-[44px] inline-flex items-center"
                  >
                    Назначить тест
                  </Link>
                  <Link
                    href={`/results?childId=${child.id}`}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-full text-sm font-medium hover:bg-gray-50 transition-colors min-h-[44px] inline-flex items-center"
                  >
                    Результаты
                  </Link>
                  <button
                    type="button"
                    onClick={() => alert(`PDF-отчёт для ${child.firstName} — endpoint /api/parents/me/report.pdf готовится`)}
                    className="px-4 py-2 border border-amber-200 bg-amber-50 text-amber-700 rounded-full text-sm font-medium hover:bg-amber-100 transition-colors min-h-[44px] inline-flex items-center gap-1.5"
                    aria-label={`PDF-отчёт по ребёнку ${child.firstName}`}
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v12m-5-5l5 5 5-5M5 20h14" />
                    </svg>
                    PDF-отчёт
                  </button>
                </div>
              </div>
            ))}
            </div>
          </div>

          {/* Recent Results */}
          <div className="bg-white/80 backdrop-blur rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3
                className="text-lg font-semibold text-gray-900"
                style={{ fontFamily: 'Manrope, Inter, sans-serif' }}
              >
                Последние результаты
              </h3>
              {recentResults.length > 0 && (
                <Link href="/results" className="text-sm text-purple-600 hover:text-purple-500 font-medium">
                  Все
                </Link>
              )}
            </div>
            {recentResults.length > 0 ? (
              <div className="space-y-3">
                {recentResults.map(r => {
                  const badge = riskBadge(r.riskZone);
                  const multipleChildren = children.length > 1;
                  return (
                    <Link
                      key={r.id}
                      href={`/results/${r.id}`}
                      className="flex items-center justify-between gap-3 hover:bg-gray-50 -mx-2 px-2 py-2 rounded-lg transition"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="text-sm text-gray-700 truncate">{r.testName}</div>
                        {multipleChildren && (
                          <div className="text-xs text-gray-400 mt-0.5">{r.childName}</div>
                        )}
                      </div>
                      <span
                        className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full whitespace-nowrap"
                        style={{ background: badge.bg, color: badge.fg }}
                      >
                        {r.scorePct}%
                      </span>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-6">
                <div className="w-12 h-12 rounded-2xl bg-gray-100 mx-auto mb-3 flex items-center justify-center">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <p
                  className="text-sm font-semibold text-gray-700 mb-1"
                  style={{ fontFamily: 'Manrope, Inter, sans-serif' }}
                >
                  Здесь появится история тестов
                </p>
                <p className="text-xs text-gray-500 mb-3">Начните с первого теста, это бесплатно.</p>
                <Link
                  href="/tests"
                  className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-full text-xs font-semibold hover:bg-purple-700 min-h-[36px]"
                >
                  Открыть каталог
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Attention zone — 3 states */}
        {attentionZone.length > 0 ? (
          <div className="bg-white/80 backdrop-blur rounded-2xl p-6 shadow-sm mb-8 border border-amber-100">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center">
                <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <h3
                  className="text-base font-bold text-gray-900"
                  style={{ fontFamily: 'Manrope, Inter, sans-serif' }}
                >
                  Требуют наблюдения
                </h3>
                <p className="text-xs text-gray-500">Результаты за последние 60 дней в жёлтой или красной зоне</p>
              </div>
            </div>
            <div className="space-y-2 mb-4">
              {attentionZone.map(item => {
                const badge = riskBadge(item.riskZone);
                return (
                  <Link
                    key={item.resultId}
                    href={`/results/${item.resultId}`}
                    className="flex items-center justify-between gap-3 -mx-2 px-2 py-2 rounded-lg hover:bg-amber-50 transition"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900 truncate">
                        {item.shortLabel} · {item.childName}
                      </div>
                      <div className="text-xs text-gray-500 truncate">{item.testName}</div>
                    </div>
                    <span
                      className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full whitespace-nowrap"
                      style={{ background: badge.bg, color: badge.fg }}
                    >
                      {item.scorePct}% · {badge.label}
                    </span>
                  </Link>
                );
              })}
            </div>
            <Link
              href="/psychologists"
              className="inline-flex items-center px-5 py-2 bg-amber-600 text-white rounded-full text-sm font-semibold hover:bg-amber-700 min-h-[44px]"
            >
              Записать на консультацию
            </Link>
          </div>
        ) : testsToThreshold > 0 ? (
          <div className="bg-white/80 backdrop-blur rounded-2xl p-6 shadow-sm mb-8 border border-gray-100">
            <h3
              className="text-base font-bold text-gray-900 mb-2"
              style={{ fontFamily: 'Manrope, Inter, sans-serif' }}
            >
              Зона внимания
            </h3>
            <p className="text-sm text-gray-500 mb-3">
              Чтобы оценить зону внимания, нужно пройти хотя бы {pluralW(W.test, AI_THRESHOLD)}.
            </p>
            <div className="mb-3">
              <div className="flex justify-between items-center mb-1">
                <p className="text-xs text-gray-500">Пройдено {totals.testsPassed} из {AI_THRESHOLD}</p>
              </div>
              <div className="w-full h-2 bg-gray-100 rounded-full">
                <div
                  className="h-2 rounded-full transition-all"
                  style={{
                    width: `${(totals.testsPassed / AI_THRESHOLD) * 100}%`,
                    background: 'linear-gradient(90deg, #8A6BFF 0%, #B66BFF 100%)',
                  }}
                />
              </div>
            </div>
            <Link
              href="/tests"
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-gray-700 rounded-full text-xs font-semibold hover:bg-gray-50 min-h-[36px]"
            >
              Открыть каталог тестов
            </Link>
          </div>
        ) : (
          <div className="rounded-2xl p-5 mb-8 border border-green-100" style={{ background: '#ECFDF3' }}>
            <p className="text-sm text-green-800">
              Сегодня всё спокойно. Когда появятся результаты, требующие внимания, мы покажем их здесь.
            </p>
          </div>
        )}

        {/* AI Recommendation — 3 states */}
        {aiRecommendation ? (
          <div
            className="rounded-2xl p-6 text-white shadow-lg shadow-purple-200"
            style={{ background: 'linear-gradient(135deg, #6D4AFF 0%, #B66BFF 100%)' }}
          >
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <h3
                  className="font-semibold text-lg mb-1"
                  style={{ fontFamily: 'Manrope, Inter, sans-serif' }}
                >
                  {aiRecommendation.childName} стоит пройти «{aiRecommendation.testName}»
                </h3>
                <p className="text-white/90 text-sm mb-4">
                  {aiRecommendation.reason}
                </p>
                <div className="flex gap-2 flex-wrap">
                  <Link
                    href={`/tests/${aiRecommendation.testId}?childId=${aiRecommendation.childId}`}
                    className="inline-flex items-center px-5 py-2 bg-white text-purple-600 rounded-full text-sm font-semibold hover:bg-purple-50 transition-colors min-h-[44px]"
                  >
                    Пройти сейчас
                  </Link>
                  <Link
                    href={`/tests/${aiRecommendation.testId}`}
                    className="inline-flex items-center px-5 py-2 text-white rounded-full text-sm font-medium hover:bg-white/10 transition-colors min-h-[44px]"
                  >
                    Подробнее
                  </Link>
                </div>
              </div>
            </div>
          </div>
        ) : testsToThreshold > 0 ? (
          <div className="bg-white/80 backdrop-blur rounded-2xl p-6 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <h3
                  className="font-semibold text-base text-gray-900 mb-1"
                  style={{ fontFamily: 'Manrope, Inter, sans-serif' }}
                >
                  AI готовит рекомендации
                </h3>
                <p className="text-sm text-gray-500 mb-3">
                  Пройдите ещё {pluralW(W.test, testsToThreshold)}, чтобы получить персональные подсказки.
                </p>
                <div className="w-full h-2 bg-gray-100 rounded-full mb-3 max-w-sm">
                  <div
                    className="h-2 rounded-full transition-all"
                    style={{
                      width: `${(totals.testsPassed / AI_THRESHOLD) * 100}%`,
                      background: 'linear-gradient(90deg, #8A6BFF 0%, #B66BFF 100%)',
                    }}
                  />
                </div>
                <Link
                  href="/tests"
                  className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-full text-xs font-semibold hover:bg-purple-700 min-h-[36px]"
                >
                  Открыть каталог
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <Link
            href={`/children/${children[0]?.id ?? ''}/profile`}
            className="block bg-white/80 backdrop-blur rounded-2xl p-6 shadow-sm hover:shadow-md transition"
          >
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <h3
                  className="font-semibold text-base text-gray-900 mb-1"
                  style={{ fontFamily: 'Manrope, Inter, sans-serif' }}
                >
                  Расскажите о ребёнке
                </h3>
                <p className="text-sm text-gray-500">
                  Заполните профиль, чтобы получать персональные подсказки.
                </p>
              </div>
              <svg className="w-4 h-4 text-gray-400 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </Link>
        )}
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────
// Skeleton — same layout as dashboard, no layout shift
// ──────────────────────────────────────────────
function ParentDashboardSkeleton() {
  const Block = ({ h, w, rounded = 'rounded-2xl' }: { h: number; w?: string; rounded?: string }) => (
    <div
      className={`${rounded} ${w ?? 'w-full'}`}
      style={{
        height: h,
        backgroundImage: 'linear-gradient(90deg, #F1EEF8 0%, #F8F6FD 50%, #F1EEF8 100%)',
        backgroundSize: '200% 100%',
        animation: 'parentSkel 1.6s linear infinite',
      }}
    />
  );
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      <style jsx global>{`
        @keyframes parentSkel {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <Block h={32} w="w-72" rounded="rounded-xl" />
        <div className="mt-2 mb-8"><Block h={16} w="w-48" rounded="rounded" /></div>
        <div className="flex flex-wrap gap-3 mb-8">
          {[0, 1, 2, 3].map(i => <Block key={i} h={64} w="w-44" rounded="rounded-2xl" />)}
        </div>
        <div className="mb-6"><Block h={90} /></div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-8">
          <div className="space-y-4">
            <Block h={220} />
          </div>
          <div className="space-y-3">
            <Block h={220} />
          </div>
        </div>
        <div className="mb-8"><Block h={120} /></div>
        <Block h={140} />
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────
// Stat pill
// ──────────────────────────────────────────────
function StatPill({
  iconBg, iconColor, label, value, delta, meta, icon,
}: {
  iconBg: string;
  iconColor: string;
  label: string;
  value: string;
  delta?: string | null;
  meta?: string | null;
  icon: 'users' | 'check' | 'chart' | 'chat';
}) {
  const path = {
    users: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z',
    check: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
    chart: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
    chat: 'M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z',
  }[icon];

  return (
    <div className="flex items-center gap-2.5 bg-white/80 backdrop-blur rounded-2xl px-5 py-3 shadow-sm">
      <div className={`w-9 h-9 rounded-full ${iconBg} flex items-center justify-center`}>
        <svg className={`w-4 h-4 ${iconColor}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={path} />
        </svg>
      </div>
      <div>
        <p className="text-[11px] text-gray-400 leading-tight">{label}</p>
        <p className="text-lg font-bold text-gray-900 leading-tight">{value}</p>
        {(delta || meta) && (
          <p className="text-[10px] text-gray-500 leading-tight mt-0.5">{delta ?? meta}</p>
        )}
      </div>
    </div>
  );
}
