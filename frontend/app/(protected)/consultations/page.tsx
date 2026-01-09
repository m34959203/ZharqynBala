'use client';

import { useState } from 'react';
import { Card, CardBody } from '@/components/ui';

export default function ConsultationsPage() {
  const [activeTab, setActiveTab] = useState<'find' | 'my'>('find');

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

        {/* Coming Soon State */}
        <Card>
          <CardBody>
            <div className="text-center py-16">
              <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Раздел в разработке
              </h3>
              <p className="text-gray-500 max-w-md mx-auto mb-6">
                {activeTab === 'find'
                  ? 'Скоро здесь появится возможность записаться на онлайн-консультацию с квалифицированными детскими психологами.'
                  : 'Здесь будут отображаться ваши запланированные и прошедшие консультации.'}
              </p>
              <div className="inline-flex items-center px-4 py-2 bg-indigo-50 text-indigo-700 rounded-lg text-sm font-medium">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Скоро
              </div>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
