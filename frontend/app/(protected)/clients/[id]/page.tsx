'use client';

import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  children: { id: string; name: string; age: number }[];
  lastConsultation: string;
  totalConsultations: number;
  status: 'ACTIVE' | 'INACTIVE';
}

const mockClients: Record<string, Client> = {
  '1': {
    id: '1',
    name: 'Асем Нурпеисова',
    email: 'asem@mail.kz',
    phone: '+7 701 123 4567',
    children: [
      { id: '1', name: 'Айгерим', age: 12 },
      { id: '2', name: 'Алихан', age: 8 },
    ],
    lastConsultation: '2025-12-20',
    totalConsultations: 8,
    status: 'ACTIVE',
  },
  '2': {
    id: '2',
    name: 'Марат Сагынбаев',
    email: 'marat@mail.kz',
    phone: '+7 702 234 5678',
    children: [{ id: '3', name: 'Алишер', age: 10 }],
    lastConsultation: '2025-12-18',
    totalConsultations: 5,
    status: 'ACTIVE',
  },
  '3': {
    id: '3',
    name: 'Динара Жумабаева',
    email: 'dinara@mail.kz',
    phone: '+7 707 345 6789',
    children: [{ id: '4', name: 'Камила', age: 14 }],
    lastConsultation: '2025-12-15',
    totalConsultations: 3,
    status: 'ACTIVE',
  },
  '4': {
    id: '4',
    name: 'Бауыржан Касымов',
    email: 'baurzhan@mail.kz',
    phone: '+7 705 456 7890',
    children: [{ id: '5', name: 'Ернар', age: 9 }],
    lastConsultation: '2025-11-28',
    totalConsultations: 12,
    status: 'INACTIVE',
  },
};

export default function ClientDetailPage() {
  const params = useParams();
  const router = useRouter();
  const clientId = params.id as string;
  const client = mockClients[clientId];

  if (!client) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-12">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M12 12h.01M12 12h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="mt-2 text-lg font-medium text-gray-900">Клиент не найден</h3>
          <p className="mt-1 text-sm text-gray-500">Клиент с ID {clientId} не существует</p>
          <Link
            href="/clients"
            className="mt-4 inline-flex items-center px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700"
          >
            Вернуться к списку
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Back Button */}
      <button
        onClick={() => router.back()}
        className="flex items-center text-gray-600 hover:text-gray-900 mb-6"
      >
        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Назад
      </button>

      {/* Client Header */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center">
            <div className="w-16 h-16 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-2xl">
              {client.name.split(' ').map(n => n[0]).join('')}
            </div>
            <div className="ml-4">
              <div className="flex items-center">
                <h1 className="text-2xl font-bold text-gray-900">{client.name}</h1>
                <span className={`ml-3 px-3 py-1 rounded-full text-sm font-medium ${
                  client.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {client.status === 'ACTIVE' ? 'Активен' : 'Неактивен'}
                </span>
              </div>
              <p className="text-gray-600 mt-1">{client.email}</p>
              <p className="text-gray-600">{client.phone}</p>
            </div>
          </div>
          <div className="flex space-x-3">
            <button className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700">
              Записать на консультацию
            </button>
            <button className="px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50">
              Написать сообщение
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Stats */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Статистика</h2>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-gray-600">Всего консультаций</span>
                <span className="font-semibold text-gray-900">{client.totalConsultations}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Последняя консультация</span>
                <span className="font-semibold text-gray-900">
                  {new Date(client.lastConsultation).toLocaleDateString('ru-RU')}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Детей</span>
                <span className="font-semibold text-gray-900">{client.children.length}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Children */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Дети</h2>
            <div className="space-y-4">
              {client.children.map((child) => (
                <div key={child.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-full flex items-center justify-center text-white font-bold">
                      {child.name[0]}
                    </div>
                    <div className="ml-3">
                      <p className="font-medium text-gray-900">{child.name}</p>
                      <p className="text-sm text-gray-500">{child.age} лет</p>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button className="px-3 py-1 text-sm text-indigo-600 hover:bg-indigo-50 rounded-lg">
                      Тесты
                    </button>
                    <button className="px-3 py-1 text-sm text-indigo-600 hover:bg-indigo-50 rounded-lg">
                      Отчёты
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
