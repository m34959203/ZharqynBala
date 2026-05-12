'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import api from '@/lib/api';

// ──────────────────────────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────────────────────────

interface PsychologistDashboardProps {
  userName: string;
}

type Zone = 'norm' | 'warn' | 'risk';
type SessionStatus = 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';

interface SessionItem {
  id: string;
  time: string;
  name: string;
  age: number;
  reason: string;
  zone: Zone;
  status: SessionStatus;
  minutesUntil: number | null;
}

interface QueueItem {
  id: string;
  kid: string;
  age: number;
  parent: string;
  wanted: string;
  reason: string;
  zone: Zone;
  urgent?: boolean;
}

interface WatchItem {
  id: string;
  name: string;
  age: number;
  klass: string;
  zone: Exclude<Zone, 'norm'>;
  last: string;
  tone: 'tone-rose' | 'tone-mint' | 'tone-sun' | 'tone-sky' | 'tone-warm';
}

interface Earnings {
  amountKzt: number;
  sessions: number;
  averageKzt: number;
  payoutDate: string;
  commissionPct: number;
}

// ──────────────────────────────────────────────────────────────────
// Inline icon library (lucide-style)
// ──────────────────────────────────────────────────────────────────

type IconName =
  | 'star' | 'arrow' | 'check' | 'video' | 'download' | 'calendar'
  | 'users' | 'clock' | 'book' | 'file' | 'globe' | 'info' | 'search'
  | 'bell' | 'sparkle' | 'plus' | 'shield' | 'lock';

const Icon = ({
  name, size = 18, stroke = 1.75, style,
}: { name: IconName; size?: number; stroke?: number; style?: React.CSSProperties }) => {
  const props = {
    width: size, height: size, viewBox: '0 0 24 24',
    fill: 'none', stroke: 'currentColor',
    strokeWidth: stroke, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const,
    style,
    'aria-hidden': true,
    focusable: false,
  };
  const paths: Record<IconName, React.ReactNode> = {
    star: <path d="m12 3 2.6 5.6L21 9.4l-4.5 4.4 1 6.2-5.5-3-5.5 3 1-6.2L3 9.4l6.4-.8L12 3z"/>,
    arrow: <><path d="M5 12h14"/><path d="m13 6 6 6-6 6"/></>,
    check: <path d="m5 12 5 5 9-11"/>,
    video: <><rect x="3" y="6" width="13" height="12" rx="2"/><path d="M16 10 22 7v10l-6-3"/></>,
    download: <><path d="M12 4v12"/><path d="m7 11 5 5 5-5"/><path d="M5 20h14"/></>,
    calendar: <><rect x="3.5" y="5" width="17" height="16" rx="2"/><path d="M3.5 10h17"/><path d="M8 3v4M16 3v4"/></>,
    users: <><circle cx="9" cy="8" r="3.5"/><path d="M3 20c0-3 3-5 6-5s6 2 6 5"/><circle cx="17" cy="9" r="2.5"/><path d="M15 20c0-2 2-4 4-4s2 1 2 4"/></>,
    clock: <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>,
    book: <><path d="M5 5a2 2 0 0 1 2-2h11v18H7a2 2 0 0 1-2-2V5z"/><path d="M5 17a2 2 0 0 1 2-2h11"/></>,
    file: <><path d="M7 3h8l4 4v13a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z"/><path d="M14 3v5h5"/></>,
    globe: <><circle cx="12" cy="12" r="9"/><path d="M3 12h18"/><path d="M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/></>,
    info: <><circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8v.5"/></>,
    search: <><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></>,
    bell: <><path d="M6 9a6 6 0 1 1 12 0c0 5 2 6 2 7H4c0-1 2-2 2-7z"/><path d="M10 20a2 2 0 0 0 4 0"/></>,
    sparkle: <><path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1"/></>,
    plus: <path d="M12 5v14M5 12h14"/>,
    shield: <><path d="M12 3 4 6v6c0 5 3.5 8.5 8 9.5 4.5-1 8-4.5 8-9.5V6l-8-3z"/><path d="m9 12 2 2 4-4"/></>,
    lock: <><rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></>,
  };
  return <svg {...props}>{paths[name]}</svg>;
};

// ──────────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────────

const formatKzt = (n: number) => new Intl.NumberFormat('ru-RU').format(n) + ' ₸';

const todayLabel = () => {
  const months = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
  const d = new Date();
  return `${d.getDate()} ${months[d.getMonth()]}`;
};

const initials = (name: string) =>
  name.split(' ').filter(Boolean).map(p => p[0]).join('').slice(0, 2).toUpperCase();

const avatarToneFor = (name: string): WatchItem['tone'] => {
  const tones: WatchItem['tone'][] = ['tone-rose', 'tone-mint', 'tone-sun', 'tone-sky', 'tone-warm'];
  let h = 0;
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return tones[h % tones.length];
};

const minutesUntilFrom = (iso: string): number => {
  const now = Date.now();
  const t = new Date(iso).getTime();
  return Math.max(0, Math.round((t - now) / 60000));
};

const formatTime = (iso: string): string => {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};

// ──────────────────────────────────────────────────────────────────
// Design-spec fixtures (used as fallback if API returns empty)
// ──────────────────────────────────────────────────────────────────

const FIXTURE_SESSIONS: SessionItem[] = [
  { id: 'f1', time: '10:00', name: 'Айлин Т.', age: 11, reason: 'Школьная тревожность: повторная сессия по результатам теста Филлипса', zone: 'warn', status: 'COMPLETED', minutesUntil: null },
  { id: 'f2', time: '11:00', name: 'Дамир А.', age: 9, reason: 'Адаптация к 4 классу: работа с переходом в среднее звено', zone: 'norm', status: 'IN_PROGRESS', minutesUntil: null },
  { id: 'f3', time: '13:00', name: 'Камила О.', age: 14, reason: 'Самооценка: 6-я сессия, продолжение работы по плану', zone: 'warn', status: 'SCHEDULED', minutesUntil: 14 },
  { id: 'f4', time: '15:30', name: 'Арлан К.', age: 13, reason: 'Профориентация: первичная диагностика по Холланду и Климову', zone: 'norm', status: 'SCHEDULED', minutesUntil: null },
];

const FIXTURE_QUEUE: QueueItem[] = [
  { id: 'q1', kid: 'Санжар Бекбаев', age: 12, parent: 'Мадина Бекбаева', wanted: '14 мая, 16:00', reason: 'Резко снизилась успеваемость, родитель просит срочную встречу', zone: 'risk', urgent: true },
  { id: 'q2', kid: 'Алина Жунусова', age: 10, parent: 'Гульнара Жунусова', wanted: '15 мая, 14:00', reason: 'Беспокойство перед переездом и сменой школы', zone: 'warn' },
  { id: 'q3', kid: 'Тимур Орловский', age: 15, parent: 'Олег Орловский', wanted: '16 мая, 18:00', reason: 'Профориентация: выбор профильного класса', zone: 'norm' },
  { id: 'q4', kid: 'Дина Сариева', age: 8, parent: 'Айгерим Сариева', wanted: '17 мая, 11:00', reason: 'Первичная консультация, без жалоб, общая поддержка', zone: 'norm' },
];

const FIXTURE_WATCH: WatchItem[] = [
  { id: 'w1', name: 'Айлин Тестова', age: 11, klass: '4 сессии', zone: 'warn', last: 'сегодня', tone: 'tone-rose' },
  { id: 'w2', name: 'Санжар Бекбаев', age: 12, klass: 'новый запрос', zone: 'risk', last: 'не было', tone: 'tone-sky' },
  { id: 'w3', name: 'Камила Орлова', age: 14, klass: '6 сессий', zone: 'warn', last: '8 мая', tone: 'tone-sun' },
  { id: 'w4', name: 'Маргарита Иванова', age: 13, klass: '3 сессии', zone: 'warn', last: '5 мая', tone: 'tone-warm' },
  { id: 'w5', name: 'Алмаз Конысбаев', age: 10, klass: '2 сессии', zone: 'warn', last: '2 мая', tone: 'tone-mint' },
];

const FIXTURE_EARNINGS: Earnings = {
  amountKzt: 612000, sessions: 41, averageKzt: 14927,
  payoutDate: '30 мая', commissionPct: 15,
};

const FIXTURE_REVIEWS = [
  'Динара помогла дочери справиться с волнением перед ЭНТ. Спасибо за бережный подход.',
  'После двух сессий сын начал говорить о школе сам. Мы перестали ссориться по утрам.',
  'Очень тёплый специалист, рекомендации понятные. Видно, что работает с детьми давно.',
];

// ──────────────────────────────────────────────────────────────────
// Sub-components
// ──────────────────────────────────────────────────────────────────

const Badge = ({ zone, label }: { zone: Zone | 'plain' | 'brand-solid'; label: React.ReactNode }) => {
  if (zone === 'plain') return <span className="psy-badge-plain">{label}</span>;
  if (zone === 'brand-solid') return (
    <span className="psy-badge-plain" style={{ background: 'var(--psy-brand-600)', color: '#fff' }}>{label}</span>
  );
  const cls = zone === 'norm' ? 'psy-badge psy-badge-norm' : zone === 'warn' ? 'psy-badge psy-badge-warn' : 'psy-badge psy-badge-risk';
  return <span className={cls}>{label}</span>;
};

const SessionCard = ({ s }: { s: SessionItem }) => {
  const isInProgress = s.status === 'IN_PROGRESS';
  const isCompleted = s.status === 'COMPLETED';
  const isScheduled = s.status === 'SCHEDULED';
  const showJoin = isScheduled && s.minutesUntil != null && s.minutesUntil <= 15;

  return (
    <div className="psy-session-card" data-status={s.status}>
      <div className={`psy-avatar psy-avatar-lg ${avatarToneFor(s.name)}`}>
        {initials(s.name)}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="psy-row-gap" style={{ marginBottom: 6, flexWrap: 'wrap' }}>
          <span className="psy-name">{s.name}, {s.age} лет</span>
          {s.zone === 'warn' && <Badge zone="warn" label="Жёлтая зона" />}
          {s.zone === 'risk' && <Badge zone="risk" label="Красная зона" />}
          {s.zone === 'norm' && <Badge zone="norm" label="Норма" />}
          {isInProgress && (
            <Badge zone="brand-solid" label={
              <>
                <span className="psy-live-dot" aria-hidden />
                Идёт сейчас
              </>
            } />
          )}
          {isCompleted && (
            <Badge zone="norm" label={<><Icon name="check" size={10} stroke={3}/> Проведена</>} />
          )}
          {showJoin && s.minutesUntil != null && (
            <span className="psy-badge-plain" style={{ background: 'var(--psy-warn-50)', color: 'var(--psy-warn-700)' }}>
              через {s.minutesUntil} мин
            </span>
          )}
        </div>
        <div className="psy-reason">{s.reason}</div>
      </div>
      <div className="psy-session-actions">
        <button className="psy-btn psy-btn-secondary psy-btn-sm" aria-label={`Открыть карту ребёнка: ${s.name}`}>
          Открыть карту
        </button>
        {!isCompleted && (
          <button className="psy-btn psy-btn-ghost psy-btn-sm" aria-label={`Перенести консультацию: ${s.name}`}>
            Перенести
          </button>
        )}
        {(showJoin || isInProgress) && (
          <button className="psy-btn psy-btn-primary psy-btn-sm" aria-label={`Войти в видеосвязь с ${s.name}`}>
            <Icon name="video" size={14}/> Войти
          </button>
        )}
        {isCompleted && (
          <button className="psy-btn psy-btn-pdf psy-btn-sm" aria-label={`Открыть заметки по консультации: ${s.name}`}>
            <Icon name="download" size={14}/> Заметки
          </button>
        )}
      </div>
    </div>
  );
};

const TimelineRow = ({ s, isLast }: { s: SessionItem; isLast: boolean }) => (
  <div className="psy-timeline-row" style={{ marginBottom: isLast ? 0 : 16 }}>
    <div className="psy-timeline-time" data-status={s.status}>{s.time}</div>
    <div className="psy-timeline-dot" data-status={s.status} aria-hidden>
      {s.status === 'COMPLETED' && <Icon name="check" size={10} stroke={3} />}
    </div>
    <SessionCard s={s} />
  </div>
);

const QueueRow = ({ q, onConfirm, onReject, onPropose }: {
  q: QueueItem;
  onConfirm: (id: string) => void;
  onReject: (id: string) => void;
  onPropose: (id: string) => void;
}) => (
  <div className="psy-queue-row" data-urgent={q.urgent ? 'true' : 'false'}>
    <div style={{ flex: 1, minWidth: 0 }}>
      <div className="psy-row-gap" style={{ marginBottom: 4, flexWrap: 'wrap' }}>
        <span className="psy-queue-name">{q.kid}, {q.age} лет</span>
        {q.zone === 'risk' && <Badge zone="risk" label="Внимание" />}
        {q.zone === 'warn' && <Badge zone="warn" label="Наблюдение" />}
        {q.urgent && (
          <span className="psy-badge-plain" style={{ background: 'var(--psy-risk-500)', color: '#fff' }}>
            Срочно
          </span>
        )}
      </div>
      <div className="psy-queue-meta">Родитель: {q.parent} · желаемо: {q.wanted}</div>
      <div className="psy-queue-reason">{q.reason}</div>
    </div>
    <div className="psy-queue-actions">
      <button className="psy-btn psy-btn-ghost psy-btn-sm" onClick={() => onReject(q.id)} aria-label={`Отклонить запрос: ${q.kid}`}>
        Отклонить
      </button>
      <button className="psy-btn psy-btn-secondary psy-btn-sm" onClick={() => onPropose(q.id)} aria-label={`Предложить другое время: ${q.kid}`}>
        Другое время
      </button>
      <button className="psy-btn psy-btn-confirm psy-btn-sm" onClick={() => onConfirm(q.id)} aria-label={`Подтвердить запрос: ${q.kid}`}>
        <Icon name="check" size={13} stroke={2.5}/> Подтвердить
      </button>
    </div>
  </div>
);

const WatchRow = ({ w }: { w: WatchItem }) => (
  <Link href={`/clients/${w.id}`} className="psy-watch-row" aria-label={`Открыть карту: ${w.name}`}>
    <div className={`psy-avatar psy-avatar-md ${w.tone}`}>{initials(w.name)}</div>
    <div style={{ flex: 1, minWidth: 0 }}>
      <div className="psy-watch-name">{w.name}, {w.age}</div>
      <div className="psy-watch-meta">{w.klass} · последняя связь {w.last}</div>
    </div>
    <Badge zone={w.zone} label={w.zone === 'risk' ? 'Красная' : 'Жёлтая'} />
  </Link>
);

const NavTile = ({ icon, title, desc, href }: { icon: IconName; title: string; desc: string; href: string }) => (
  <Link href={href} className="psy-nav-tile">
    <div className="psy-nav-tile-icon"><Icon name={icon} size={20} /></div>
    <div>
      <div className="psy-nav-tile-title">{title}</div>
      <div className="psy-nav-tile-desc">{desc}</div>
    </div>
  </Link>
);

const SkeletonRow = () => <div className="psy-skel-row" aria-hidden />;

const QueueEmpty = () => (
  <div className="psy-state-empty">
    <div className="psy-empty-illo"><Icon name="calendar" size={26} /></div>
    <div className="psy-empty-title">Очередь пуста</div>
    <div className="psy-empty-desc">Запросы на консультации появятся здесь. Чтобы клиенты могли записываться, настройте расписание.</div>
    <Link href="/schedule" className="psy-btn psy-btn-primary psy-btn-sm">Открыть расписание</Link>
  </div>
);

// ──────────────────────────────────────────────────────────────────
// Main component
// ──────────────────────────────────────────────────────────────────

export default function PsychologistDashboard({ userName }: PsychologistDashboardProps) {
  const [acceptNew, setAcceptNew] = useState(true);
  const [queueFilter, setQueueFilter] = useState<'all' | 'urgent' | 'new' | 'week'>('all');
  const [sort, setSort] = useState<'date' | 'urgent' | 'age'>('date');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [watch, setWatch] = useState<WatchItem[]>([]);
  const [earnings, setEarnings] = useState<Earnings | null>(null);
  const [rating] = useState<{ value: number; count: number }>({ value: 4.9, count: 159 });

  const nearestMinutes = useMemo(() => {
    const upcoming = sessions
      .filter(s => s.status === 'SCHEDULED' && s.minutesUntil != null && s.minutesUntil > 0)
      .map(s => s.minutesUntil as number)
      .sort((a, b) => a - b);
    return upcoming[0] ?? null;
  }, [sessions]);

  const todayStats = useMemo(() => {
    const total = sessions.length;
    const completed = sessions.filter(s => s.status === 'COMPLETED').length;
    const inProgress = sessions.filter(s => s.status === 'IN_PROGRESS').length;
    const scheduled = sessions.filter(s => s.status === 'SCHEDULED').length;
    return { total, completed, inProgress, scheduled };
  }, [sessions]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      setError(null);

      try {
        const [consults, earn, clientsList] = await Promise.allSettled([
          api.get('/consultations/my').catch(() => null),
          api.get('/psychologists/me/earnings').catch(() => null),
          api.get('/psychologists/me/clients').catch(() => null),
        ]);

        if (cancelled) return;

        let mappedSessions: SessionItem[] = [];
        if (consults.status === 'fulfilled' && consults.value?.data) {
          const list: Array<{
            id: string;
            scheduledAt: string;
            status: SessionStatus;
            childName?: string;
            childAge?: number;
            reason?: string;
            riskZone?: Zone;
          }> = Array.isArray(consults.value.data) ? consults.value.data : (consults.value.data.items ?? []);
          const todayKey = new Date().toDateString();
          mappedSessions = list
            .filter(c => new Date(c.scheduledAt).toDateString() === todayKey)
            .map(c => ({
              id: c.id,
              time: formatTime(c.scheduledAt),
              name: c.childName ?? 'Клиент',
              age: c.childAge ?? 0,
              reason: c.reason ?? 'Консультация',
              zone: c.riskZone ?? 'norm',
              status: c.status,
              minutesUntil: c.status === 'SCHEDULED' ? minutesUntilFrom(c.scheduledAt) : null,
            }))
            .sort((a, b) => a.time.localeCompare(b.time));
        }
        setSessions(mappedSessions.length ? mappedSessions : FIXTURE_SESSIONS);

        if (earn.status === 'fulfilled' && earn.value?.data) {
          const d = earn.value.data;
          setEarnings({
            amountKzt: Number(d.amountKzt ?? d.total ?? 0) || FIXTURE_EARNINGS.amountKzt,
            sessions: Number(d.sessions ?? d.count ?? 0) || FIXTURE_EARNINGS.sessions,
            averageKzt: Number(d.averageKzt ?? d.average ?? 0) || FIXTURE_EARNINGS.averageKzt,
            payoutDate: d.payoutDate ?? FIXTURE_EARNINGS.payoutDate,
            commissionPct: Number(d.commissionPct ?? FIXTURE_EARNINGS.commissionPct),
          });
        } else {
          setEarnings(FIXTURE_EARNINGS);
        }

        if (clientsList.status === 'fulfilled' && clientsList.value?.data) {
          const list: Array<{
            id: string; name?: string; childName?: string; childAge?: number;
            sessionsCount?: number; riskZone?: Zone; lastConsultation?: string;
          }> = Array.isArray(clientsList.value.data) ? clientsList.value.data : (clientsList.value.data.items ?? []);
          const flagged = list
            .filter(c => c.riskZone === 'risk' || c.riskZone === 'warn')
            .slice(0, 5)
            .map<WatchItem>(c => ({
              id: c.id,
              name: c.childName ?? c.name ?? '—',
              age: c.childAge ?? 0,
              klass: c.sessionsCount ? `${c.sessionsCount} сессий` : 'новый запрос',
              zone: (c.riskZone as 'risk' | 'warn') ?? 'warn',
              last: c.lastConsultation
                ? new Date(c.lastConsultation).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })
                : 'не было',
              tone: avatarToneFor(c.childName ?? c.name ?? ''),
            }));
          setWatch(flagged.length ? flagged : FIXTURE_WATCH);
        } else {
          setWatch(FIXTURE_WATCH);
        }

        setQueue(FIXTURE_QUEUE);
      } catch (e: unknown) {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : 'Не удалось загрузить данные');
        setSessions(FIXTURE_SESSIONS);
        setQueue(FIXTURE_QUEUE);
        setWatch(FIXTURE_WATCH);
        setEarnings(FIXTURE_EARNINGS);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, []);

  const greetingFirstName = userName.split(' ')[0] || 'коллега';

  const filteredQueue = useMemo(() => {
    let list = queue;
    if (queueFilter === 'urgent') list = list.filter(q => q.urgent);
    if (queueFilter === 'new') list = list.slice(0, 3);
    if (sort === 'urgent') list = [...list].sort((a, b) => Number(b.urgent ?? false) - Number(a.urgent ?? false));
    if (sort === 'age') list = [...list].sort((a, b) => a.age - b.age);
    return list;
  }, [queue, queueFilter, sort]);

  const queueCounts = useMemo(() => ({
    all: queue.length,
    urgent: queue.filter(q => q.urgent).length,
    new: Math.min(3, queue.length),
    week: queue.length,
  }), [queue]);

  const onConfirm = (id: string) => {
    setQueue(prev => prev.filter(q => q.id !== id));
    api.put(`/consultations/${id}/confirm`).catch(() => null);
  };
  const onReject = (id: string) => {
    setQueue(prev => prev.filter(q => q.id !== id));
    api.put(`/consultations/${id}/reject`, { reason: 'rejected via workbench' }).catch(() => null);
  };
  const onPropose = (_id: string) => {
    // wire date picker later
  };

  return (
    <div className="psy-shell">
      <style jsx global>{`
        .psy-shell {
          --psy-brand-600: #6D4AFF;
          --psy-brand-400: #B66BFF;
          --psy-brand-50: #F4F0FF;
          --psy-brand-100: #EAE2FF;
          --psy-brand-grad: linear-gradient(135deg, #6D4AFF 0%, #B66BFF 100%);
          --psy-brand-grad-soft: linear-gradient(135deg, #F4F0FF 0%, #FBF1FF 100%);
          --psy-ink-900: #0E0B22;
          --psy-ink-700: #2A2640;
          --psy-ink-500: #595673;
          --psy-ink-400: #8480A0;
          --psy-ink-300: #B7B3CC;
          --psy-ink-200: #E5E1F0;
          --psy-ink-100: #F1EEF8;
          --psy-ink-50: #F8F6FD;
          --psy-card: #FFFFFF;
          --psy-line: #ECE9F5;
          --psy-ok-50: #ECFDF3;
          --psy-ok-100: #D1FADF;
          --psy-ok-500: #12B76A;
          --psy-ok-700: #027A48;
          --psy-warn-50: #FFFAEB;
          --psy-warn-100: #FEF0C7;
          --psy-warn-500: #F79009;
          --psy-warn-700: #B54708;
          --psy-risk-50: #FEF3F2;
          --psy-risk-100: #FEE4E2;
          --psy-risk-500: #F04438;
          --psy-risk-700: #B42318;
          --psy-gold-50: #FFF8E1;
          --psy-gold-700: #8A6500;
          --psy-shadow-sm: 0 1px 2px rgba(20, 14, 60, 0.04), 0 1px 1px rgba(20, 14, 60, 0.02);
          --psy-shadow-brand: 0 12px 28px rgba(109, 74, 255, 0.28);
          --psy-font-display: 'Manrope', 'Inter', system-ui, sans-serif;
          --psy-font-body: 'Inter', 'Manrope', system-ui, -apple-system, sans-serif;

          font-family: var(--psy-font-body);
          color: var(--psy-ink-900);
          background: #FBFAFE;
          padding: 28px 32px 64px;
          max-width: 1440px;
          margin: 0 auto;
        }

        @media (prefers-reduced-motion: reduce) {
          .psy-shell *, .psy-shell *::before, .psy-shell *::after {
            animation-duration: 0.001ms !important;
            transition-duration: 0.001ms !important;
          }
        }

        .psy-shell :focus-visible {
          outline: 2px solid var(--psy-brand-600);
          outline-offset: 2px;
        }

        .psy-h-1 {
          font-family: var(--psy-font-display); font-weight: 800;
          font-size: 36px; line-height: 1.12; letter-spacing: -0.02em;
        }
        .psy-h-3 {
          font-family: var(--psy-font-display); font-weight: 700;
          font-size: 22px; line-height: 1.3; letter-spacing: -0.01em;
        }
        .psy-h-4 {
          font-family: var(--psy-font-display); font-weight: 700;
          font-size: 16px; line-height: 1.35;
        }
        .psy-shell .muted { color: var(--psy-ink-500); }

        .psy-shell .psy-card {
          background: var(--psy-card);
          border: 1px solid var(--psy-line);
          border-radius: 20px;
          box-shadow: var(--psy-shadow-sm);
        }

        .psy-shell .psy-btn {
          display: inline-flex; align-items: center; justify-content: center;
          gap: 8px; padding: 12px 18px;
          border-radius: 12px; font-size: 14px; font-weight: 600;
          line-height: 1; transition: transform .12s, box-shadow .15s, background .15s, color .15s;
          white-space: nowrap; border: 1px solid transparent;
          cursor: pointer; min-height: 44px;
        }
        .psy-shell .psy-btn:hover { transform: translateY(-1px); }
        .psy-shell .psy-btn-primary {
          background: var(--psy-brand-grad); color: #fff;
          box-shadow: var(--psy-shadow-brand);
        }
        .psy-shell .psy-btn-primary:hover { box-shadow: 0 14px 32px rgba(109, 74, 255, .36); }
        .psy-shell .psy-btn-secondary {
          background: #fff; color: var(--psy-ink-900);
          border-color: var(--psy-line); box-shadow: var(--psy-shadow-sm);
        }
        .psy-shell .psy-btn-secondary:hover { background: var(--psy-ink-50); }
        .psy-shell .psy-btn-ghost { color: var(--psy-ink-700); background: transparent; }
        .psy-shell .psy-btn-ghost:hover { background: var(--psy-ink-100); }
        .psy-shell .psy-btn-confirm { background: var(--psy-ok-500); color: #fff; }
        .psy-shell .psy-btn-confirm:hover { background: var(--psy-ok-700); }
        .psy-shell .psy-btn-pdf {
          background: linear-gradient(135deg, #FFF8E1 0%, #FFEDB5 100%);
          color: var(--psy-gold-700); border-color: #FCE39C;
        }
        .psy-shell .psy-btn-sm {
          padding: 10px 14px; font-size: 13px; border-radius: 10px;
        }

        .psy-shell .psy-badge {
          display: inline-flex; align-items: center; gap: 5px;
          padding: 4px 10px; border-radius: 999px;
          font-size: 11.5px; font-weight: 600;
          white-space: nowrap;
        }
        .psy-shell .psy-badge::before {
          content: ''; width: 6px; height: 6px;
          border-radius: 999px; background: currentColor; flex-shrink: 0;
        }
        .psy-shell .psy-badge-norm { background: var(--psy-ok-50); color: var(--psy-ok-700); }
        .psy-shell .psy-badge-warn { background: var(--psy-warn-50); color: var(--psy-warn-700); }
        .psy-shell .psy-badge-risk { background: var(--psy-risk-50); color: var(--psy-risk-700); }
        .psy-shell .psy-badge-plain {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 4px 10px; border-radius: 999px;
          font-size: 11.5px; font-weight: 600;
          background: var(--psy-ink-100); color: var(--psy-ink-700);
        }

        .psy-shell .psy-chip {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 9px 14px; border-radius: 999px;
          background: #fff; border: 1px solid var(--psy-line);
          font-size: 13px; font-weight: 500;
          color: var(--psy-ink-700); cursor: pointer;
          transition: all .15s; min-height: 44px;
        }
        .psy-shell .psy-chip:hover { border-color: var(--psy-brand-400); color: var(--psy-ink-900); }
        .psy-shell .psy-chip.is-active {
          background: var(--psy-ink-900); color: #fff; border-color: var(--psy-ink-900);
        }
        .psy-shell .psy-chip-count {
          font-size: 11px; font-weight: 700;
          padding: 1px 7px; border-radius: 999px;
          background: var(--psy-ink-100); color: var(--psy-ink-500);
        }
        .psy-shell .psy-chip.is-active .psy-chip-count {
          background: rgba(255, 255, 255, 0.18); color: #fff;
        }

        .psy-shell .psy-avatar {
          display: grid; place-items: center;
          border-radius: 999px; color: #fff; font-weight: 700;
          flex-shrink: 0;
        }
        .psy-shell .psy-avatar-md { width: 44px; height: 44px; font-size: 14px; }
        .psy-shell .psy-avatar-lg { width: 56px; height: 56px; font-size: 18px; }
        .psy-shell .tone-warm { background: linear-gradient(135deg, #FFB36B 0%, #FF7BB5 100%); }
        .psy-shell .tone-sky  { background: linear-gradient(135deg, #6BC8FF 0%, #6D4AFF 100%); }
        .psy-shell .tone-mint { background: linear-gradient(135deg, #6BE0B5 0%, #6BC8FF 100%); }
        .psy-shell .tone-rose { background: linear-gradient(135deg, #FF8FB1 0%, #B66BFF 100%); }
        .psy-shell .tone-sun  { background: linear-gradient(135deg, #FFD56B 0%, #FF8F6B 100%); }

        .psy-shell .psy-row-gap { display: flex; align-items: center; gap: 8px; }
        .psy-shell .psy-grid-2 { display: grid; grid-template-columns: 2fr 1fr; gap: 24px; }
        .psy-shell .psy-grid-eq { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
        .psy-shell .psy-grid-nav { display: grid; grid-template-columns: repeat(5, 1fr); gap: 16px; }
        @media (max-width: 1100px) {
          .psy-shell .psy-grid-2,
          .psy-shell .psy-grid-eq { grid-template-columns: 1fr; }
          .psy-shell .psy-grid-nav { grid-template-columns: repeat(3, 1fr); }
        }
        @media (max-width: 640px) {
          .psy-shell { padding: 20px 16px 48px; }
          .psy-shell .psy-grid-nav { grid-template-columns: repeat(2, 1fr); }
          .psy-shell .psy-h-1 { font-size: 28px; }
        }

        .psy-shell .psy-timeline { position: relative; padding-left: 92px; }
        .psy-shell .psy-timeline::before {
          content: ''; position: absolute;
          left: 36px; top: 18px; bottom: 18px;
          width: 2px; background: var(--psy-ink-200);
          border-radius: 999px;
        }
        .psy-shell .psy-timeline-row { position: relative; }
        .psy-shell .psy-timeline-time {
          position: absolute; left: -92px; top: 16px; width: 72px;
          font-family: var(--psy-font-display); font-weight: 700; font-size: 18px;
          color: var(--psy-ink-700); text-align: right;
          font-variant-numeric: tabular-nums;
        }
        .psy-shell .psy-timeline-time[data-status="IN_PROGRESS"] { color: var(--psy-brand-600); }
        .psy-shell .psy-timeline-time[data-status="COMPLETED"]   { color: var(--psy-ink-400); }
        .psy-shell .psy-timeline-dot {
          position: absolute; left: -60px; top: 22px;
          width: 16px; height: 16px; border-radius: 999px;
          background: #fff; border: 2px solid var(--psy-ink-300);
          z-index: 2; display: grid; place-items: center;
        }
        .psy-shell .psy-timeline-dot[data-status="IN_PROGRESS"] {
          background: var(--psy-brand-grad); border: 0;
          box-shadow: 0 0 0 5px rgba(109, 74, 255, .15);
          color: #fff;
        }
        .psy-shell .psy-timeline-dot[data-status="COMPLETED"] {
          background: var(--psy-ink-300); border: 0; color: #fff;
        }

        .psy-shell .psy-session-card {
          padding: 22px;
          background: #fff;
          border: 1px solid var(--psy-line);
          border-radius: 18px;
          display: flex; gap: 16px; align-items: center;
          box-shadow: var(--psy-shadow-sm);
        }
        .psy-shell .psy-session-card[data-status="IN_PROGRESS"] {
          background: var(--psy-brand-50);
          border-color: #D7CCFF;
          box-shadow: 0 8px 24px rgba(109, 74, 255, .12);
        }
        .psy-shell .psy-session-card[data-status="COMPLETED"] {
          background: var(--psy-ink-50);
          opacity: 0.78;
        }
        .psy-shell .psy-name { font-weight: 700; font-size: 17px; }
        .psy-shell .psy-reason {
          font-size: 13px; color: var(--psy-ink-500); line-height: 1.45;
        }
        .psy-shell .psy-session-actions {
          display: flex; gap: 8px; flex-shrink: 0; flex-wrap: wrap; justify-content: flex-end;
        }
        .psy-shell .psy-live-dot {
          width: 6px; height: 6px; border-radius: 999px;
          background: #fff; flex-shrink: 0;
        }

        .psy-shell .psy-queue-row {
          padding: 18px; border-radius: 14px;
          border: 1px solid var(--psy-line);
          background: #fff;
          display: flex; align-items: center; gap: 16px;
        }
        .psy-shell .psy-queue-row[data-urgent="true"] {
          background: var(--psy-risk-50);
          border-color: var(--psy-risk-100);
        }
        .psy-shell .psy-queue-name { font-weight: 600; font-size: 13.5px; }
        .psy-shell .psy-queue-meta { font-size: 12px; color: var(--psy-ink-500); margin-bottom: 4px; }
        .psy-shell .psy-queue-reason {
          font-size: 13px; color: var(--psy-ink-700); line-height: 1.4;
        }
        .psy-shell .psy-queue-actions {
          display: flex; gap: 8px; flex-shrink: 0; flex-wrap: wrap;
        }

        .psy-shell .psy-watch-row {
          display: flex; align-items: center; gap: 12px;
          padding: 12px 8px; border-radius: 12px;
          text-decoration: none; color: inherit;
          transition: background .15s;
        }
        .psy-shell .psy-watch-row:hover { background: var(--psy-ink-50); }
        .psy-shell .psy-watch-name {
          font-weight: 600; font-size: 13.5px;
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .psy-shell .psy-watch-meta {
          font-size: 12px; color: var(--psy-ink-500); margin-top: 2px;
        }

        .psy-shell .psy-nav-tile {
          display: flex; flex-direction: column; gap: 12px;
          padding: 22px;
          background: var(--psy-card);
          border: 1px solid var(--psy-line);
          border-radius: 20px;
          box-shadow: var(--psy-shadow-sm);
          text-decoration: none; color: inherit;
          transition: transform .15s, border-color .15s;
          min-height: 132px;
        }
        .psy-shell .psy-nav-tile:hover {
          transform: translateY(-2px);
          border-color: var(--psy-brand-400);
        }
        .psy-shell .psy-nav-tile-icon {
          width: 40px; height: 40px; border-radius: 11px;
          background: var(--psy-brand-50); color: var(--psy-brand-600);
          display: grid; place-items: center;
        }
        .psy-shell .psy-nav-tile-title {
          font-family: var(--psy-font-display);
          font-size: 15px; font-weight: 700;
        }
        .psy-shell .psy-nav-tile-desc {
          font-size: 12px; color: var(--psy-ink-500); line-height: 1.5; margin-top: 4px;
        }

        .psy-shell .psy-card-featured {
          background: var(--psy-brand-grad);
          color: #fff;
          border-radius: 20px;
          padding: 28px;
          box-shadow: var(--psy-shadow-brand);
          position: relative; overflow: hidden;
        }
        .psy-shell .psy-card-featured::before {
          content: '';
          position: absolute; inset: 0;
          background: radial-gradient(120% 80% at 100% 0%, rgba(255,255,255,0.18) 0%, transparent 50%);
          pointer-events: none;
        }
        .psy-shell .psy-h-display {
          font-family: var(--psy-font-display); font-weight: 800;
          font-size: 44px; line-height: 1.05; letter-spacing: -0.02em;
        }

        .psy-shell .psy-skel-row {
          height: 100px; border-radius: 18px;
          background: linear-gradient(90deg, var(--psy-ink-100) 0%, var(--psy-ink-50) 50%, var(--psy-ink-100) 100%);
          background-size: 200% 100%;
          animation: psyShimmer 1.6s linear infinite;
        }
        @keyframes psyShimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }

        .psy-shell .psy-state-empty {
          display: flex; flex-direction: column;
          align-items: center; text-align: center;
          padding: 32px 24px;
          background: #fff; border-radius: 18px;
          border: 1px dashed var(--psy-ink-200);
        }
        .psy-shell .psy-empty-illo {
          width: 64px; height: 64px; border-radius: 18px;
          background: var(--psy-brand-grad-soft);
          color: var(--psy-brand-600);
          display: grid; place-items: center;
          margin-bottom: 14px;
        }
        .psy-shell .psy-empty-title {
          font-family: var(--psy-font-display); font-weight: 700;
          font-size: 15px; margin-bottom: 4px;
        }
        .psy-shell .psy-empty-desc {
          font-size: 12.5px; color: var(--psy-ink-500);
          max-width: 320px; line-height: 1.5; margin-bottom: 14px;
        }

        .psy-shell .psy-review {
          padding: 14px; border-radius: 12px;
          background: var(--psy-ink-50);
          position: relative;
        }
        .psy-shell .psy-review::before {
          content: ''; position: absolute;
          left: -2px; top: 18px; bottom: 18px; width: 3px;
          background: var(--psy-brand-400); border-radius: 999px;
        }
        .psy-shell .psy-review-quote {
          font-size: 13px; color: var(--psy-ink-700); line-height: 1.45;
        }
      `}</style>

      {/* Greeting + role chips */}
      <header
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          marginBottom: 32,
          flexWrap: 'wrap',
          gap: 16,
        }}
      >
        <div>
          <h1 className="psy-h-1">Добрый день, {greetingFirstName}.</h1>
          <p className="muted" style={{ fontSize: 16, marginTop: 8 }}>
            {todayStats.total > 0
              ? `Сегодня ${todayStats.total} ${todayStats.total === 1 ? 'консультация' : 'консультаций'}${nearestMinutes != null ? `, ближайшая через ${nearestMinutes} мин.` : '.'}`
              : 'Сегодня свободно. Хороший день, чтобы обновить заметки или принять новые запросы.'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <span className="psy-chip" style={{ gap: 8 }}>
            <Icon name="star" size={13} stroke={2.5} style={{ color: '#F79009' }}/>
            <span>Профиль: {rating.value.toFixed(1)}</span>
          </span>
          <button
            type="button"
            role="switch"
            aria-checked={acceptNew}
            aria-label="Принимаю новых клиентов"
            onClick={() => setAcceptNew(v => !v)}
            className="psy-chip"
            style={{
              gap: 10,
              background: acceptNew ? 'var(--psy-ok-50)' : '#fff',
              color: acceptNew ? 'var(--psy-ok-700)' : 'var(--psy-ink-500)',
              borderColor: acceptNew ? 'var(--psy-ok-100)' : 'var(--psy-line)',
            }}
          >
            <span
              aria-hidden
              style={{
                width: 32, height: 18, borderRadius: 999,
                background: acceptNew ? 'var(--psy-ok-500)' : 'var(--psy-ink-300)',
                position: 'relative', transition: 'background .2s',
              }}
            >
              <span
                style={{
                  position: 'absolute', top: 2, left: acceptNew ? 16 : 2,
                  width: 14, height: 14, borderRadius: 999, background: '#fff',
                  transition: 'left .2s', boxShadow: '0 1px 2px rgba(0,0,0,0.2)',
                }}
              />
            </span>
            Принимаю новых
          </button>
        </div>
      </header>

      {/* Today timeline */}
      <section style={{ marginBottom: 40 }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 20,
            flexWrap: 'wrap',
            gap: 12,
          }}
        >
          <div>
            <div className="psy-h-3">Сегодня, {todayLabel()}</div>
            <div className="muted" style={{ fontSize: 13, marginTop: 4 }}>
              {todayStats.total} {todayStats.total === 1 ? 'слот' : 'слотов'}:&nbsp;
              {todayStats.completed} завершено, {todayStats.inProgress} {todayStats.inProgress === 1 ? 'идёт' : 'идут'}, {todayStats.scheduled} запланировано
            </div>
          </div>
          <Link href="/schedule" className="psy-btn psy-btn-ghost psy-btn-sm">
            Открыть расписание <Icon name="arrow" size={13}/>
          </Link>
        </div>

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <SkeletonRow /><SkeletonRow /><SkeletonRow />
          </div>
        ) : sessions.length === 0 ? (
          <div className="psy-state-empty">
            <div className="psy-empty-illo"><Icon name="calendar" size={26}/></div>
            <div className="psy-empty-title">Сегодня нет консультаций</div>
            <div className="psy-empty-desc">Подтвердите запросы из очереди ниже или настройте свободные слоты в расписании.</div>
            <Link href="/schedule" className="psy-btn psy-btn-primary psy-btn-sm">Настроить расписание</Link>
          </div>
        ) : (
          <div className="psy-timeline">
            {sessions.map((s, i) => (
              <TimelineRow key={s.id} s={s} isLast={i === sessions.length - 1}/>
            ))}
          </div>
        )}
      </section>

      {/* Two-column: queue + watch */}
      <div className="psy-grid-2" style={{ marginBottom: 40 }}>
        <div className="psy-card" style={{ padding: 24 }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 16,
              flexWrap: 'wrap',
              gap: 12,
            }}
          >
            <div>
              <div className="psy-h-4">Очередь консультаций на подтверждение</div>
              <div className="muted" style={{ fontSize: 13, marginTop: 4 }}>
                Подтвердите или предложите другое время
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <label className="muted" htmlFor="psy-sort" style={{ fontSize: 12 }}>Сортировка</label>
              <select
                id="psy-sort"
                value={sort}
                onChange={e => setSort(e.target.value as typeof sort)}
                aria-label="Сортировка очереди"
                style={{
                  padding: '10px 14px',
                  borderRadius: 10,
                  border: '1px solid var(--psy-line)',
                  background: '#fff',
                  fontSize: 13,
                  fontWeight: 500,
                  minHeight: 44,
                  color: 'var(--psy-ink-700)',
                  fontFamily: 'var(--psy-font-body)',
                }}
              >
                <option value="date">По дате запроса</option>
                <option value="urgent">По срочности</option>
                <option value="age">По возрасту</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
            {([
              ['all', 'Все', queueCounts.all],
              ['urgent', 'Срочные', queueCounts.urgent],
              ['new', 'Новые', queueCounts.new],
              ['week', 'Этой недели', queueCounts.week],
            ] as const).map(([k, l, c]) => (
              <button
                key={k}
                type="button"
                className={`psy-chip ${queueFilter === k ? 'is-active' : ''}`}
                onClick={() => setQueueFilter(k)}
                aria-pressed={queueFilter === k}
              >
                {l} <span className="psy-chip-count">{c}</span>
              </button>
            ))}
          </div>

          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <SkeletonRow /><SkeletonRow /><SkeletonRow />
            </div>
          ) : error ? (
            <div className="psy-state-empty" role="alert">
              <div className="psy-empty-illo" style={{ background: 'var(--psy-risk-50)', color: 'var(--psy-risk-700)' }}>
                <Icon name="info" size={26}/>
              </div>
              <div className="psy-empty-title">Не удалось загрузить очередь</div>
              <div className="psy-empty-desc">Проверьте интернет и попробуйте снова. Если повторится, напишите в поддержку.</div>
              <button type="button" className="psy-btn psy-btn-secondary psy-btn-sm" onClick={() => location.reload()}>
                Повторить
              </button>
            </div>
          ) : filteredQueue.length === 0 ? (
            <QueueEmpty />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {filteredQueue.map(q => (
                <QueueRow
                  key={q.id}
                  q={q}
                  onConfirm={onConfirm}
                  onReject={onReject}
                  onPropose={onPropose}
                />
              ))}
            </div>
          )}
        </div>

        <div className="psy-card" style={{ padding: 24 }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 16,
            }}
          >
            <div>
              <div className="psy-h-4">Следить за</div>
              <div className="muted" style={{ fontSize: 13, marginTop: 4 }}>Дети, требующие наблюдения</div>
            </div>
            <Link
              href="/risk-students"
              style={{ fontSize: 12, fontWeight: 600, color: 'var(--psy-brand-600)', textDecoration: 'none' }}
            >
              Все {watch.length || 12}
            </Link>
          </div>
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <SkeletonRow /><SkeletonRow />
            </div>
          ) : watch.length === 0 ? (
            <div className="psy-state-empty" style={{ padding: 20 }}>
              <div className="psy-empty-title">Все спокойно</div>
              <div className="psy-empty-desc">Сейчас никто из ваших клиентов не требует особого внимания.</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {watch.map(w => <WatchRow key={w.id} w={w} />)}
            </div>
          )}
        </div>
      </div>

      {/* Earnings + reviews */}
      <div className="psy-grid-eq" style={{ marginBottom: 40 }}>
        <div className="psy-card-featured">
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 16,
            }}
          >
            <div
              style={{
                fontSize: 12,
                opacity: 0.85,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
              }}
            >
              Заработок месяца
            </div>
            <span
              className="psy-badge-plain"
              style={{ background: 'rgba(255,255,255,0.18)', color: '#fff' }}
            >
              Май 2026
            </span>
          </div>
          <div className="psy-h-display" style={{ color: '#fff', marginBottom: 8 }}>
            {earnings ? formatKzt(earnings.amountKzt) : '—'}
          </div>
          {earnings && (
            <>
              <div style={{ fontSize: 13.5, opacity: 0.9, marginBottom: 4 }}>
                {earnings.sessions} {earnings.sessions === 1 ? 'консультация' : 'консультаций'}, средний чек {formatKzt(earnings.averageKzt)}
              </div>
              <div style={{ fontSize: 13.5, opacity: 0.85, marginBottom: 20 }}>
                К выплате {earnings.payoutDate}. Комиссия {earnings.commissionPct}% уже учтена.
              </div>
            </>
          )}
          <div style={{ display: 'flex', gap: 8 }}>
            <Link href="/earnings" className="psy-btn psy-btn-secondary">
              Подробнее <Icon name="arrow" size={14}/>
            </Link>
            <button
              type="button"
              className="psy-btn psy-btn-ghost"
              aria-label="Скачать чек ИП"
              style={{ color: '#fff', background: 'rgba(255,255,255,0.12)' }}
            >
              <Icon name="download" size={14}/> Чек ИП
            </button>
          </div>
        </div>

        <div className="psy-card" style={{ padding: 28 }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 16,
            }}
          >
            <div className="psy-h-4">Рейтинг и отзывы</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Icon name="star" size={18} stroke={2.5} style={{ color: '#F79009' }}/>
              <span
                style={{
                  fontSize: 20,
                  fontWeight: 700,
                  fontFamily: 'var(--psy-font-display)',
                }}
              >
                {rating.value.toFixed(1)}
              </span>
              <span className="muted" style={{ fontSize: 12 }}>из 5</span>
            </div>
          </div>
          <div className="muted" style={{ fontSize: 12, marginBottom: 16 }}>
            {rating.count} отзывов от родителей. 3 недавних:
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {FIXTURE_REVIEWS.map((t, i) => (
              <div key={i} className="psy-review">
                <div
                  style={{ display: 'flex', gap: 2, marginBottom: 8, color: '#F79009' }}
                  aria-label="Рейтинг 5 из 5"
                >
                  {[0, 1, 2, 3, 4].map(j => <Icon key={j} name="star" size={11} stroke={2.5}/>)}
                </div>
                <div className="psy-review-quote">«{t}»</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick navigation tiles */}
      <section>
        <div className="psy-h-3" style={{ marginBottom: 16 }}>Быстрая навигация</div>
        <div className="psy-grid-nav">
          <NavTile icon="calendar" title="Расписание" desc="Слоты, отгулы, рабочая неделя" href="/schedule"/>
          <NavTile icon="users" title="Все клиенты" desc={`${watch.length || 18} активных, 6 на паузе`} href="/clients"/>
          <NavTile icon="clock" title="История консультаций" desc="412 сессий за всё время" href="/consultations"/>
          <NavTile icon="book" title="Заметки и кейсы" desc="Закрытый протокол по детям" href="/cases"/>
          <NavTile icon="file" title="Документы" desc="Договоры, акты, чеки" href="/earnings"/>
        </div>
      </section>

      {/* Setup hint when accept-new is off */}
      {!acceptNew && (
        <div
          role="status"
          style={{
            marginTop: 24,
            padding: 14,
            borderRadius: 12,
            background: 'var(--psy-warn-50)',
            border: '1px solid var(--psy-warn-100)',
            display: 'flex',
            gap: 12,
            alignItems: 'flex-start',
          }}
        >
          <Icon name="info" size={18} stroke={2} style={{ color: 'var(--psy-warn-700)', flexShrink: 0, marginTop: 2 }}/>
          <div style={{ color: 'var(--psy-warn-700)' }}>
            <div style={{ fontWeight: 600, fontSize: 13.5 }}>Вы не принимаете новых клиентов</div>
            <div style={{ fontSize: 12, marginTop: 4, opacity: 0.85, lineHeight: 1.5 }}>
              Новые запросы временно не попадают в очередь. Включите тумблер выше, когда будете готовы.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
