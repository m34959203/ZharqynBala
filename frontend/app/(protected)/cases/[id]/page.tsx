'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';

interface CaseNote {
  id: string;
  content: string;
  createdAt: string;
  author: {
    firstName: string;
    lastName: string;
    role: string;
  };
}

interface StudentCase {
  id: string;
  title: string;
  description: string | null;
  priority: string;
  status: string;
  category: string | null;
  resolution: string | null;
  openedAt: string;
  resolvedAt: string | null;
  closedAt: string | null;
  child: { id: string; firstName: string; lastName: string };
  psychologist: { user: { firstName: string; lastName: string; email: string } } | null;
  caseNotes: CaseNote[];
}

const PRIORITIES = [
  { value: 'CRITICAL', label: 'Критический', color: 'bg-red-100 text-red-800' },
  { value: 'HIGH', label: 'Высокий', color: 'bg-orange-100 text-orange-800' },
  { value: 'MEDIUM', label: 'Средний', color: 'bg-blue-100 text-blue-800' },
  { value: 'LOW', label: 'Низкий', color: 'bg-gray-100 text-gray-800' },
];

const STATUSES = [
  { value: 'OPEN', label: 'Открыт', color: 'bg-blue-100 text-blue-800' },
  { value: 'IN_PROGRESS', label: 'В работе', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'ON_HOLD', label: 'На паузе', color: 'bg-gray-100 text-gray-800' },
  { value: 'RESOLVED', label: 'Решён', color: 'bg-green-100 text-green-800' },
  { value: 'CLOSED', label: 'Закрыт', color: 'bg-gray-100 text-gray-600' },
];

const ROLE_LABELS: Record<string, string> = {
  PSYCHOLOGIST: 'Психолог',
  ADMIN: 'Администратор',
  SCHOOL: 'Школа',
  PARENT: 'Родитель',
};

const ROLE_COLORS: Record<string, string> = {
  PSYCHOLOGIST: 'bg-purple-100 text-purple-700',
  ADMIN: 'bg-red-100 text-red-700',
  SCHOOL: 'bg-green-100 text-green-700',
  PARENT: 'bg-blue-100 text-blue-700',
};

function getPriorityConfig(value: string) {
  return PRIORITIES.find(p => p.value === value) || PRIORITIES[2];
}

function getStatusConfig(value: string) {
  return STATUSES.find(s => s.value === value) || STATUSES[0];
}

export default function CaseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const caseId = params.id as string;

  const [caseData, setCaseData] = useState<StudentCase | null>(null);
  const [loading, setLoading] = useState(true);
  const [noteContent, setNoteContent] = useState('');
  const [submittingNote, setSubmittingNote] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [resolution, setResolution] = useState('');
  const [showResolutionField, setShowResolutionField] = useState(false);

  const loadCase = useCallback(async () => {
    try {
      const response = await api.get(`/cases/${caseId}`);
      setCaseData(response.data);
      if (response.data.resolution) {
        setResolution(response.data.resolution);
      }
    } catch (err) {
      console.error('Error loading case:', err);
    } finally {
      setLoading(false);
    }
  }, [caseId]);

  useEffect(() => {
    loadCase();
  }, [loadCase]);

  const handleStatusChange = async (newStatus: string) => {
    if (!caseData || updatingStatus) return;

    // For RESOLVED/CLOSED, show resolution field first
    if ((newStatus === 'RESOLVED' || newStatus === 'CLOSED') && !resolution && !showResolutionField) {
      setShowResolutionField(true);
      return;
    }

    setUpdatingStatus(true);
    try {
      const data: Record<string, string> = { status: newStatus };
      if (resolution) data.resolution = resolution;

      await api.patch(`/cases/${caseId}`, data);
      setShowResolutionField(false);
      await loadCase();
    } catch (err) {
      console.error('Error updating status:', err);
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteContent.trim()) return;

    setSubmittingNote(true);
    try {
      await api.post(`/cases/${caseId}/notes`, { content: noteContent.trim() });
      setNoteContent('');
      await loadCase();
    } catch (err) {
      console.error('Error adding note:', err);
    } finally {
      setSubmittingNote(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3" />
          <div className="h-4 bg-gray-200 rounded w-1/2" />
          <div className="bg-white rounded-xl shadow-sm p-6 space-y-4">
            <div className="h-5 bg-gray-200 rounded w-2/3" />
            <div className="h-4 bg-gray-200 rounded w-1/2" />
            <div className="h-4 bg-gray-200 rounded w-3/4" />
          </div>
        </div>
      </div>
    );
  }

  if (!caseData) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center">
        <h2 className="text-xl font-semibold text-gray-900">Кейс не найден</h2>
        <Link href="/cases" className="mt-4 inline-block text-indigo-600 hover:text-indigo-700">
          Вернуться к списку
        </Link>
      </div>
    );
  }

  const priorityConf = getPriorityConfig(caseData.priority);
  const statusConf = getStatusConfig(caseData.status);
  const isResolved = caseData.status === 'RESOLVED' || caseData.status === 'CLOSED';

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Back link */}
      <Link href="/cases" className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-6">
        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Назад к кейсам
      </Link>

      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold text-gray-900">{caseData.title}</h1>
              <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${priorityConf.color}`}>
                {priorityConf.label}
              </span>
              <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusConf.color}`}>
                {statusConf.label}
              </span>
            </div>
            <p className="mt-2 text-lg text-gray-700">
              {caseData.child.firstName} {caseData.child.lastName}
            </p>
          </div>
        </div>

        {caseData.description && (
          <p className="mt-4 text-gray-600">{caseData.description}</p>
        )}

        {/* Info grid */}
        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-gray-100">
          {caseData.category && (
            <div>
              <p className="text-xs text-gray-500">Категория</p>
              <p className="text-sm font-medium text-gray-900">{caseData.category}</p>
            </div>
          )}
          <div>
            <p className="text-xs text-gray-500">Дата открытия</p>
            <p className="text-sm font-medium text-gray-900">
              {new Date(caseData.openedAt).toLocaleDateString('ru-RU')}
            </p>
          </div>
          {caseData.psychologist && (
            <div>
              <p className="text-xs text-gray-500">Психолог</p>
              <p className="text-sm font-medium text-gray-900">
                {caseData.psychologist.user.firstName} {caseData.psychologist.user.lastName}
              </p>
            </div>
          )}
          {caseData.resolvedAt && (
            <div>
              <p className="text-xs text-gray-500">Дата решения</p>
              <p className="text-sm font-medium text-gray-900">
                {new Date(caseData.resolvedAt).toLocaleDateString('ru-RU')}
              </p>
            </div>
          )}
        </div>

        {/* Resolution */}
        {isResolved && caseData.resolution && (
          <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-200">
            <p className="text-xs font-medium text-green-700 mb-1">Решение</p>
            <p className="text-sm text-green-800">{caseData.resolution}</p>
          </div>
        )}
      </div>

      {/* Status Actions */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <h2 className="text-sm font-medium text-gray-500 mb-3">Изменить статус</h2>
        <div className="flex items-center flex-wrap gap-2">
          {STATUSES.map(s => (
            <button
              key={s.value}
              onClick={() => handleStatusChange(s.value)}
              disabled={caseData.status === s.value || updatingStatus}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border ${
                caseData.status === s.value
                  ? `${s.color} border-current cursor-default`
                  : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50 disabled:opacity-50'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>

        {/* Resolution field */}
        {showResolutionField && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Описание решения (необязательно)
            </label>
            <textarea
              value={resolution}
              onChange={e => setResolution(e.target.value)}
              rows={3}
              placeholder="Опишите итоги работы по кейсу..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none mb-3"
            />
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleStatusChange(caseData.status === 'RESOLVED' ? 'RESOLVED' : 'RESOLVED')}
                disabled={updatingStatus}
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                {updatingStatus ? 'Сохранение...' : 'Завершить'}
              </button>
              <button
                onClick={() => setShowResolutionField(false)}
                className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-200 rounded-lg hover:bg-gray-300"
              >
                Отмена
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add Note Form */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Добавить заметку</h2>
        <form onSubmit={handleAddNote}>
          <textarea
            value={noteContent}
            onChange={e => setNoteContent(e.target.value)}
            rows={3}
            placeholder="Введите текст заметки..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
          />
          <div className="mt-3 flex justify-end">
            <button
              type="submit"
              disabled={!noteContent.trim() || submittingNote}
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
            >
              {submittingNote ? 'Отправка...' : 'Добавить'}
            </button>
          </div>
        </form>
      </div>

      {/* Notes Timeline */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Заметки ({caseData.caseNotes.length})
        </h2>

        {caseData.caseNotes.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-6">Заметок пока нет</p>
        ) : (
          <div className="space-y-4">
            {caseData.caseNotes.map((note, idx) => (
              <div key={note.id} className="relative">
                {/* Timeline line */}
                {idx < caseData.caseNotes.length - 1 && (
                  <div className="absolute left-5 top-10 w-0.5 h-full bg-gray-200" />
                )}
                <div className="flex gap-4">
                  {/* Avatar */}
                  <div className="shrink-0 w-10 h-10 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-sm z-10">
                    {note.author.firstName[0]}{note.author.lastName[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-gray-900 text-sm">
                        {note.author.firstName} {note.author.lastName}
                      </span>
                      <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${
                        ROLE_COLORS[note.author.role] || 'bg-gray-100 text-gray-600'
                      }`}>
                        {ROLE_LABELS[note.author.role] || note.author.role}
                      </span>
                      <span className="text-xs text-gray-400">
                        {new Date(note.createdAt).toLocaleString('ru-RU', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-gray-700 whitespace-pre-wrap">{note.content}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
