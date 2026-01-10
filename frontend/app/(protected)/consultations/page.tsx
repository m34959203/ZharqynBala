'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardBody, Button, Skeleton, EmptyStateNoConsultations, EmptyState } from '@/components/ui';
import { UserRole } from '@/types/auth';

interface Psychologist {
  id: string;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
  specialization: string[];
  languages: string[];
  experienceYears: number;
  education: string;
  bio: string | null;
  hourlyRate: number;
  rating: number;
  totalConsultations: number;
  isAvailable: boolean;
}

interface Consultation {
  id: string;
  psychologistId: string;
  psychologistName: string;
  psychologistAvatarUrl: string | null;
  clientName: string;
  childName: string | null;
  scheduledAt: string;
  durationMinutes: number;
  status: string;
  price: number;
  paymentStatus: string;
}

interface Child {
  id: string;
  firstName: string;
  lastName: string;
}

interface PsychologistsResponse {
  psychologists: Psychologist[];
  total: number;
  page: number;
  limit: number;
}

interface ConsultationsResponse {
  consultations: Consultation[];
  total: number;
  page: number;
  limit: number;
}

const SPECIALIZATIONS = [
  { value: '', label: 'Все специализации' },
  { value: 'Детский психолог', label: 'Детский психолог' },
  { value: 'Семейный психолог', label: 'Семейный психолог' },
  { value: 'Клинический психолог', label: 'Клинический психолог' },
  { value: 'Психотерапевт', label: 'Психотерапевт' },
];

const STATUS_LABELS: Record<string, { text: string; color: string }> = {
  PENDING: { text: 'Ожидает', color: 'bg-yellow-100 text-yellow-800' },
  CONFIRMED: { text: 'Подтверждена', color: 'bg-green-100 text-green-800' },
  REJECTED: { text: 'Отклонена', color: 'bg-red-100 text-red-800' },
  IN_PROGRESS: { text: 'Идёт', color: 'bg-blue-100 text-blue-800' },
  COMPLETED: { text: 'Завершена', color: 'bg-gray-100 text-gray-800' },
  CANCELLED: { text: 'Отменена', color: 'bg-gray-100 text-gray-800' },
  NO_SHOW: { text: 'Неявка', color: 'bg-red-100 text-red-800' },
};

interface AvailableSlot {
  date: string;
  hour: number;
}

interface BookingModalProps {
  psychologist: Psychologist;
  onClose: () => void;
  onSuccess: () => void;
}

function BookingModal({ psychologist, onClose, onSuccess }: BookingModalProps) {
  const [children, setChildren] = useState<Child[]>([]);
  const [selectedChild, setSelectedChild] = useState<string>('');
  const [selectedSlot, setSelectedSlot] = useState<{ date: string; hour: number } | null>(null);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [slotsLoading, setSlotsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [availableSlots, setAvailableSlots] = useState<AvailableSlot[]>([]);
  const [weekOffset, setWeekOffset] = useState(0);

  // Получаем даты текущей недели
  const getWeekDates = useCallback(() => {
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay() + 1 + weekOffset * 7); // Понедельник

    const dates: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      dates.push(date);
    }
    return dates;
  }, [weekOffset]);

  const weekDates = getWeekDates();
  const weekStart = weekDates[0].toISOString().split('T')[0];
  const weekEnd = weekDates[6].toISOString().split('T')[0];

  useEffect(() => {
    // Загружаем список детей
    fetch('/api/children')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setChildren(data);
        }
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    // Загружаем доступные слоты психолога
    const fetchSlots = async () => {
      setSlotsLoading(true);
      try {
        const response = await fetch(
          `/api/psychologists/${psychologist.id}/slots?startDate=${weekStart}&endDate=${weekEnd}`
        );
        if (response.ok) {
          const data = await response.json();
          setAvailableSlots(data || []);
        }
      } catch (err) {
        console.error('Failed to fetch slots:', err);
      } finally {
        setSlotsLoading(false);
      }
    };
    fetchSlots();
  }, [psychologist.id, weekStart, weekEnd]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSlot) return;

    setLoading(true);
    setError(null);

    try {
      const scheduledAt = new Date(`${selectedSlot.date}T${selectedSlot.hour.toString().padStart(2, '0')}:00:00`).toISOString();

      const response = await fetch('/api/consultations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          psychologistId: psychologist.id,
          childId: selectedChild || undefined,
          scheduledAt,
          notes: notes || undefined,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Ошибка записи');
      }

      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Произошла ошибка');
    } finally {
      setLoading(false);
    }
  };

  const isSlotAvailable = (date: string, hour: number) => {
    return availableSlots.some((slot) => slot.date === date && slot.hour === hour);
  };

  const isSlotSelected = (date: string, hour: number) => {
    return selectedSlot?.date === date && selectedSlot?.hour === hour;
  };

  const isPastDate = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  const dayNames = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
  const hours = Array.from({ length: 12 }, (_, i) => 9 + i); // 9:00 - 20:00

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[95vh] w-full max-w-4xl overflow-hidden rounded-xl bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b p-4">
          <h2 className="text-xl font-bold text-gray-900">Запись на консультацию</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex flex-col lg:flex-row">
          {/* Left sidebar - psychologist info */}
          <div className="border-b p-4 lg:w-64 lg:border-b-0 lg:border-r">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-14 w-14 flex-shrink-0 overflow-hidden rounded-full bg-indigo-100">
                {psychologist.avatarUrl ? (
                  <img src={psychologist.avatarUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-xl font-bold text-indigo-600">
                    {psychologist.firstName[0]}
                  </div>
                )}
              </div>
              <div>
                <p className="font-semibold text-gray-900">
                  {psychologist.firstName} {psychologist.lastName}
                </p>
                <p className="text-lg font-bold text-indigo-600">
                  {psychologist.hourlyRate.toLocaleString()} тг
                </p>
              </div>
            </div>

            {/* Child selection */}
            {children.length > 0 && (
              <div className="mb-4">
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Для кого консультация?
                </label>
                <select
                  value={selectedChild}
                  onChange={(e) => setSelectedChild(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 p-2 text-sm"
                >
                  <option value="">Для себя</option>
                  {children.map((child) => (
                    <option key={child.id} value={child.id}>
                      {child.firstName} {child.lastName}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Notes */}
            <div className="mb-4">
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Причина обращения
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder="Опишите кратко..."
                className="w-full rounded-lg border border-gray-300 p-2 text-sm"
              />
            </div>

            {/* Legend */}
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 rounded bg-green-500"></div>
                <span className="text-gray-600">Свободно</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 rounded bg-indigo-600"></div>
                <span className="text-gray-600">Выбрано</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 rounded bg-gray-200"></div>
                <span className="text-gray-600">Недоступно</span>
              </div>
            </div>
          </div>

          {/* Calendar */}
          <div className="flex-1 overflow-auto p-4">
            {/* Week navigation */}
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={() => setWeekOffset((w) => w - 1)}
                disabled={weekOffset <= 0}
                className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <span className="font-medium text-gray-900">
                {formatDate(weekDates[0])} — {formatDate(weekDates[6])}
              </span>
              <button
                onClick={() => setWeekOffset((w) => w + 1)}
                disabled={weekOffset >= 4}
                className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            {slotsLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr>
                      <th className="p-2 text-xs text-gray-500 font-medium w-16">Время</th>
                      {weekDates.map((date, idx) => (
                        <th key={idx} className="p-2 text-center">
                          <div className="text-xs text-gray-500">{dayNames[idx]}</div>
                          <div className={`text-sm font-medium ${isPastDate(date) ? 'text-gray-400' : 'text-gray-900'}`}>
                            {date.getDate()}
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {hours.map((hour) => (
                      <tr key={hour}>
                        <td className="p-1 text-xs text-gray-500 text-right pr-2">
                          {hour.toString().padStart(2, '0')}:00
                        </td>
                        {weekDates.map((date, idx) => {
                          const dateStr = date.toISOString().split('T')[0];
                          const isAvailable = isSlotAvailable(dateStr, hour) && !isPastDate(date);
                          const isSelected = isSlotSelected(dateStr, hour);

                          return (
                            <td key={idx} className="p-1">
                              <button
                                type="button"
                                disabled={!isAvailable}
                                onClick={() => setSelectedSlot({ date: dateStr, hour })}
                                className={`w-full h-8 rounded text-xs font-medium transition-colors ${
                                  isSelected
                                    ? 'bg-indigo-600 text-white'
                                    : isAvailable
                                    ? 'bg-green-100 text-green-800 hover:bg-green-200'
                                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                }`}
                              >
                                {isAvailable ? (isSelected ? '✓' : '') : '—'}
                              </button>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {error && (
              <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t p-4 flex items-center justify-between">
          <div>
            {selectedSlot && (
              <p className="text-sm text-gray-600">
                Выбрано: <span className="font-medium text-gray-900">
                  {new Date(selectedSlot.date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })} в {selectedSlot.hour}:00
                </span>
              </p>
            )}
          </div>
          <div className="flex gap-3">
            <Button type="button" variant="outline" onClick={onClose}>
              Отмена
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={loading || !selectedSlot}
            >
              {loading ? 'Записываем...' : 'Записаться'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function PsychologistCard({
  psychologist,
  onBook,
}: {
  psychologist: Psychologist;
  onBook: (p: Psychologist) => void;
}) {
  const initials = `${psychologist.firstName[0]}${psychologist.lastName[0]}`.toUpperCase();

  return (
    <Card variant="elevated" className="overflow-hidden">
      <CardBody className="p-0">
        <div className="p-6">
          <div className="flex items-start gap-4">
            {/* Avatar */}
            <div className="flex-shrink-0">
              {psychologist.avatarUrl ? (
                <img
                  src={psychologist.avatarUrl}
                  alt={`${psychologist.firstName} ${psychologist.lastName}`}
                  className="w-16 h-16 rounded-full object-cover"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center">
                  <span className="text-lg font-semibold text-indigo-600">{initials}</span>
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-lg font-semibold text-gray-900 truncate">
                  {psychologist.firstName} {psychologist.lastName}
                </h3>
                {psychologist.isAvailable && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Доступен
                  </span>
                )}
              </div>

              {/* Rating */}
              <div className="flex items-center gap-2 mb-2">
                <div className="flex items-center">
                  <svg className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  <span className="ml-1 text-sm font-medium text-gray-700">
                    {psychologist.rating.toFixed(1)}
                  </span>
                </div>
                <span className="text-sm text-gray-500">
                  ({psychologist.totalConsultations} консультаций)
                </span>
              </div>

              {/* Specializations */}
              <div className="flex flex-wrap gap-1 mb-2">
                {psychologist.specialization.slice(0, 3).map((spec) => (
                  <span
                    key={spec}
                    className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-50 text-indigo-700"
                  >
                    {spec}
                  </span>
                ))}
              </div>

              {/* Languages */}
              <div className="flex flex-wrap gap-1 mb-3">
                {psychologist.languages?.map((lang) => (
                  <span
                    key={lang}
                    className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-50 text-green-700"
                  >
                    {lang}
                  </span>
                ))}
              </div>

              {/* Experience & Education */}
              <div className="text-sm text-gray-600 space-y-1">
                <p>
                  <span className="font-medium">Опыт:</span> {psychologist.experienceYears} лет
                </p>
                <p className="line-clamp-1">
                  <span className="font-medium">Образование:</span> {psychologist.education}
                </p>
              </div>
            </div>

            {/* Price */}
            <div className="flex-shrink-0 text-right">
              <div className="text-2xl font-bold text-gray-900">
                {psychologist.hourlyRate.toLocaleString()} тг
              </div>
              <div className="text-sm text-gray-500">за час</div>
            </div>
          </div>

          {/* Bio */}
          {psychologist.bio && (
            <p className="mt-4 text-sm text-gray-600 line-clamp-2">{psychologist.bio}</p>
          )}

          {/* Actions */}
          <div className="mt-4 flex gap-3">
            <Button className="flex-1" onClick={() => onBook(psychologist)}>
              Записаться
            </Button>
            <Button variant="outline" className="flex-1">
              Подробнее
            </Button>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}

function ConsultationCard({ consultation, isPsychologist }: { consultation: Consultation; isPsychologist: boolean }) {
  const router = useRouter();
  const statusInfo = STATUS_LABELS[consultation.status] || { text: consultation.status, color: 'bg-gray-100' };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // For psychologists, show client info; for clients, show psychologist info
  const displayName = isPsychologist ? consultation.clientName : consultation.psychologistName;
  const displayInitial = displayName?.charAt(0) || '?';
  const displayRole = isPsychologist ? 'Клиент' : 'Психолог';

  return (
    <Card className="cursor-pointer transition-shadow hover:shadow-lg" onClick={() => router.push(`/consultations/${consultation.id}`)}>
      <CardBody>
        <div className="flex items-center gap-4">
          {/* Avatar */}
          <div className={`h-14 w-14 flex-shrink-0 overflow-hidden rounded-full ${isPsychologist ? 'bg-green-100' : 'bg-indigo-100'}`}>
            {!isPsychologist && consultation.psychologistAvatarUrl ? (
              <img
                src={consultation.psychologistAvatarUrl}
                alt=""
                className="h-full w-full object-cover"
              />
            ) : (
              <div className={`flex h-full w-full items-center justify-center text-xl font-bold ${isPsychologist ? 'text-green-600' : 'text-indigo-600'}`}>
                {displayInitial}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-gray-900">{displayName}</h3>
              <span className={`text-xs px-2 py-0.5 rounded-full ${isPsychologist ? 'bg-green-100 text-green-700' : 'bg-indigo-100 text-indigo-700'}`}>
                {displayRole}
              </span>
            </div>
            <p className="text-sm text-gray-600">{formatDate(consultation.scheduledAt)}</p>
            {consultation.childName && (
              <p className="text-sm text-gray-500">Ребёнок: {consultation.childName}</p>
            )}
          </div>

          {/* Status & Price */}
          <div className="text-right">
            <span className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${statusInfo.color}`}>
              {statusInfo.text}
            </span>
            <p className="mt-1 font-semibold text-gray-900">{consultation.price.toLocaleString()} тг</p>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}

function PsychologistCardSkeleton() {
  return (
    <Card>
      <CardBody>
        <div className="flex items-start gap-4">
          <Skeleton className="w-16 h-16 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-32" />
            <div className="flex gap-2">
              <Skeleton className="h-5 w-20" />
              <Skeleton className="h-5 w-24" />
            </div>
            <Skeleton className="h-4 w-full" />
          </div>
          <div className="text-right">
            <Skeleton className="h-8 w-24" />
            <Skeleton className="h-4 w-16 mt-1" />
          </div>
        </div>
        <div className="mt-4 flex gap-3">
          <Skeleton className="h-10 flex-1" />
          <Skeleton className="h-10 flex-1" />
        </div>
      </CardBody>
    </Card>
  );
}

export default function ConsultationsPage() {
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [activeTab, setActiveTab] = useState<'find' | 'my'>('my'); // Default to 'my', will switch if PARENT
  const [psychologists, setPsychologists] = useState<Psychologist[]>([]);
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [specialization, setSpecialization] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [bookingPsychologist, setBookingPsychologist] = useState<Psychologist | null>(null);
  const limit = 10;

  // Get user role from localStorage on mount
  useEffect(() => {
    try {
      const userData = localStorage.getItem('user');
      console.log('[ConsultationsPage] User data from localStorage:', userData);
      if (userData) {
        const user = JSON.parse(userData);
        console.log('[ConsultationsPage] Parsed user role:', user.role);
        setUserRole(user.role);
        // Only PARENT users can search for psychologists
        if (user.role === 'PARENT') {
          setActiveTab('find');
        } else if (user.role === 'PSYCHOLOGIST') {
          // Psychologists should see "my" tab by default
          setActiveTab('my');
        }
      }
    } catch (err) {
      console.error('[ConsultationsPage] Error parsing user data:', err);
    }
  }, []);

  const isPsychologist = userRole === 'PSYCHOLOGIST';
  const isAdmin = userRole === 'ADMIN';

  const fetchPsychologists = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      let url = `/api/psychologists?page=${page}&limit=${limit}`;
      if (specialization) {
        url += `&specialization=${encodeURIComponent(specialization)}`;
      }

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Не удалось загрузить список психологов');
      }

      const data: PsychologistsResponse = await response.json();
      setPsychologists(data.psychologists);
      setTotal(data.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Произошла ошибка');
    } finally {
      setLoading(false);
    }
  }, [page, specialization]);

  const fetchConsultations = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // For psychologists, use the psychologist endpoint
      const psychologistParam = isPsychologist ? '&psychologist=true' : '';
      const url = `/api/consultations?page=${page}&limit=${limit}${psychologistParam}`;
      console.log('[ConsultationsPage] Fetching consultations from:', url, 'isPsychologist:', isPsychologist);

      const response = await fetch(url);
      console.log('[ConsultationsPage] Response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('[ConsultationsPage] Error response:', errorData);
        throw new Error(errorData.error || 'Не удалось загрузить консультации');
      }

      const data: ConsultationsResponse = await response.json();
      console.log('[ConsultationsPage] Received consultations:', data);
      setConsultations(data.consultations || []);
      setTotal(data.total || 0);
    } catch (err) {
      console.error('[ConsultationsPage] Error fetching consultations:', err);
      setError(err instanceof Error ? err.message : 'Произошла ошибка');
    } finally {
      setLoading(false);
    }
  }, [page, isPsychologist]);

  useEffect(() => {
    // Wait for userRole to be determined before fetching
    if (userRole === null) {
      return;
    }

    if (activeTab === 'find') {
      fetchPsychologists();
    } else {
      fetchConsultations();
    }
  }, [activeTab, userRole, fetchPsychologists, fetchConsultations]);

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Консультации</h1>
          <p className="mt-2 text-gray-600">
            {isPsychologist
              ? 'Управление вашими консультациями с клиентами'
              : 'Онлайн-консультации с квалифицированными психологами'
            }
          </p>
        </div>

        {/* Tabs - only show "Find psychologist" for parents/clients */}
        <div className="flex space-x-4 mb-8">
          {!isPsychologist && (
            <button
              onClick={() => {
                setActiveTab('find');
                setPage(1);
              }}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'find'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-100'
              }`}
            >
              Найти психолога
            </button>
          )}
          <button
            onClick={() => {
              setActiveTab('my');
              setPage(1);
            }}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'my'
                ? 'bg-indigo-600 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-100'
            }`}
          >
            {isPsychologist ? 'Мои клиенты' : 'Мои консультации'}
          </button>
        </div>

        {activeTab === 'find' && !isPsychologist ? (
          <>
            {/* Filters */}
            <div className="mb-6">
              <Card>
                <CardBody>
                  <div className="flex flex-wrap gap-4">
                    <div className="flex-1 min-w-[200px]">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Специализация
                      </label>
                      <select
                        value={specialization}
                        onChange={(e) => {
                          setSpecialization(e.target.value);
                          setPage(1);
                        }}
                        className="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      >
                        {SPECIALIZATIONS.map((spec) => (
                          <option key={spec.value} value={spec.value}>
                            {spec.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </CardBody>
              </Card>
            </div>

            {/* Results */}
            {loading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <PsychologistCardSkeleton key={i} />
                ))}
              </div>
            ) : error ? (
              <Card>
                <CardBody>
                  <div className="text-center py-8">
                    <p className="text-red-600 mb-4">{error}</p>
                    <Button onClick={fetchPsychologists}>Попробовать снова</Button>
                  </div>
                </CardBody>
              </Card>
            ) : psychologists.length === 0 ? (
              <Card>
                <CardBody>
                  <div className="text-center py-12">
                    <svg
                      className="w-16 h-16 text-gray-300 mx-auto mb-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                      />
                    </svg>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      Психологи не найдены
                    </h3>
                    <p className="text-gray-500">
                      {specialization
                        ? 'Попробуйте изменить фильтры поиска'
                        : 'В данный момент нет доступных психологов'}
                    </p>
                  </div>
                </CardBody>
              </Card>
            ) : (
              <>
                {/* Results count */}
                <p className="text-sm text-gray-600 mb-4">
                  Найдено: {total} {total === 1 ? 'психолог' : total < 5 ? 'психолога' : 'психологов'}
                </p>

                {/* Psychologist cards */}
                <div className="space-y-4">
                  {psychologists.map((psychologist) => (
                    <PsychologistCard
                      key={psychologist.id}
                      psychologist={psychologist}
                      onBook={setBookingPsychologist}
                    />
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="mt-6 flex justify-center gap-2">
                    <Button
                      variant="outline"
                      disabled={page === 1}
                      onClick={() => setPage(page - 1)}
                    >
                      Назад
                    </Button>
                    <span className="flex items-center px-4 text-sm text-gray-600">
                      Страница {page} из {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      disabled={page === totalPages}
                      onClick={() => setPage(page + 1)}
                    >
                      Вперёд
                    </Button>
                  </div>
                )}
              </>
            )}
          </>
        ) : (
          /* My Consultations */
          <>
            {loading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <Card key={i}>
                    <CardBody>
                      <div className="flex items-center gap-4">
                        <Skeleton className="h-14 w-14 rounded-full" />
                        <div className="flex-1 space-y-2">
                          <Skeleton className="h-5 w-48" />
                          <Skeleton className="h-4 w-32" />
                        </div>
                        <Skeleton className="h-6 w-20" />
                      </div>
                    </CardBody>
                  </Card>
                ))}
              </div>
            ) : error ? (
              <Card>
                <CardBody>
                  <div className="text-center py-8">
                    <p className="text-red-600 mb-4">{error}</p>
                    <Button onClick={fetchConsultations}>Попробовать снова</Button>
                  </div>
                </CardBody>
              </Card>
            ) : consultations.length === 0 ? (
              <Card>
                <CardBody>
                  {isPsychologist ? (
                    <EmptyState
                      icon={
                        <svg className="w-16 h-16 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                      }
                      title="Нет запланированных консультаций"
                      description="Когда клиенты запишутся к вам на консультацию, они появятся здесь"
                    />
                  ) : (
                    <EmptyStateNoConsultations onBook={() => setActiveTab('find')} />
                  )}
                </CardBody>
              </Card>
            ) : (
              <>
                <div className="space-y-4">
                  {consultations.map((consultation) => (
                    <ConsultationCard key={consultation.id} consultation={consultation} isPsychologist={isPsychologist} />
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="mt-6 flex justify-center gap-2">
                    <Button
                      variant="outline"
                      disabled={page === 1}
                      onClick={() => setPage(page - 1)}
                    >
                      Назад
                    </Button>
                    <span className="flex items-center px-4 text-sm text-gray-600">
                      Страница {page} из {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      disabled={page === totalPages}
                      onClick={() => setPage(page + 1)}
                    >
                      Вперёд
                    </Button>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>

      {/* Booking Modal */}
      {bookingPsychologist && (
        <BookingModal
          psychologist={bookingPsychologist}
          onClose={() => setBookingPsychologist(null)}
          onSuccess={() => {
            setActiveTab('my');
            fetchConsultations();
          }}
        />
      )}
    </div>
  );
}
