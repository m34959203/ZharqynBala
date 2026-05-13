'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { plural } from '@/lib/i18n/plural';
import {
  adminApi,
  type AdminOverviewDto,
  type RevenueTimeseriesDto,
  type PsychologistInModerationDto,
  type TopTestDto,
  type RegionStatDto,
} from '@/lib/api';

interface AdminDashboardProps {
  userName: string;
}

interface DashboardStats {
  totalUsers?: number;
  totalChildren?: number;
  totalTests?: number;
  completedSessions?: number;
  totalRevenue?: number;
  newUsersToday?: number;
  testsToday?: number;
  totalPsychologists?: number;
  approvedPsychologists?: number;
  pendingPsychologists?: number;
  testsCompleted?: number;
  revenueMonth?: number;
  consultationConversion?: number;
}

const fmt = (n: number) => n.toLocaleString('ru-RU').replace(/,/g, ' ');
const fmtCurrency = (n: number) => {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)} М ₸`;
  if (n >= 1_000) return `${fmt(Math.round(n / 1000) * 1000)} ₸`;
  return `${fmt(n)} ₸`;
};
const fmtCommissionCompact = (n: number) =>
  n >= 1_000_000 ? `${(n / 1_000_000).toFixed(2)} М ₸`
  : n >= 1_000 ? `${(n / 1000).toFixed(0)} тыс ₸`
  : `${fmt(n)} ₸`;
const formatDelta = (n: number, suffix = '') =>
  n === 0 ? null : `${n > 0 ? '+' : ''}${fmt(n)}${suffix}`;

const pluralYears = (n: number): string => {
  const m10 = n % 10, m100 = n % 100;
  if (m10 === 1 && m100 !== 11) return `${n} год`;
  if (m10 >= 2 && m10 <= 4 && (m100 < 10 || m100 >= 20)) return `${n} года`;
  return `${n} лет`;
};

const formatRelative = (iso: string, now: number): string => {
  const t = new Date(iso).getTime();
  const diffSec = Math.max(0, Math.floor((now - t) / 1000));
  if (diffSec < 60) return 'только что';
  const min = Math.floor(diffSec / 60);
  if (min < 60) return `${min} мин назад`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} ч назад`;
  const days = Math.floor(hr / 24);
  if (days < 7) return `${days} ${days === 1 ? 'день' : days < 5 ? 'дня' : 'дней'} назад`;
  if (days < 30) {
    const w = Math.floor(days / 7);
    return `${w} ${w === 1 ? 'неделю' : w < 5 ? 'недели' : 'недель'} назад`;
  }
  // > 30 days — абсолютная дата
  return new Date(iso).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
};

// BUG-014: auto-tick раз в минуту, чтобы «2 ч назад» не оставались
// «2 ч назад» через сутки. Один интервал на компонент, дёшево.
const RelativeTime: React.FC<{ iso: string }> = ({ iso }) => {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(id);
  }, []);
  return <>{formatRelative(iso, now)}</>;
};

const today = () => {
  const d = new Date();
  return d.toLocaleDateString('ru-RU', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
};

const timeNow = () => {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')} UTC+6`;
};

type IconName =
  | 'users' | 'user' | 'shield' | 'book' | 'wallet' | 'target'
  | 'arrowUp' | 'arrowDown' | 'plus' | 'download' | 'check' | 'close' | 'clock'
  | 'arrow' | 'file' | 'info' | 'lock' | 'globe' | 'sparkle' | 'settings';

function Icon({ name, size = 18, stroke = 1.75 }: { name: IconName; size?: number; stroke?: number }) {
  const props = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: stroke,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  };
  const paths: Record<IconName, React.ReactNode> = {
    users: (<><circle cx="9" cy="8" r="3.5" /><path d="M3 20c0-3 3-5 6-5s6 2 6 5" /><circle cx="17" cy="9" r="2.5" /><path d="M15 20c0-2 2-4 4-4s2 1 2 4" /></>),
    user: (<><circle cx="12" cy="8" r="3.5" /><path d="M5 20c1-4 3-6 7-6s6 2 7 6" /></>),
    shield: (<><path d="M12 3 4 6v6c0 5 3.5 8.5 8 9.5 4.5-1 8-4.5 8-9.5V6l-8-3z" /><path d="m9 12 2 2 4-4" /></>),
    book: (<><path d="M5 5a2 2 0 0 1 2-2h11v18H7a2 2 0 0 1-2-2V5z" /><path d="M5 17a2 2 0 0 1 2-2h11" /></>),
    wallet: (<><path d="M3 8a2 2 0 0 1 2-2h13a1 1 0 0 1 1 1v2" /><path d="M3 8v10a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-3" /><path d="M16 13h5v3h-5a1.5 1.5 0 0 1 0-3z" /></>),
    target: (<><circle cx="12" cy="12" r="8.5" /><circle cx="12" cy="12" r="4.5" /><circle cx="12" cy="12" r="1.5" /></>),
    arrowUp: (<><path d="M12 19V5" /><path d="m6 11 6-6 6 6" /></>),
    arrowDown: (<><path d="M12 5v14" /><path d="m6 13 6 6 6-6" /></>),
    plus: (<><path d="M12 5v14M5 12h14" /></>),
    download: (<><path d="M12 4v12" /><path d="m7 11 5 5 5-5" /><path d="M5 20h14" /></>),
    check: (<><path d="m5 12 5 5 9-11" /></>),
    close: (<><path d="M6 6l12 12M18 6 6 18" /></>),
    clock: (<><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>),
    arrow: (<><path d="M5 12h14" /><path d="m13 6 6 6-6 6" /></>),
    file: (<><path d="M7 3h8l4 4v13a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z" /><path d="M14 3v5h5" /></>),
    info: (<><circle cx="12" cy="12" r="9" /><path d="M12 11v5M12 8v.5" /></>),
    lock: (<><rect x="4" y="11" width="16" height="10" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></>),
    globe: (<><circle cx="12" cy="12" r="9" /><path d="M3 12h18" /><path d="M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" /></>),
    sparkle: (<><path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1" /></>),
    settings: (<><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1A1.7 1.7 0 0 0 4.6 9a1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" /></>),
  };
  return <svg {...props}>{paths[name]}</svg>;
}

type DeltaTone = 'ok' | 'warn' | 'risk';

function Stat({
  icon, label, value, delta, deltaTone = 'ok', featured = false, sub, href,
}: {
  icon: IconName; label: string; value: string; delta?: string; deltaTone?: DeltaTone;
  featured?: boolean; sub?: string; href?: string;
}) {
  const deltaBg = featured ? 'rgba(255,255,255,0.18)'
    : deltaTone === 'risk' ? 'var(--risk-50)' : deltaTone === 'warn' ? 'var(--warn-50)' : 'var(--ok-50)';
  const deltaFg = featured ? '#fff'
    : deltaTone === 'risk' ? 'var(--risk-700)' : deltaTone === 'warn' ? 'var(--warn-700)' : 'var(--ok-700)';
  const Tag = href ? Link : 'button';
  const tagProps = href ? { href } : { type: 'button' as const };

  return (
    // @ts-expect-error -- conditional polymorphic
    <Tag
      {...tagProps}
      className="card hover-lift"
      style={{
        padding: 22, textAlign: 'left', display: 'flex', flexDirection: 'column', gap: 14,
        cursor: 'pointer', minHeight: 152, width: '100%',
        background: featured ? 'var(--brand-grad)' : 'var(--card)',
        color: featured ? '#fff' : 'var(--ink-900)',
        border: featured ? 0 : '1px solid var(--line)',
        borderRadius: 'var(--radius-lg)',
        boxShadow: featured ? 'var(--shadow-brand)' : 'var(--shadow-sm)',
        position: 'relative', overflow: 'hidden',
      }}
    >
      {featured && (
        <span style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          background: 'radial-gradient(120% 80% at 100% 0%, rgba(255,255,255,0.18) 0%, transparent 50%)',
        }} />
      )}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', zIndex: 1 }}>
        <div style={{
          width: 38, height: 38, borderRadius: 11,
          background: featured ? 'rgba(255,255,255,0.18)' : 'var(--brand-50)',
          color: featured ? '#fff' : 'var(--brand-600)',
          display: 'grid', placeItems: 'center',
        }}>
          <Icon name={icon} size={18} />
        </div>
        {delta && (
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 4,
            padding: '4px 10px', borderRadius: 999, fontSize: 11.5, fontWeight: 600,
            background: deltaBg, color: deltaFg,
          }}>
            <Icon name={deltaTone === 'risk' ? 'arrowDown' : 'arrowUp'} size={11} stroke={2.5} />
            {delta}
          </span>
        )}
      </div>
      <div style={{ zIndex: 1 }}>
        <div style={{ fontSize: 13, opacity: featured ? 0.9 : 1, color: featured ? '#fff' : 'var(--ink-500)' }}>
          {label}
        </div>
        <div style={{
          fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 30, lineHeight: 1.1,
          letterSpacing: '-0.02em', marginTop: 4,
        }}>
          {value}
        </div>
        {sub && (
          <div style={{
            fontSize: 12, marginTop: 8, lineHeight: 1.4,
            opacity: featured ? 0.85 : 0.7, color: featured ? '#fff' : 'var(--ink-500)',
          }}>
            {sub}
          </div>
        )}
      </div>
    </Tag>
  );
}

// ───────────────────────────────────────────────────────────
// Overview stats — все значения из API, без хардкода
// ───────────────────────────────────────────────────────────

function StatSkeleton() {
  return (
    <div style={{
      background: 'var(--card)', border: '1px solid var(--line)',
      borderRadius: 20, padding: 24, minHeight: 130,
      backgroundImage: 'linear-gradient(90deg, var(--ink-100) 0%, var(--ink-50) 50%, var(--ink-100) 100%)',
      backgroundSize: '200% 100%',
      animation: 'adminShimmer 1.6s linear infinite',
    }}>
      <style jsx>{`
        @keyframes adminShimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </div>
  );
}

function OverviewStats({
  overview, error, onRetry,
}: {
  overview: AdminOverviewDto | null;
  error: boolean;
  onRetry: () => void;
}) {
  if (error) {
    return (
      <div className="card" role="alert" style={{
        padding: 24, marginBottom: 28, textAlign: 'center',
        background: 'var(--risk-50)', borderColor: 'var(--risk-100)',
      }}>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--risk-700)', marginBottom: 8 }}>
          Не удалось загрузить статистику
        </div>
        <div style={{ fontSize: 13, color: 'var(--ink-500)', marginBottom: 16 }}>
          Попробуйте ещё раз. Если повторится — напишите в поддержку.
        </div>
        <button type="button" className="btn btn-secondary" onClick={onRetry}>
          Повторить
        </button>
      </div>
    );
  }

  if (!overview) {
    return (
      <div className="admin-stats" style={{ display: 'grid', gap: 16, marginBottom: 28 }}>
        {[0, 1, 2, 3, 4, 5].map(i => <StatSkeleton key={i} />)}
      </div>
    );
  }

  const allZeros =
    overview.users.total === 0
    && overview.tests.passed === 0
    && overview.revenue.monthAmountKzt === 0;

  if (allZeros) {
    return (
      <>
        <div className="admin-stats" style={{ display: 'grid', gap: 16, marginBottom: 16 }}>
          <Stat icon="users" label="Пользователи" value="0" href="/admin/users" />
          <Stat icon="user" label="Детей в системе" value="0" />
          <Stat icon="shield" label="Психологи · одобрено" value="0" href="/admin/psychologists" />
          <Stat icon="book" label="Тестов пройдено" value="0" href="/admin/tests" />
          <Stat featured icon="wallet" label="Выручка месяца" value="0 ₸" href="/admin/payments" />
          <Stat icon="target" label="Диагностика → консультация" value="0%" />
        </div>
        <div className="card" style={{
          padding: 14, marginBottom: 28,
          background: 'var(--ink-50)', borderStyle: 'dashed',
        }}>
          <div style={{ fontSize: 13, color: 'var(--ink-500)' }}>
            Данные начнут появляться после первых регистраций и прохождений тестов.
          </div>
        </div>
      </>
    );
  }

  const { users, children, psychologists, tests, revenue, conversion } = overview;

  const usersMeta = users.total >= 10
    ? `родители ${fmt(users.parents)} · психологи ${fmt(users.psychologists)} · школы ${fmt(users.schools)} · админы ${fmt(users.admins)}`
    : undefined;
  const childrenMeta = (children.total >= 10 && children.perParent !== null)
    ? `по ${children.perParent.toFixed(2).replace(/\.?0+$/, '')} ребёнка на родителя`
    : undefined;
  const psyMeta = `${fmt(psychologists.pending)} на модерации · ${fmt(psychologists.rejected)} отклонено`;
  const testsMeta = tests.passed >= 50
    ? `премиум-доля ${Math.round(tests.premiumShare * 100)}%`
    : undefined;
  const revenueMeta = revenue.monthAmountKzt >= 100_000
    ? `комиссия платформы ${fmtCommissionCompact(revenue.commissionKzt)}`
    : undefined;
  const conversionMeta = `цель ≥ ${conversion.target}%${conversion.previousMonthPct > 0 ? ` · прошлый месяц ${conversion.previousMonthPct.toFixed(1)}%` : ''}`;

  return (
    <div className="admin-stats" style={{ display: 'grid', gap: 16, marginBottom: 28 }}>
      <Stat
        icon="users" label="Пользователи"
        value={fmt(users.total)}
        delta={formatDelta(users.deltaWeek, ' за 7 дней') ?? undefined}
        sub={usersMeta} href="/admin/users"
      />
      <Stat
        icon="user" label="Детей в системе"
        value={fmt(children.total)}
        delta={formatDelta(children.deltaWeek, ' за 7 дней') ?? undefined}
        sub={childrenMeta}
      />
      <Stat
        icon="shield" label="Психологи · одобрено"
        value={fmt(psychologists.approved)}
        delta={formatDelta(psychologists.deltaWeek, ' за 7 дней') ?? undefined}
        sub={psyMeta} href="/admin/psychologists"
      />
      <Stat
        icon="book" label="Тестов пройдено"
        value={fmt(tests.passed)}
        delta={formatDelta(tests.deltaWeek, ' за 7 дней') ?? undefined}
        sub={testsMeta} href="/admin/tests"
      />
      <Stat
        featured icon="wallet" label="Выручка месяца"
        value={fmtCurrency(revenue.monthAmountKzt)}
        delta={revenue.deltaMomPct !== 0 ? `${revenue.deltaMomPct > 0 ? '+' : ''}${revenue.deltaMomPct.toFixed(1)}% MoM` : undefined}
        deltaTone={revenue.deltaMomPct < 0 ? 'risk' : 'ok'}
        sub={revenueMeta} href="/admin/payments"
      />
      <Stat
        icon="target" label="Диагностика → консультация"
        value={`${conversion.diagnosticToConsultPct.toFixed(1)}%`}
        delta={conversion.deltaPp !== 0 ? `${conversion.deltaPp > 0 ? '+' : ''}${conversion.deltaPp.toFixed(1)} п.п.` : undefined}
        deltaTone={conversion.deltaPp < 0 ? 'warn' : 'ok'}
        sub={conversionMeta}
      />
    </div>
  );
}

type AvatarTone = 'tone-rose' | 'tone-mint' | 'tone-sun' | 'tone-sky' | 'tone-warm';
const toneBg: Record<AvatarTone, string> = {
  'tone-rose': 'linear-gradient(135deg, #FF8FB1 0%, #B66BFF 100%)',
  'tone-mint': 'linear-gradient(135deg, #6BE0B5 0%, #6BC8FF 100%)',
  'tone-sun': 'linear-gradient(135deg, #FFD56B 0%, #FF8F6B 100%)',
  'tone-sky': 'linear-gradient(135deg, #6BC8FF 0%, #6D4AFF 100%)',
  'tone-warm': 'linear-gradient(135deg, #FFB36B 0%, #FF7BB5 100%)',
};

function PsyModRow({
  initials, tone, name, years, edu, applied,
}: { initials: string; tone: AvatarTone; name: string; years: string; edu: string; applied: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '14px 0', borderBottom: '1px solid var(--line)' }}>
      <div style={{
        width: 44, height: 44, borderRadius: 999, color: '#fff', background: toneBg[tone],
        display: 'grid', placeItems: 'center', fontWeight: 700, fontSize: 14, flexShrink: 0,
      }}>{initials}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--ink-900)' }}>{name}</div>
        <div style={{ fontSize: 12, color: 'var(--ink-500)', marginTop: 4 }}>{years} опыта · {edu}</div>
      </div>
      <div style={{ fontSize: 12, color: 'var(--ink-500)' }}>{applied}</div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button className="btn btn-ghost btn-sm"><Icon name="file" size={13} /> Диплом</button>
        <button className="btn btn-secondary btn-sm">Отклонить</button>
        <button className="btn btn-sm" style={{ background: 'var(--ok-500)', color: '#fff' }}>
          <Icon name="check" size={13} stroke={2.5} /> Одобрить
        </button>
      </div>
    </div>
  );
}

function formatAxisTick(v: number): string {
  if (v === 0) return '0';
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(v % 1_000_000 === 0 ? 0 : 1)}M`;
  if (v >= 1_000) return `${Math.round(v / 1000)}K`;
  return String(v);
}

function formatBarLabel(v: number): string {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(2).replace(/\.?0+$/, '')} М ₸`;
  if (v >= 1_000) return `${Math.round(v / 1000)} тыс ₸`;
  return `${v} ₸`;
}

function RevenueChart() {
  const [range, setRange] = useState<'week' | 'month' | 'year'>('month');
  const [series, setSeries] = useState<RevenueTimeseriesDto | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    adminApi.getRevenueTimeseries(range)
      .then(setSeries)
      .catch(() => setSeries(null))
      .finally(() => setLoading(false));
  }, [range]);

  const data = series?.data ?? [];
  const max = Math.max(series?.max ?? 1, 1); // avoid /0
  const tabs: [typeof range, string][] = [['week', 'Неделя'], ['month', 'Месяц'], ['year', 'Год']];

  // 5 evenly-spaced axis ticks (0, 25, 50, 75, 100% of max)
  const ticks = [0, 0.25, 0.5, 0.75, 1].map(p => Math.round(max * p));

  return (
    <div className="card" style={{ padding: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16 }}>Динамика выручки</div>
          <div style={{ fontSize: 13, color: 'var(--ink-500)', marginTop: 4 }}>в тысячах ₸ · до комиссии платформы</div>
        </div>
        <div style={{ display: 'flex', background: 'var(--ink-100)', borderRadius: 999, padding: 3 }}>
          {tabs.map(([k, l]) => (
            <button key={k} onClick={() => setRange(k)} style={{
              padding: '6px 12px', borderRadius: 999, fontSize: 12, fontWeight: 600,
              background: range === k ? '#fff' : 'transparent',
              color: range === k ? 'var(--ink-900)' : 'var(--ink-500)',
              boxShadow: range === k ? 'var(--shadow-sm)' : 'none',
            }}>{l}</button>
          ))}
        </div>
      </div>

      <div style={{ position: 'relative', height: 220 }}>
        {ticks.map((v, i) => (
          <div key={i} style={{
            position: 'absolute', left: 40, right: 0, bottom: `${(v / max) * 100}%`,
            borderTop: '1px dashed var(--ink-200)', height: 1,
          }}>
            <span style={{
              position: 'absolute', left: -42, top: -7, fontSize: 10.5, fontWeight: 500, color: 'var(--ink-400)',
            }}>{formatAxisTick(v)}</span>
          </div>
        ))}

        <div style={{
          position: 'absolute', inset: 0, paddingLeft: 40, paddingBottom: 28,
          display: 'flex', alignItems: 'flex-end', gap: data.length > 7 ? 8 : 24,
        }}>
          {loading && !series ? (
            // skeleton bars
            Array.from({ length: 5 }).map((_, i) => (
              <div key={`s-${i}`} style={{
                flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%',
              }}>
                <div style={{
                  width: '100%', maxWidth: 64, height: `${40 + (i % 3) * 20}%`,
                  borderRadius: '10px 10px 4px 4px',
                  backgroundImage: 'linear-gradient(180deg, #F1EEF8 0%, #F8F6FD 100%)',
                  opacity: 0.6,
                }}/>
              </div>
            ))
          ) : data.map((d, i) => (
            <div key={i} style={{
              flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', position: 'relative',
            }}>
              <div style={{
                width: '100%', maxWidth: 64,
                // Show at least a thin sliver if value is 0 — keeps grid readable
                height: d.value === 0 ? '2px' : `${Math.max(2, (d.value / max) * 100)}%`,
                borderRadius: '10px 10px 4px 4px',
                background: d.value === 0 ? 'var(--ink-200)' : d.current ? 'var(--brand-grad)' : 'var(--brand-100)',
                boxShadow: d.current ? 'var(--shadow-brand)' : 'none',
                position: 'relative', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: 8,
              }}>
                {d.current && d.value > 0 && (
                  <div style={{
                    position: 'absolute', top: -28, padding: '4px 10px', borderRadius: 8,
                    background: '#0E0B22', color: '#fff', fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap',
                  }}>
                    {formatBarLabel(d.value)}
                  </div>
                )}
              </div>
              <div style={{
                position: 'absolute', bottom: 0, fontSize: data.length > 7 ? 10 : 12, fontWeight: 600,
                color: d.current ? 'var(--brand-600)' : 'var(--ink-500)',
              }}>{d.label}</div>
            </div>
          ))}
        </div>
      </div>

      {(() => {
        const totalSum = data.reduce((s, d) => s + d.value, 0);
        const commission = Math.round(totalSum * 0.15);
        const nonZero = data.filter(d => d.value > 0).length;
        const avgPerBucket = nonZero > 0 ? Math.round(totalSum / nonZero) : 0;
        const periodLabel = data.length > 0
          ? `${data[0].label}–${data[data.length - 1].label}`
          : '';
        return (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 24, marginTop: 24,
            paddingTop: 16, borderTop: '1px solid var(--line)',
          }}>
            <div>
              <div style={{ fontSize: 12, color: 'var(--ink-500)' }}>{periodLabel}</div>
              <div style={{ fontWeight: 700, fontSize: 18, marginTop: 2 }}>{formatBarLabel(totalSum)}</div>
            </div>
            <div>
              <div style={{ fontSize: 12, color: 'var(--ink-500)' }}>Комиссия (15%)</div>
              <div style={{ fontWeight: 700, fontSize: 18, marginTop: 2, color: 'var(--brand-600)' }}>
                {formatBarLabel(commission)}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 12, color: 'var(--ink-500)' }}>
                {range === 'week' ? 'Средний день' : 'Средний месяц'}
              </div>
              <div style={{ fontWeight: 700, fontSize: 18, marginTop: 2 }}>
                {formatBarLabel(avgPerBucket)}
              </div>
            </div>
            <div style={{ marginLeft: 'auto' }}>
              <button className="btn btn-secondary btn-sm">
                <Icon name="download" size={13} /> CSV
              </button>
            </div>
          </div>
        );
      })()}
    </div>
  );
}

function TopTest({
  rank, name, author, count, max,
}: { rank: number; name: string; author: string; count: number; max: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: '1px solid var(--line)' }}>
      <div style={{
        width: 28, height: 28, borderRadius: 8,
        background: rank === 1 ? 'var(--brand-grad)' : 'var(--ink-100)',
        color: rank === 1 ? '#fff' : 'var(--ink-500)',
        display: 'grid', placeItems: 'center',
        fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 12, flexShrink: 0,
      }}>{rank}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 600, fontSize: 14 }}>{name}</div>
        <div style={{ fontSize: 12, color: 'var(--ink-500)', marginTop: 2 }}>{author}</div>
        <div style={{ height: 4, background: 'var(--ink-100)', borderRadius: 999, overflow: 'hidden', marginTop: 8 }}>
          <div style={{
            height: '100%', width: `${(count / max) * 100}%`,
            borderRadius: 999, background: 'var(--brand-grad)',
          }} />
        </div>
      </div>
      <div style={{ fontWeight: 700, fontSize: 14, fontVariantNumeric: 'tabular-nums' }}>{fmt(count)}</div>
    </div>
  );
}

type PaymentStatus = 'paid' | 'pending' | 'failed';
function PaymentRow({
  id, user, amount, status,
}: { id: string; user: string; amount: string; status: PaymentStatus }) {
  const bg = status === 'paid' ? 'var(--ok-50)' : status === 'pending' ? 'var(--warn-50)' : 'var(--risk-50)';
  const fg = status === 'paid' ? 'var(--ok-700)' : status === 'pending' ? 'var(--warn-700)' : 'var(--risk-700)';
  const badgeClass = status === 'paid' ? 'badge-norm' : status === 'pending' ? 'badge-warn' : 'badge-risk';
  const label = status === 'paid' ? 'Оплачено' : status === 'pending' ? 'Ожидает' : 'Неудачно';
  const iconName: IconName = status === 'paid' ? 'check' : status === 'pending' ? 'clock' : 'close';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 0', borderBottom: '1px solid var(--line)' }}>
      <div style={{
        width: 32, height: 32, borderRadius: 8, background: bg, color: fg,
        display: 'grid', placeItems: 'center', flexShrink: 0,
      }}>
        <Icon name={iconName} size={14} stroke={2.5} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: 'ui-monospace, monospace', fontSize: 12, color: 'var(--ink-700)', fontWeight: 600 }}>{id}</div>
        <div style={{
          fontSize: 12, color: 'var(--ink-500)', marginTop: 2,
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>{user}</div>
      </div>
      <div style={{ textAlign: 'right' }}>
        <div style={{ fontWeight: 700, fontSize: 13, fontVariantNumeric: 'tabular-nums' }}>{amount} ₸</div>
        <span className={`badge ${badgeClass}`} style={{ fontSize: 10, padding: '2px 7px', marginTop: 3 }}>{label}</span>
      </div>
    </div>
  );
}

function SysNote({
  icon, tone, title, time,
}: { icon: IconName; tone: 'warn' | 'brand' | 'ok'; title: string; time: React.ReactNode }) {
  const bg = tone === 'warn' ? 'var(--warn-50)' : tone === 'brand' ? 'var(--brand-50)' : 'var(--ok-50)';
  const fg = tone === 'warn' ? 'var(--warn-700)' : tone === 'brand' ? 'var(--brand-600)' : 'var(--ok-700)';
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '11px 0', borderBottom: '1px solid var(--line)' }}>
      <div style={{
        width: 32, height: 32, borderRadius: 8, background: bg, color: fg, flexShrink: 0,
        display: 'grid', placeItems: 'center',
      }}>
        <Icon name={icon} size={14} />
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, lineHeight: 1.4, color: 'var(--ink-700)' }}>{title}</div>
        <div style={{ fontSize: 12, color: 'var(--ink-500)', marginTop: 4 }}>{time}</div>
      </div>
    </div>
  );
}

function RegionRow({ name, percent, tone }: { name: string; percent: number; tone: string }) {
  return (
    <div style={{ padding: '10px 0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
        <div style={{ fontSize: 13, fontWeight: 600 }}>{name}</div>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--brand-600)', fontVariantNumeric: 'tabular-nums' }}>{percent}%</div>
      </div>
      <div style={{ height: 6, background: 'var(--ink-100)', borderRadius: 999, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${percent}%`, background: tone, borderRadius: 999 }} />
      </div>
    </div>
  );
}

function RiskRow({
  tone, title, sub, cta,
}: { tone: 'risk' | 'warn' | 'ok'; title: string; sub: string; cta?: string }) {
  const map = {
    risk: { bg: 'var(--risk-50)', border: 'var(--risk-100)', dot: 'var(--risk-500)', label: 'var(--risk-700)' },
    warn: { bg: 'var(--warn-50)', border: 'var(--warn-100)', dot: 'var(--warn-500)', label: 'var(--warn-700)' },
    ok: { bg: 'var(--ok-50)', border: 'var(--ok-100)', dot: 'var(--ok-500)', label: 'var(--ok-700)' },
  }[tone];
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 16,
      padding: 18, borderRadius: 14,
      background: map.bg, border: `1px solid ${map.border}`,
    }}>
      <span style={{
        width: 12, height: 12, borderRadius: 999, background: map.dot,
        boxShadow: `0 0 0 5px ${map.bg}, 0 0 0 6px ${map.dot}30`,
        flexShrink: 0,
      }} />
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 600, fontSize: 13, color: map.label }}>{title}</div>
        <div style={{ fontSize: 12, marginTop: 4, color: map.label, opacity: 0.85 }}>{sub}</div>
      </div>
      {cta && (
        <button className="btn btn-sm" style={{ background: '#fff', color: map.label, border: `1px solid ${map.border}` }}>
          {cta} <Icon name="arrow" size={12} />
        </button>
      )}
    </div>
  );
}

export default function AdminDashboard({ userName }: AdminDashboardProps) {
  const [stats, setStats] = useState<DashboardStats>({});
  const [now, setNow] = useState(timeNow());

  useEffect(() => {
    const t = setInterval(() => setNow(timeNow()), 30_000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    adminApi.getDashboardStats()
      .then((data) => setStats((data as DashboardStats) || {}))
      .catch(() => {/* keep current fallbacks below */});
  }, []);

  // Overview (real aggregated stats from /admin/stats/overview)
  const [overview, setOverview] = useState<AdminOverviewDto | null>(null);
  const [overviewError, setOverviewError] = useState(false);

  // Block-level state: модерация, top tests, регионы, notifications, SLA
  const [moderation, setModeration] = useState<PsychologistInModerationDto[] | null>(null);
  const [topTestsPeriod, setTopTestsPeriod] = useState<'current' | 'previous' | 'all'>('all');
  const [topTests, setTopTests] = useState<TopTestDto[] | null>(null);
  const [regions, setRegions] = useState<RegionStatDto[] | null>(null);
  const [notifications, setNotifications] = useState<Array<{
    id: string; type: 'payment' | 'user' | 'psychologist' | 'consultation';
    icon: string; tone: 'ok' | 'warn' | 'brand' | 'risk';
    title: string; meta: string; at: string;
  }> | null>(null);
  const [slaHealth, setSlaHealth] = useState<Array<{
    id: 'payments' | 'consultations' | 'support';
    tone: 'ok' | 'warn' | 'risk';
    title: string; sub: string; cta?: string;
  }> | null>(null);

  useEffect(() => {
    adminApi.getOverview().then(setOverview).catch(() => setOverviewError(true));
    adminApi.getModerationQueue(5).then(setModeration).catch(() => setModeration([]));
    adminApi.getRegions().then(setRegions).catch(() => setRegions([]));
    adminApi.getNotifications(5).then(setNotifications).catch(() => setNotifications([]));
    adminApi.getSlaHealth().then(setSlaHealth).catch(() => setSlaHealth([]));
  }, []);

  useEffect(() => {
    setTopTests(null);
    adminApi.getTopTests(topTestsPeriod, 5).then(setTopTests).catch(() => setTopTests([]));
  }, [topTestsPeriod]);

  const refetchOverview = () => {
    setOverviewError(false);
    setOverview(null);
    adminApi.getOverview().then(setOverview).catch(() => setOverviewError(true));
  };

  return (
    <div className="admin-shell" suppressHydrationWarning>
      <style jsx global>{`
        :root {
          --brand-600: #6D4AFF; --brand-500: #8A6BFF; --brand-400: #B66BFF;
          --brand-50: #F4F0FF; --brand-100: #EAE2FF;
          --brand-grad: linear-gradient(135deg, #6D4AFF 0%, #B66BFF 100%);
          --ink-900: #0E0B22; --ink-700: #2A2640; --ink-500: #595673;
          --ink-400: #8480A0; --ink-300: #B7B3CC; --ink-200: #E5E1F0;
          --ink-100: #F1EEF8; --ink-50: #F8F6FD;
          --card: #FFFFFF; --line: #ECE9F5;
          --ok-50: #ECFDF3; --ok-100: #D1FADF; --ok-500: #12B76A; --ok-700: #027A48;
          --warn-50: #FFFAEB; --warn-100: #FEF0C7; --warn-500: #F79009; --warn-700: #B54708;
          --risk-50: #FEF3F2; --risk-100: #FEE4E2; --risk-500: #F04438; --risk-700: #B42318;
          --radius-md: 14px; --radius-lg: 20px;
          --shadow-sm: 0 1px 2px rgba(20,14,60,.04), 0 1px 1px rgba(20,14,60,.02);
          --shadow-brand: 0 12px 28px rgba(109,74,255,.28);
          --font-display: 'Manrope', 'Inter', system-ui, sans-serif;
        }
        .admin-shell { font-family: 'Inter', 'Manrope', system-ui, -apple-system, sans-serif; color: var(--ink-900); }
        .admin-shell .card { background: var(--card); border: 1px solid var(--line); border-radius: var(--radius-lg); box-shadow: var(--shadow-sm); }
        .admin-shell .btn { display: inline-flex; align-items: center; justify-content: center; gap: 8px; padding: 12px 18px; border-radius: 12px; font-size: 14px; font-weight: 600; line-height: 1; transition: transform .12s, box-shadow .15s, background .15s, color .15s; white-space: nowrap; border: 1px solid transparent; cursor: pointer; }
        .admin-shell .btn:hover { transform: translateY(-1px); }
        .admin-shell .btn-primary { background: var(--brand-grad); color: #fff; box-shadow: var(--shadow-brand); }
        .admin-shell .btn-secondary { background: #fff; color: var(--ink-900); border-color: var(--line); box-shadow: var(--shadow-sm); }
        .admin-shell .btn-secondary:hover { background: var(--ink-50); }
        .admin-shell .btn-ghost { color: var(--ink-700); }
        .admin-shell .btn-ghost:hover { background: var(--ink-100); }
        .admin-shell .btn-sm { padding: 9px 14px; font-size: 13px; border-radius: 10px; }
        .admin-shell .chip { display: inline-flex; align-items: center; gap: 6px; padding: 7px 12px; border-radius: 999px; background: #fff; border: 1px solid var(--line); font-size: 12.5px; font-weight: 500; color: var(--ink-700); cursor: pointer; }
        .admin-shell .chip.is-active { background: var(--ink-900); color: #fff; border-color: var(--ink-900); }
        .admin-shell .badge { display: inline-flex; align-items: center; gap: 5px; padding: 4px 10px; border-radius: 999px; font-size: 11.5px; font-weight: 600; }
        .admin-shell .badge::before { content: ''; width: 6px; height: 6px; border-radius: 999px; background: currentColor; flex-shrink: 0; }
        .admin-shell .badge-norm { background: var(--ok-50); color: var(--ok-700); }
        .admin-shell .badge-warn { background: var(--warn-50); color: var(--warn-700); }
        .admin-shell .badge-risk { background: var(--risk-50); color: var(--risk-700); }
        .admin-shell .badge-plain { display: inline-flex; padding: 4px 10px; border-radius: 999px; font-size: 11.5px; font-weight: 600; background: var(--ink-100); color: var(--ink-700); }
        .admin-shell .hover-lift { transition: transform .15s; }
        .admin-shell .hover-lift:hover { transform: translateY(-2px); }
        .admin-stats { grid-template-columns: repeat(6, 1fr); }
        .admin-two-col { grid-template-columns: 2fr 1fr; }
        @keyframes adminPulse { 0%, 100% { opacity: .25; transform: scale(1);} 50% { opacity: .5; transform: scale(1.6);} }
        @media (max-width: 1100px) { .admin-stats { grid-template-columns: repeat(3, 1fr); } .admin-two-col { grid-template-columns: 1fr; } }
        @media (max-width: 640px) { .admin-stats { grid-template-columns: repeat(2, 1fr); } }
      `}</style>

      {/* Dark command-center banner */}
      <div style={{
        background: '#0E0E14', color: '#fff',
        padding: '28px 32px',
        borderRadius: 'var(--radius-lg)',
        boxShadow: '0 20px 60px rgba(14,11,34,.25)',
        border: '1px solid rgba(255,255,255,0.05)',
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '4px 10px', borderRadius: 999, fontSize: 11.5, fontWeight: 600,
                background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.08)',
                color: '#fff',
              }}>
                <Icon name="shield" size={11} /> Админ · {userName}
              </span>
              <span style={{
                padding: '4px 10px', borderRadius: 999, fontSize: 11, fontWeight: 600,
                background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.55)',
              }}>v2.4.1 · PROD</span>
            </div>
            <h1 style={{
              fontFamily: 'var(--font-display)', fontWeight: 800,
              fontSize: 36, lineHeight: 1.1, letterSpacing: '-0.02em', color: '#fff',
            }}>Операционный центр Жарқын Бала</h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: 18, marginTop: 12, flexWrap: 'wrap' }}>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)' }}>
                {today()} · {now}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 600, color: '#6BE0B5' }}>
                <span style={{ position: 'relative', width: 8, height: 8, borderRadius: 999, background: '#12B76A', flexShrink: 0 }}>
                  <span style={{
                    position: 'absolute', inset: -4, borderRadius: 999, background: '#12B76A',
                    animation: 'adminPulse 2s ease-in-out infinite',
                  }} />
                </span>
                Система работает в норме · 12 сервисов онлайн
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn btn-secondary" style={{ background: 'rgba(255,255,255,0.06)', color: '#fff', border: '1px solid rgba(255,255,255,0.12)' }}>
              <Icon name="download" size={14} /> Экспорт репорта
            </button>
            <button className="btn btn-primary">
              <Icon name="plus" size={14} /> Пригласить психолога
            </button>
          </div>
        </div>
      </div>

      <main style={{ paddingTop: 28, paddingBottom: 48 }}>
        {/* 6 stat cards — все значения и подписи из /admin/stats/overview */}
        <OverviewStats
          overview={overview}
          error={overviewError}
          onRetry={refetchOverview}
        />

        {/* Two-col grid */}
        <div className="admin-two-col" style={{ display: 'grid', gap: 24, marginBottom: 28 }}>
          {/* LEFT 2/3 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {/* Moderation */}
            <div className="card" style={{ padding: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, flexWrap: 'wrap', gap: 12 }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16 }}>Новые психологи на модерации</div>
                    <span style={{
                      display: 'inline-flex', padding: '4px 10px', borderRadius: 999,
                      fontSize: 11.5, fontWeight: 600, background: 'var(--warn-50)', color: 'var(--warn-700)',
                    }}>{overview ? `${overview.psychologists.pending} в очереди` : '—'}</span>
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--ink-500)', marginTop: 4 }}>
                    {overview && overview.psychologists.pending > 0
                      ? 'Психологи ждут проверки диплома и сертификатов'
                      : 'Очередь свободна'}
                  </div>
                </div>
                <Link href="/admin/psychologists" style={{
                  fontSize: 13, fontWeight: 600, color: 'var(--brand-600)',
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                }}>
                  Открыть очередь <Icon name="arrow" size={12} />
                </Link>
              </div>
              <div style={{ marginTop: 12 }}>
                {moderation === null ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {[0, 1, 2].map(i => (
                      <div key={i} style={{
                        height: 56, borderRadius: 12,
                        backgroundImage: 'linear-gradient(90deg, var(--ink-100) 0%, var(--ink-50) 50%, var(--ink-100) 100%)',
                        backgroundSize: '200% 100%',
                        animation: 'adminShimmer 1.6s linear infinite',
                      }} />
                    ))}
                  </div>
                ) : moderation.length === 0 ? (
                  <div style={{
                    padding: '24px 16px', textAlign: 'center',
                    background: 'var(--ok-50)', borderRadius: 12,
                    color: 'var(--ok-700)', fontSize: 13.5,
                  }}>
                    Очередь свободна. Все заявки обработаны.
                  </div>
                ) : (
                  moderation.map(p => (
                    <PsyModRow
                      key={p.id}
                      initials={p.initials}
                      tone={p.tone as AvatarTone}
                      name={p.fullName}
                      years={pluralYears(p.experienceYears)}
                      edu={p.education}
                      applied={<RelativeTime iso={p.appliedAt} />}
                    />
                  ))
                )}
              </div>
            </div>

            <RevenueChart />

            {/* Top tests */}
            <div className="card" style={{ padding: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, flexWrap: 'wrap', gap: 12 }}>
                <div>
                  <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16 }}>
                    Популярные тесты {topTestsPeriod === 'current' ? 'месяца' : topTestsPeriod === 'previous' ? '· прошлый месяц' : 'за всё время'}
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--ink-500)', marginTop: 4 }}>По числу завершённых прохождений</div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    type="button"
                    className={`chip ${topTestsPeriod === 'current' ? 'is-active' : ''}`}
                    onClick={() => setTopTestsPeriod('current')}
                  >
                    Месяц
                  </button>
                  <button
                    type="button"
                    className={`chip ${topTestsPeriod === 'previous' ? 'is-active' : ''}`}
                    onClick={() => setTopTestsPeriod('previous')}
                  >
                    Прошлый
                  </button>
                  <button
                    type="button"
                    className={`chip ${topTestsPeriod === 'all' ? 'is-active' : ''}`}
                    onClick={() => setTopTestsPeriod('all')}
                  >
                    Всё время
                  </button>
                </div>
              </div>
              <div style={{ marginTop: 12 }}>
                {topTests === null ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {[0, 1, 2, 3, 4].map(i => (
                      <div key={i} style={{
                        height: 38, borderRadius: 8,
                        backgroundImage: 'linear-gradient(90deg, var(--ink-100) 0%, var(--ink-50) 50%, var(--ink-100) 100%)',
                        backgroundSize: '200% 100%',
                        animation: 'adminShimmer 1.6s linear infinite',
                      }} />
                    ))}
                  </div>
                ) : topTests.length === 0 ? (
                  <div style={{
                    padding: '24px 16px', textAlign: 'center',
                    color: 'var(--ink-500)', fontSize: 13.5,
                  }}>
                    Прохождений за этот период не было.
                  </div>
                ) : (
                  topTests.map(t => (
                    <TopTest
                      key={t.rank}
                      rank={t.rank}
                      name={t.name}
                      author={t.author || ' '}
                      count={t.count}
                      max={t.max}
                    />
                  ))
                )}
              </div>
            </div>
          </div>

          {/* RIGHT 1/3 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {/* Payments */}
            <div className="card" style={{ padding: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16 }}>Последние платежи · Kaspi</div>
                <Link href="/admin/payments" style={{ fontSize: 12, fontWeight: 600, color: 'var(--brand-600)' }}>Все</Link>
              </div>
              <div style={{ marginTop: 12 }}>
                <PaymentRow id="#2811b470" user="Айгуль К. · тест Филлипса" amount="3 500" status="paid" />
                <PaymentRow id="#2811b46f" user="Дамир А. · консультация" amount="15 000" status="paid" />
                <PaymentRow id="#2811b46e" user="Маргарита О. · Ковалёв" amount="3 500" status="pending" />
                <PaymentRow id="#2811b46d" user="Семья Бердыбековых" amount="15 000" status="paid" />
                <PaymentRow id="#2811b46c" user="Алмаз К. · Шварц" amount="3 500" status="failed" />
              </div>
            </div>

            {/* System notifications — live feed from real events */}
            <div className="card" style={{ padding: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16 }}>Системные уведомления</div>
                <span className="badge-plain">
                  {notifications === null ? '—' : `${notifications.length} ${plural(notifications.length, 'свежее', 'свежих', 'свежих')}`}
                </span>
              </div>
              <div style={{ marginTop: 12 }}>
                {notifications === null ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {[0, 1, 2].map(i => (
                      <div key={i} style={{
                        height: 44, borderRadius: 10,
                        backgroundImage: 'linear-gradient(90deg, var(--ink-100) 0%, var(--ink-50) 50%, var(--ink-100) 100%)',
                        backgroundSize: '200% 100%',
                        animation: 'adminShimmer 1.6s linear infinite',
                      }} />
                    ))}
                  </div>
                ) : notifications.length === 0 ? (
                  <div style={{ padding: '16px 0', textAlign: 'center', color: 'var(--ink-500)', fontSize: 13 }}>
                    Пока тихо. Уведомления появятся при первых платежах и регистрациях.
                  </div>
                ) : (
                  notifications.map(n => (
                    <SysNote
                      key={n.id}
                      icon={n.icon as IconName}
                      tone={n.tone === 'risk' ? 'warn' : (n.tone as 'warn' | 'brand' | 'ok')}
                      title={n.title}
                      time={<><RelativeTime iso={n.at} /> · {n.meta}</>}
                    />
                  ))
                )}
              </div>
            </div>

            {/* Regions */}
            <div className="card" style={{ padding: 24 }}>
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16 }}>Регионы Казахстана</div>
                <div style={{ fontSize: 13, color: 'var(--ink-500)', marginTop: 4 }}>Дети по городам школ</div>
              </div>
              <div style={{ marginTop: 8 }}>
                {regions === null ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {[0, 1, 2, 3].map(i => (
                      <div key={i} style={{
                        height: 32, borderRadius: 8,
                        backgroundImage: 'linear-gradient(90deg, var(--ink-100) 0%, var(--ink-50) 50%, var(--ink-100) 100%)',
                        backgroundSize: '200% 100%',
                        animation: 'adminShimmer 1.6s linear infinite',
                      }} />
                    ))}
                  </div>
                ) : regions.length === 0 ? (
                  <div style={{
                    padding: '20px 16px', textAlign: 'center',
                    color: 'var(--ink-500)', fontSize: 13.5,
                  }}>
                    Школы не подключены — карта регионов появится после первой регистрации школы.
                  </div>
                ) : (() => {
                  const TONES = [
                    'var(--brand-grad)',
                    'linear-gradient(90deg, #8A6BFF 0%, #B66BFF 100%)',
                    'linear-gradient(90deg, #FFB36B 0%, #FF7BB5 100%)',
                    'linear-gradient(90deg, #6BC8FF 0%, #6BE0B5 100%)',
                    'linear-gradient(90deg, #6BE0B5 0%, #FFD56B 100%)',
                  ];
                  return regions.map((r, i) => (
                    <RegionRow key={r.name} name={r.name} percent={r.percent} tone={TONES[i % TONES.length]} />
                  ));
                })()}
              </div>
              {regions && regions.length > 0 && (
                <div style={{
                  fontSize: 12, color: 'var(--ink-500)', marginTop: 16,
                  paddingTop: 14, borderTop: '1px solid var(--line)',
                }}>
                  Всего детей в системе: <b style={{ color: 'var(--ink-900)' }}>
                    {fmt(regions.reduce((s, r) => s + r.count, 0))}
                  </b>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Operational risks */}
        <div className="card" style={{ padding: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 20 }}>Операционные риски</div>
                <span className="badge-plain">светофор SLA</span>
              </div>
              <div style={{ fontSize: 13, color: 'var(--ink-500)', marginTop: 4 }}>
                Обновляется автоматически · последняя проверка {new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
            <button className="btn btn-secondary btn-sm">
              <Icon name="settings" size={13} /> Настроить пороги
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {slaHealth === null ? (
              <>
                <div className="skeleton" style={{ height: 64, borderRadius: 12 }} />
                <div className="skeleton" style={{ height: 64, borderRadius: 12 }} />
                <div className="skeleton" style={{ height: 64, borderRadius: 12 }} />
              </>
            ) : slaHealth.length === 0 ? (
              <div style={{
                padding: 24, textAlign: 'center', color: 'var(--ink-500)', fontSize: 14,
                border: '1px dashed var(--line)', borderRadius: 12,
              }}>
                Все системы работают штатно — рисков нет.
              </div>
            ) : (
              slaHealth.map((r) => (
                <RiskRow key={r.id} tone={r.tone} title={r.title} sub={r.sub} cta={r.cta ?? 'Открыть'} />
              ))
            )}
          </div>
        </div>

        {/* Security/cert footer strip */}
        <div style={{
          marginTop: 32, padding: '20px 24px', borderRadius: 'var(--radius-lg)',
          background: '#0E0E14', color: '#B7B3CC',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexWrap: 'wrap', gap: 16,
        }}>
          <div style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 12 }}>
            <span>© 2026 Жарқын Бала</span>
            <span style={{ opacity: 0.5 }}>·</span>
            <span>v2.4.1 · PROD</span>
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {[
              { icon: 'shield' as IconName, t: 'ISO/IEC 27001 · KZ87VQQ-2026Q1' },
              { icon: 'lock' as IconName, t: 'ЗРК ПДн · Реестр №118' },
              { icon: 'globe' as IconName, t: 'Данные хранятся в РК' },
            ].map((c) => (
              <span key={c.t} style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                padding: '8px 12px', borderRadius: 10, fontSize: 12,
                background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
              }}>
                <span style={{ color: '#B66BFF', display: 'inline-flex' }}><Icon name={c.icon} size={13} /></span>
                {c.t}
              </span>
            ))}
          </div>
        </div>
      </main>

      {/* AI assistant FAB */}
      <button
        type="button"
        onClick={() => alert('AI-помощник админа: чем помочь?')}
        style={{
          position: 'fixed', right: 28, bottom: 28, zIndex: 40,
          display: 'flex', alignItems: 'center', gap: 10,
          background: '#0E0B22', color: '#fff',
          padding: '12px 18px 12px 12px', borderRadius: 999,
          boxShadow: '0 12px 32px rgba(14,11,34,.32)',
          fontWeight: 600, fontSize: 13.5, border: 0, cursor: 'pointer',
        }}
      >
        <span style={{
          width: 32, height: 32, borderRadius: 999, display: 'grid', placeItems: 'center',
          background: 'var(--brand-grad)', color: '#fff',
        }}>
          <Icon name="sparkle" size={16} />
        </span>
        AI-ассистент админа
      </button>
    </div>
  );
}
