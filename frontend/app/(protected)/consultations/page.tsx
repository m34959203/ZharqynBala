'use client';

import { useState, useEffect } from 'react';
import { Card, CardBody, Button, Skeleton, EmptyStateNoConsultations } from '@/components/ui';

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

interface PsychologistsResponse {
  psychologists: Psychologist[];
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

function PsychologistCard({ psychologist }: { psychologist: Psychologist }) {
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
                {psychologist.hourlyRate.toLocaleString()} ₸
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
            <Button className="flex-1">Записаться</Button>
            <Button variant="outline" className="flex-1">
              Подробнее
            </Button>
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
  const [activeTab, setActiveTab] = useState<'find' | 'my'>('find');
  const [psychologists, setPsychologists] = useState<Psychologist[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [specialization, setSpecialization] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 10;

  const fetchPsychologists = async () => {
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
  };

  useEffect(() => {
    if (activeTab === 'find') {
      fetchPsychologists();
    }
  }, [activeTab, page, specialization]);

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Консультации</h1>
          <p className="mt-2 text-gray-600">
            Онлайн-консультации с квалифицированными психологами
          </p>
        </div>

        {/* Tabs */}
        <div className="flex space-x-4 mb-8">
          <button
            onClick={() => setActiveTab('find')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'find'
                ? 'bg-indigo-600 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-100'
            }`}
          >
            Найти психолога
          </button>
          <button
            onClick={() => setActiveTab('my')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'my'
                ? 'bg-indigo-600 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-100'
            }`}
          >
            Мои консультации
          </button>
        </div>

        {activeTab === 'find' ? (
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
                    <PsychologistCard key={psychologist.id} psychologist={psychologist} />
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
          /* My Consultations - Coming Soon */
          <Card>
            <CardBody>
              <EmptyStateNoConsultations onBook={() => setActiveTab('find')} />
            </CardBody>
          </Card>
        )}
      </div>
    </div>
  );
}
