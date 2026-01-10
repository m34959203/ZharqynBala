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

interface PatientNote {
  id: string;
  title: string;
  content: string;
  chiefComplaint?: string;
  historyOfIllness?: string;
  mentalStatus?: string;
  diagnosis?: string;
  recommendations?: string;
  treatmentPlan?: string;
  createdAt: string;
  updatedAt: string;
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
  const [userRole, setUserRole] = useState<string | null>(null);
  const [patientNotes, setPatientNotes] = useState<PatientNote[]>([]);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [editingNote, setEditingNote] = useState<PatientNote | null>(null);
  const [noteFormData, setNoteFormData] = useState({
    title: '',
    content: '',
    chiefComplaint: '',
    historyOfIllness: '',
    mentalStatus: '',
    diagnosis: '',
    recommendations: '',
    treatmentPlan: '',
  });
  const [noteSaving, setNoteSaving] = useState(false);

  // Get user role from localStorage
  useEffect(() => {
    // Try direct userRole first, then fall back to user object
    let role = localStorage.getItem('userRole');
    if (!role) {
      const userData = localStorage.getItem('user');
      if (userData) {
        try {
          const user = JSON.parse(userData);
          role = user.role || null;
        } catch (e) {
          console.error('Error parsing user data:', e);
        }
      }
    }
    console.log('[ConsultationPage] User role from localStorage:', role);
    setUserRole(role);
  }, []);

  // Fetch patient notes for psychologist
  const fetchPatientNotes = useCallback(async () => {
    if (userRole !== 'PSYCHOLOGIST' || !consultationId) return;
    try {
      const response = await fetch(`/api/patient-notes?consultationId=${consultationId}`);
      if (response.ok) {
        const data = await response.json();
        setPatientNotes(data);
      }
    } catch (err) {
      console.error('Error fetching patient notes:', err);
    }
  }, [consultationId, userRole]);

  useEffect(() => {
    if (userRole === 'PSYCHOLOGIST' && consultationId) {
      fetchPatientNotes();
    }
  }, [userRole, consultationId, fetchPatientNotes]);

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
  const isPsychologist = userRole === 'PSYCHOLOGIST';
  const canComplete = consultation.status === 'IN_PROGRESS' && isPsychologist;
  const canConfirmOrReject = consultation.status === 'PENDING' && isPsychologist;
  const canMarkNoShow = consultation.status === 'IN_PROGRESS' && isPsychologist;
  const canRate = consultation.status === 'COMPLETED' && !isPsychologist;
  const canAddNotes = isPsychologist && ['IN_PROGRESS', 'COMPLETED'].includes(consultation.status);

  const openNoteModal = (note?: PatientNote) => {
    if (note) {
      setEditingNote(note);
      setNoteFormData({
        title: note.title,
        content: note.content,
        chiefComplaint: note.chiefComplaint || '',
        historyOfIllness: note.historyOfIllness || '',
        mentalStatus: note.mentalStatus || '',
        diagnosis: note.diagnosis || '',
        recommendations: note.recommendations || '',
        treatmentPlan: note.treatmentPlan || '',
      });
    } else {
      setEditingNote(null);
      setNoteFormData({
        title: `Заметка от ${formatDate(new Date().toISOString())}`,
        content: '',
        chiefComplaint: '',
        historyOfIllness: '',
        mentalStatus: '',
        diagnosis: '',
        recommendations: '',
        treatmentPlan: '',
      });
    }
    setShowNoteModal(true);
  };

  const handleSaveNote = async () => {
    if (!noteFormData.title || !noteFormData.content) {
      alert('Заполните заголовок и содержание заметки');
      return;
    }

    setNoteSaving(true);
    try {
      const url = editingNote
        ? `/api/patient-notes/${editingNote.id}`
        : '/api/patient-notes';
      const method = editingNote ? 'PUT' : 'POST';

      const body = editingNote
        ? { ...noteFormData }
        : {
            ...noteFormData,
            clientId: consultation.clientId,
            childId: consultation.childId || undefined,
            consultationId: consultation.id,
          };

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Ошибка сохранения');
      }

      setShowNoteModal(false);
      fetchPatientNotes();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Произошла ошибка');
    } finally {
      setNoteSaving(false);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    if (!confirm('Удалить эту заметку?')) return;

    try {
      const response = await fetch(`/api/patient-notes/${noteId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Ошибка удаления');
      }

      fetchPatientNotes();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Произошла ошибка');
    }
  };

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

          {/* Psychologist-only actions */}
          {canComplete && (
            <button
              onClick={() => handleAction('complete')}
              disabled={actionLoading}
              className="rounded-lg bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              Завершить консультацию
            </button>
          )}

          {canConfirmOrReject && (
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

          {canMarkNoShow && (
            <button
              onClick={() => handleAction('no-show')}
              disabled={actionLoading}
              className="rounded-lg bg-orange-600 px-4 py-2 font-medium text-white hover:bg-orange-700 disabled:opacity-50"
            >
              Неявка клиента
            </button>
          )}

          {/* Client-only actions */}
          {canRate && (
            <button
              onClick={() => {
                const rating = prompt('Оцените консультацию от 1 до 5:');
                const review = prompt('Оставьте отзыв (необязательно):');
                if (rating && Number(rating) >= 1 && Number(rating) <= 5) {
                  handleAction('rate', { rating: Number(rating), review: review || undefined });
                } else if (rating) {
                  alert('Пожалуйста, введите оценку от 1 до 5');
                }
              }}
              disabled={actionLoading}
              className="rounded-lg bg-yellow-500 px-4 py-2 font-medium text-white hover:bg-yellow-600 disabled:opacity-50"
            >
              Оценить консультацию
            </button>
          )}

          {/* Both can cancel pending/confirmed consultations */}
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

      {/* Info for client during IN_PROGRESS */}
      {consultation.status === 'IN_PROGRESS' && !isPsychologist && (
        <div className="mt-6 rounded-lg border border-blue-200 bg-blue-50 p-4">
          <div className="flex items-start gap-3">
            <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <h3 className="font-medium text-blue-800">Консультация идёт</h3>
              <p className="mt-1 text-sm text-blue-700">
                Консультация будет завершена психологом после окончания сеанса.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Patient Notes Section for Psychologists */}
      {isPsychologist && (
        <div className="mt-6 rounded-xl bg-white p-6 shadow-lg">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">Психологическая анкета пациента</h2>
            {canAddNotes && (
              <button
                onClick={() => openNoteModal()}
                className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 font-medium text-white hover:bg-indigo-700"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Добавить заметку
              </button>
            )}
          </div>

          {patientNotes.length === 0 ? (
            <div className="py-8 text-center">
              <svg className="mx-auto h-12 w-12 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="mt-2 text-gray-500">Заметок пока нет</p>
              {canAddNotes && (
                <p className="mt-1 text-sm text-gray-400">
                  Добавьте заметку для документирования консультации
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {patientNotes.map((note) => (
                <div key={note.id} className="rounded-lg border border-gray-200 p-4">
                  <div className="mb-2 flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-900">{note.title}</h3>
                      <p className="text-sm text-gray-500">
                        {new Date(note.createdAt).toLocaleDateString('ru-RU', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => openNoteModal(note)}
                        className="p-2 text-gray-400 hover:text-indigo-600"
                        title="Редактировать"
                      >
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDeleteNote(note.id)}
                        className="p-2 text-gray-400 hover:text-red-600"
                        title="Удалить"
                      >
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  <p className="mb-3 whitespace-pre-wrap text-gray-700">{note.content}</p>
                  {(note.chiefComplaint || note.diagnosis || note.recommendations) && (
                    <div className="grid gap-3 border-t border-gray-100 pt-3 md:grid-cols-2">
                      {note.chiefComplaint && (
                        <div>
                          <p className="text-xs font-medium text-gray-500">Жалоба</p>
                          <p className="text-sm text-gray-700">{note.chiefComplaint}</p>
                        </div>
                      )}
                      {note.diagnosis && (
                        <div>
                          <p className="text-xs font-medium text-gray-500">Диагноз</p>
                          <p className="text-sm text-gray-700">{note.diagnosis}</p>
                        </div>
                      )}
                      {note.recommendations && (
                        <div className="md:col-span-2">
                          <p className="text-xs font-medium text-gray-500">Рекомендации</p>
                          <p className="text-sm text-gray-700">{note.recommendations}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Note Modal */}
      {showNoteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">
                {editingNote ? 'Редактировать заметку' : 'Новая заметка'}
              </h2>
              <button
                onClick={() => setShowNoteModal(false)}
                className="p-2 text-gray-400 hover:text-gray-600"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Заголовок *
                </label>
                <input
                  type="text"
                  value={noteFormData.title}
                  onChange={(e) => setNoteFormData({ ...noteFormData, title: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 p-3 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  placeholder="Название заметки"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Основное содержание *
                </label>
                <textarea
                  rows={4}
                  value={noteFormData.content}
                  onChange={(e) => setNoteFormData({ ...noteFormData, content: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 p-3 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  placeholder="Подробное описание консультации..."
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Основная жалоба
                  </label>
                  <textarea
                    rows={2}
                    value={noteFormData.chiefComplaint}
                    onChange={(e) => setNoteFormData({ ...noteFormData, chiefComplaint: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 p-3 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    placeholder="С чем обратился пациент"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Психический статус
                  </label>
                  <textarea
                    rows={2}
                    value={noteFormData.mentalStatus}
                    onChange={(e) => setNoteFormData({ ...noteFormData, mentalStatus: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 p-3 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    placeholder="Оценка состояния"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  История
                </label>
                <textarea
                  rows={2}
                  value={noteFormData.historyOfIllness}
                  onChange={(e) => setNoteFormData({ ...noteFormData, historyOfIllness: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 p-3 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  placeholder="История проблемы, предыдущие обращения"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Диагноз / Заключение
                </label>
                <input
                  type="text"
                  value={noteFormData.diagnosis}
                  onChange={(e) => setNoteFormData({ ...noteFormData, diagnosis: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 p-3 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  placeholder="Предварительный диагноз или заключение"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Рекомендации
                </label>
                <textarea
                  rows={3}
                  value={noteFormData.recommendations}
                  onChange={(e) => setNoteFormData({ ...noteFormData, recommendations: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 p-3 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  placeholder="Рекомендации для пациента"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  План лечения
                </label>
                <textarea
                  rows={2}
                  value={noteFormData.treatmentPlan}
                  onChange={(e) => setNoteFormData({ ...noteFormData, treatmentPlan: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 p-3 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  placeholder="Дальнейший план работы"
                />
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setShowNoteModal(false)}
                className="flex-1 rounded-lg border border-gray-300 px-4 py-2 font-medium text-gray-700 hover:bg-gray-50"
              >
                Отмена
              </button>
              <button
                onClick={handleSaveNote}
                disabled={noteSaving}
                className="flex-1 rounded-lg bg-indigo-600 px-4 py-2 font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
              >
                {noteSaving ? 'Сохранение...' : 'Сохранить'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
