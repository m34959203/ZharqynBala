'use client';

import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

const BULLYING_TYPES = [
  { value: 'PHYSICAL', label: 'Физическое насилие' },
  { value: 'VERBAL', label: 'Словесное оскорбление' },
  { value: 'SOCIAL', label: 'Социальная изоляция' },
  { value: 'CYBER', label: 'Кибербуллинг' },
  { value: 'OTHER', label: 'Другое' },
];

function ReportForm() {
  const searchParams = useSearchParams();
  const schoolId = searchParams.get('school') || '';
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [anonymous, setAnonymous] = useState(true);
  const [form, setForm] = useState({
    type: 'VERBAL',
    description: '',
    location: '',
    victimGrade: '',
    reporterName: '',
    reporterContact: '',
  });

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${apiUrl}/api/v1/bullying/report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: form.type,
          description: form.description,
          location: form.location || undefined,
          victimGrade: form.victimGrade ? parseInt(form.victimGrade) : undefined,
          schoolId: schoolId || undefined,
          anonymous,
          reporterName: !anonymous ? form.reporterName : undefined,
          reporterContact: !anonymous ? form.reporterContact : undefined,
        }),
      });
      if (!res.ok) throw new Error('Ошибка отправки');
      setSubmitted(true);
    } catch (err: any) {
      setError(err.message || 'Произошла ошибка');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Сообщение отправлено</h2>
          <p className="text-gray-600 mb-6">
            Ваше обращение принято и будет рассмотрено. Спасибо за смелость.
          </p>
          <button
            onClick={() => {
              setSubmitted(false);
              setForm({ type: 'VERBAL', description: '', location: '', victimGrade: '', reporterName: '', reporterContact: '' });
            }}
            className="text-indigo-600 hover:text-indigo-500 text-sm font-medium"
          >
            Отправить ещё одно сообщение
          </button>
          <p className="text-sm text-gray-500 mt-6">
            Если вам нужна срочная помощь, звоните: <strong>150</strong> (детский телефон доверия)
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-lg mx-auto">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Сообщить о буллинге</h1>
          <p className="text-gray-600 mt-2">
            Это безопасная и конфиденциальная форма. Ваше сообщение поможет решить проблему.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-lg p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Тип буллинга *</label>
            <select
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              {BULLYING_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Что произошло? *</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              required
              rows={4}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Опишите ситуацию..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Где это произошло?</label>
            <input
              type="text"
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Класс, коридор, онлайн..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Класс пострадавшего</label>
            <select
              value={form.victimGrade}
              onChange={(e) => setForm({ ...form, victimGrade: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">Не указан</option>
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i + 1} value={i + 1}>
                  {i + 1} класс
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="anonymous"
              checked={anonymous}
              onChange={(e) => setAnonymous(e.target.checked)}
              className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />
            <label htmlFor="anonymous" className="text-sm text-gray-700">
              Анонимное обращение
            </label>
          </div>

          {!anonymous && (
            <div className="space-y-3 pl-4 border-l-2 border-indigo-200">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ваше имя</label>
                <input
                  type="text"
                  value={form.reporterName}
                  onChange={(e) => setForm({ ...form, reporterName: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Контакт (телефон или email)</label>
                <input
                  type="text"
                  value={form.reporterContact}
                  onChange={(e) => setForm({ ...form, reporterContact: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>
          )}

          {error && <p className="text-red-600 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={loading || !form.description}
            className="w-full bg-indigo-600 text-white rounded-lg py-3 font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Отправка...' : 'Отправить сообщение'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          Срочная помощь: <strong>150</strong> -- детский телефон доверия (бесплатно, круглосуточно)
        </p>
      </div>
    </div>
  );
}

export default function ReportBullyingPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      }
    >
      <ReportForm />
    </Suspense>
  );
}
