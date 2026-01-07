'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button, Card, CardBody } from '@/components/ui';
import { formatDate, formatTime, formatCurrency } from '@/lib/utils';

interface Psychologist {
  id: string;
  firstName: string;
  lastName: string;
  specialization: string[];
  experience: number;
  hourlyRate: number;
  rating: number;
  reviewCount: number;
  avatarUrl?: string;
  isAvailable: boolean;
}

interface Consultation {
  id: string;
  psychologistName: string;
  scheduledAt: string;
  status: 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';
  type: 'VIDEO' | 'CHAT';
}

const mockPsychologists: Psychologist[] = [
  {
    id: '1',
    firstName: 'Айгуль',
    lastName: 'Касымова',
    specialization: ['Детская психология', 'Тревожные расстройства'],
    experience: 8,
    hourlyRate: 10000,
    rating: 4.9,
    reviewCount: 127,
    isAvailable: true,
  },
  {
    id: '2',
    firstName: 'Мария',
    lastName: 'Иванова',
    specialization: ['Семейная терапия', 'Подростковый возраст'],
    experience: 12,
    hourlyRate: 15000,
    rating: 4.8,
    reviewCount: 89,
    isAvailable: true,
  },
  {
    id: '3',
    firstName: 'Асель',
    lastName: 'Нурланова',
    specialization: ['Эмоциональное развитие', 'СДВГ'],
    experience: 5,
    hourlyRate: 8000,
    rating: 4.7,
    reviewCount: 45,
    isAvailable: false,
  },
];

export default function ConsultationsPage() {
  const [activeTab, setActiveTab] = useState<'find' | 'my'>('find');
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [loading, setLoading] = useState(false);

  const getStatusBadge = (status: Consultation['status']) => {
    const styles = {
      PENDING: 'bg-yellow-100 text-yellow-700',
      CONFIRMED: 'bg-green-100 text-green-700',
      COMPLETED: 'bg-blue-100 text-blue-700',
      CANCELLED: 'bg-red-100 text-red-700',
    };
    const labels = {
      PENDING: 'Ожидает',
      CONFIRMED: 'Подтверждена',
      COMPLETED: 'Завершена',
      CANCELLED: 'Отменена',
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status]}`}>
        {labels[status]}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Консультации</h1>
          <p className="mt-2 text-gray-600">
            Запишитесь на онлайн-консультацию с квалифицированным психологом
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
          <div className="grid gap-6">
            {mockPsychologists.map((psychologist) => (
              <Card key={psychologist.id} variant="elevated">
                <CardBody>
                  <div className="flex items-start justify-between">
                    <div className="flex space-x-4">
                      <div className="w-20 h-20 bg-indigo-100 rounded-xl flex items-center justify-center">
                        <span className="text-2xl font-bold text-indigo-600">
                          {psychologist.firstName[0]}{psychologist.lastName[0]}
                        </span>
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {psychologist.firstName} {psychologist.lastName}
                          </h3>
                          {psychologist.isAvailable && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                              Доступен
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {psychologist.specialization.map((spec, index) => (
                            <span
                              key={index}
                              className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full"
                            >
                              {spec}
                            </span>
                          ))}
                        </div>
                        <div className="flex items-center space-x-4 mt-3 text-sm text-gray-500">
                          <span>Опыт: {psychologist.experience} лет</span>
                          <span className="flex items-center">
                            <svg className="w-4 h-4 text-yellow-400 mr-1" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                            {psychologist.rating} ({psychologist.reviewCount} отзывов)
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-gray-900">
                        {formatCurrency(psychologist.hourlyRate)}
                      </p>
                      <p className="text-sm text-gray-500">за час</p>
                      <Button
                        className="mt-4"
                        disabled={!psychologist.isAvailable}
                      >
                        {psychologist.isAvailable ? 'Записаться' : 'Недоступен'}
                      </Button>
                    </div>
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>
        ) : (
          <div>
            {consultations.length === 0 ? (
              <Card>
                <CardBody>
                  <div className="text-center py-12">
                    <svg className="mx-auto h-16 w-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <h3 className="mt-4 text-lg font-medium text-gray-900">Нет записей</h3>
                    <p className="mt-2 text-gray-500">У вас пока нет запланированных консультаций</p>
                    <Button className="mt-4" onClick={() => setActiveTab('find')}>
                      Найти психолога
                    </Button>
                  </div>
                </CardBody>
              </Card>
            ) : (
              <div className="grid gap-4">
                {consultations.map((consultation) => (
                  <Card key={consultation.id}>
                    <CardBody>
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold text-gray-900">{consultation.psychologistName}</h3>
                          <p className="text-sm text-gray-500">
                            {formatDate(consultation.scheduledAt)} в {formatTime(consultation.scheduledAt)}
                          </p>
                        </div>
                        <div className="flex items-center space-x-3">
                          {getStatusBadge(consultation.status)}
                          {consultation.status === 'CONFIRMED' && (
                            <Button size="sm">Присоединиться</Button>
                          )}
                        </div>
                      </div>
                    </CardBody>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
