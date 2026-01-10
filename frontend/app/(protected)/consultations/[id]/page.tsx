'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';

// Динамический импорт компонента Jitsi (только на клиенте)
const JitsiMeet = dynamic(() => import('@/components/video/JitsiMeet'), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center bg-gray-900">
      <div className="text-center text-white">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent mx-auto"></div>
        <p className="mt-4">Загрузка видеоконференции...</p>
      </div>
    </div>
  ),
});

interface Consultation {
  id: string;
  psychologistId: string;
  psychologistName: string;
  psychologistAvatarUrl: string | null;
  clientId: string;
  clientName: string;
  childId: string | null;
  childName: string | null;
  scheduledAt: string;
  durationMinutes: number;
  status: string;
  roomUrl: string | null;
  roomName: string | null;
  price: number;
  paymentStatus: string;
  notes: string | null;
}

interface JitsiConfig {
  domain: string;
  roomName: string;
  configOverwrite?: object;
  interfaceConfigOverwrite?: object;
  userInfo?: {
    displayName?: string;
    email?: string;
  };
}

const STATUS_LABELS: Record<string, { text: string; color: string }> = {
  PENDING: { text: 'Ожидает подтверждения', color: 'bg-yellow-100 text-yellow-800' },
  CONFIRMED: { text: 'Подтверждена', color: 'bg-green-100 text-green-800' },
  REJECTED: { text: 'Отклонена', color: 'bg-red-100 text-red-800' },
  IN_PROGRESS: { text: 'Идёт', color: 'bg-blue-100 text-blue-800' },
  COMPLETED: { text: 'Завершена', color: 'bg-gray-100 text-gray-800' },
  CANCELLED: { text: 'Отменена', color: 'bg-gray-100 text-gray-800' },
  NO_SHOW: { text: 'Неявка', color: 'bg-red-100 text-red-800' },
};

export default function ConsultationPage() {
  const params = useParams();
  const router = useRouter();
  const consultationId = params?.id as string;

  const [consultation, setConsultation] = useState<Consultation | null>(null);
  const [jitsiConfig, setJitsiConfig] = useState<JitsiConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showVideo, setShowVideo] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchConsultation = useCallback(async () => {
    try {
      const response = await fetch(`/api/consultations/${consultationId}`);
      if (!response.ok) throw new Error('Ошибка загрузки');
      const data = await response.json();
      setConsultation(data);
    } catch (err) {
      setError('Не удалось загрузить консультацию');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [consultationId]);

  const fetchJitsiConfig = useCallback(async () => {
    try {
      const response = await fetch(`/api/consultations/${consultationId}/jitsi-config`);
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Ошибка загрузки конфигурации');
      }
      const data = await response.json();
      setJitsiConfig(data);
    } catch (err) {
      console.error('Error fetching Jitsi config:', err);
    }
  }, [consultationId]);

  useEffect(() => {
    if (consultationId) {
      fetchConsultation();
    }
  }, [consultationId, fetchConsultation]);

  const handleAction = async (action: string, data?: object) => {
    setActionLoading(true);
    try {
      const response = await fetch(`/api/consultations/${consultationId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ...data }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Ошибка операции');
      }

      await fetchConsultation();

      // Если консультация начата, загружаем конфигурацию Jitsi
      if (action === 'start') {
        await fetchJitsiConfig();
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Произошла ошибка');
    } finally {
      setActionLoading(false);
    }
  };

  const handleJoinVideo = async () => {
    await fetchJitsiConfig();
    if (jitsiConfig || consultation?.status === 'CONFIRMED' || consultation?.status === 'IN_PROGRESS') {
      // Если консультация подтверждена но не начата, сначала начинаем её
      if (consultation?.status === 'CONFIRMED') {
        await handleAction('start');
      }
      await fetchJitsiConfig();
      setShowVideo(true);
    }
  };

  const handleVideoConferenceLeft = () => {
    setShowVideo(false);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent"></div>
      </div>
    );
  }

  if (error || !consultation) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900">{error || 'Консультация не найдена'}</h2>
          <button
            onClick={() => router.push('/consultations')}
            className="mt-4 rounded-lg bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700"
          >
            Вернуться к списку
          </button>
        </div>
      </div>
    );
  }

  // Показываем видео на весь экран
  if (showVideo && jitsiConfig) {
    return (
      <div className="fixed inset-0 z-50 bg-gray-900">
        <div className="absolute left-4 top-4 z-10">
          <button
            onClick={() => setShowVideo(false)}
            className="rounded-lg bg-red-600 px-4 py-2 text-white hover:bg-red-700"
          >
            Свернуть видео
          </button>
        </div>
        <JitsiMeet
          config={jitsiConfig}
          onVideoConferenceLeft={handleVideoConferenceLeft}
          onReadyToClose={handleVideoConferenceLeft}
          className="h-full w-full"
        />
      </div>
    );
  }

  const statusInfo = STATUS_LABELS[consultation.status] || { text: consultation.status, color: 'bg-gray-100' };
  const canJoinVideo = ['CONFIRMED', 'IN_PROGRESS'].includes(consultation.status);
  const canComplete = consultation.status === 'IN_PROGRESS';

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      {/* Хлебные крошки */}
      <nav className="mb-6">
        <button
          onClick={() => router.push('/consultations')}
          className="text-indigo-600 hover:text-indigo-800"
        >
          Консультации
        </button>
        <span className="mx-2 text-gray-400">/</span>
        <span className="text-gray-600">Детали консультации</span>
      </nav>

      {/* Карточка консультации */}
      <div className="rounded-xl bg-white p-6 shadow-lg">
        {/* Заголовок со статусом */}
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Консультация</h1>
          <span className={`rounded-full px-3 py-1 text-sm font-medium ${statusInfo.color}`}>
            {statusInfo.text}
          </span>
        </div>

        {/* Информация о психологе */}
        <div className="mb-6 flex items-center gap-4 rounded-lg bg-gray-50 p-4">
          <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-full bg-indigo-100">
            {consultation.psychologistAvatarUrl ? (
              <img
                src={consultation.psychologistAvatarUrl}
                alt={consultation.psychologistName}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-2xl font-bold text-indigo-600">
                {consultation.psychologistName.charAt(0)}
              </div>
            )}
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              {consultation.psychologistName}
            </h3>
            <p className="text-sm text-gray-600">Психолог</p>
          </div>
        </div>

        {/* Детали */}
        <div className="mb-6 grid gap-4 md:grid-cols-2">
          <div>
            <p className="text-sm text-gray-500">Дата и время</p>
            <p className="font-medium text-gray-900">{formatDate(consultation.scheduledAt)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Продолжительность</p>
            <p className="font-medium text-gray-900">{consultation.durationMinutes} минут</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Стоимость</p>
            <p className="font-medium text-gray-900">{consultation.price.toLocaleString()} тг</p>
          </div>
          {consultation.childName && (
            <div>
              <p className="text-sm text-gray-500">Ребёнок</p>
              <p className="font-medium text-gray-900">{consultation.childName}</p>
            </div>
          )}
        </div>

        {/* Заметки */}
        {consultation.notes && (
          <div className="mb-6">
            <p className="text-sm text-gray-500">Заметки</p>
            <p className="mt-1 rounded-lg bg-gray-50 p-3 text-gray-700">
              {consultation.notes}
            </p>
          </div>
        )}

        {/* Действия */}
        <div className="flex flex-wrap gap-3">
          {canJoinVideo && (
            <button
              onClick={handleJoinVideo}
              disabled={actionLoading}
              className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-6 py-3 font-medium text-white hover:bg-green-700 disabled:opacity-50"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              Присоединиться к видеозвонку
            </button>
          )}

          {canComplete && (
            <button
              onClick={() => handleAction('complete')}
              disabled={actionLoading}
              className="rounded-lg bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              Завершить консультацию
            </button>
          )}

          {consultation.status === 'PENDING' && (
            <>
              <button
                onClick={() => handleAction('confirm')}
                disabled={actionLoading}
                className="rounded-lg bg-green-600 px-4 py-2 font-medium text-white hover:bg-green-700 disabled:opacity-50"
              >
                Подтвердить
              </button>
              <button
                onClick={() => {
                  const reason = prompt('Укажите причину отклонения:');
                  if (reason) handleAction('reject', { reason });
                }}
                disabled={actionLoading}
                className="rounded-lg bg-red-600 px-4 py-2 font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                Отклонить
              </button>
            </>
          )}

          {['PENDING', 'CONFIRMED'].includes(consultation.status) && (
            <button
              onClick={() => {
                const reason = prompt('Укажите причину отмены:');
                if (reason) handleAction('cancel', { reason });
              }}
              disabled={actionLoading}
              className="rounded-lg border border-gray-300 px-4 py-2 font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Отменить
            </button>
          )}
        </div>
      </div>

      {/* Подсказка для видеозвонка */}
      {canJoinVideo && (
        <div className="mt-6 rounded-lg border border-green-200 bg-green-50 p-4">
          <div className="flex items-start gap-3">
            <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <h3 className="font-medium text-green-800">Видеоконсультация</h3>
              <p className="mt-1 text-sm text-green-700">
                Нажмите кнопку «Присоединиться к видеозвонку» для начала консультации.
                Видеозвонок откроется прямо в браузере без установки дополнительных приложений.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
