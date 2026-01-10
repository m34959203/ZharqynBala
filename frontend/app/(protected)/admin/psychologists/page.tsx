'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { adminApi } from '@/lib/api';

interface Psychologist {
  id: string;
  userId: string;
  specialization: string[];
  languages: string[];
  experienceYears: number;
  education: string;
  hourlyRate: number;
  bio: string | null;
  isApproved: boolean;
  isAvailable: boolean;
  rating: number;
  totalConsultations: number;
  user: {
    email: string;
    firstName: string;
    lastName: string;
  };
  _count: {
    consultations: number;
  };
}

export default function AdminPsychologistsPage() {
  const [psychologists, setPsychologists] = useState<Psychologist[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved'>('all');

  useEffect(() => {
    loadPsychologists();
  }, []);

  const loadPsychologists = async () => {
    try {
      setLoading(true);
      const data = await adminApi.getPsychologists();
      setPsychologists(data || []);
    } catch (error) {
      console.error('Failed to load psychologists:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (psychologist: Psychologist) => {
    if (!confirm(`Одобрить психолога ${psychologist.user.firstName} ${psychologist.user.lastName}?`)) {
      return;
    }
    try {
      await adminApi.approvePsychologist(psychologist.id);
      loadPsychologists();
    } catch (error) {
      console.error('Failed to approve psychologist:', error);
      alert('Ошибка при одобрении психолога');
    }
  };

  const filteredPsychologists = psychologists.filter(p => {
    if (filter === 'pending') return !p.isApproved;
    if (filter === 'approved') return p.isApproved;
    return true;
  });

  const stats = {
    total: psychologists.length,
    pending: psychologists.filter(p => !p.isApproved).length,
    approved: psychologists.filter(p => p.isApproved).length,
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <Link href="/dashboard" className="text-indigo-600 hover:text-indigo-500 text-sm font-medium flex items-center mb-4">
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Назад к дашборду
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">Психологи</h1>
        <p className="mt-2 text-gray-600">Управление и одобрение психологов</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-xl shadow-sm p-4">
          <p className="text-sm text-gray-500">Всего</p>
          <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <p className="text-sm text-gray-500">Ожидают одобрения</p>
          <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <p className="text-sm text-gray-500">Одобрены</p>
          <p className="text-2xl font-bold text-green-600">{stats.approved}</p>
        </div>
      </div>

      {/* Filter */}
      <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg font-medium ${
              filter === 'all' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Все ({stats.total})
          </button>
          <button
            onClick={() => setFilter('pending')}
            className={`px-4 py-2 rounded-lg font-medium ${
              filter === 'pending' ? 'bg-yellow-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Ожидают ({stats.pending})
          </button>
          <button
            onClick={() => setFilter('approved')}
            className={`px-4 py-2 rounded-lg font-medium ${
              filter === 'approved' ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Одобрены ({stats.approved})
          </button>
        </div>
      </div>

      {/* Psychologists Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-500">Загрузка...</p>
          </div>
        ) : filteredPsychologists.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">Психологи не найдены</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Психолог</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Специализация</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Опыт</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Рейтинг</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Статус</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Действия</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredPsychologists.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-indigo-500 rounded-full flex items-center justify-center text-white font-bold">
                          {p.user.firstName[0]}
                        </div>
                        <div className="ml-3">
                          <p className="font-medium text-gray-900">{p.user.firstName} {p.user.lastName}</p>
                          <p className="text-sm text-gray-500">{p.user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {p.specialization.length > 0 ? (
                          p.specialization.slice(0, 2).map((spec) => (
                            <span key={spec} className="px-2 py-1 text-xs bg-indigo-100 text-indigo-700 rounded-full">
                              {spec}
                            </span>
                          ))
                        ) : (
                          <span className="text-gray-400 text-sm">Не указано</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {p.experienceYears > 0 ? `${p.experienceYears} лет` : 'Не указано'}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <svg className="w-4 h-4 text-yellow-400 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        <span className="text-sm font-medium">{p.rating.toFixed(1)}</span>
                        <span className="text-xs text-gray-400 ml-1">({p._count.consultations})</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {p.isApproved ? (
                        <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                          Одобрен
                        </span>
                      ) : (
                        <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">
                          Ожидает
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {!p.isApproved && (
                        <button
                          onClick={() => handleApprove(p)}
                          className="px-3 py-1 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700"
                        >
                          Одобрить
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
