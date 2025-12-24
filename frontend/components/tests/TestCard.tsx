'use client';

import Link from 'next/link';
import { Test, categoryLabels, categoryColors } from '@/lib/types';

interface TestCardProps {
  test: Test;
}

export function TestCard({ test }: TestCardProps) {
  const categoryLabel = categoryLabels[test.category]?.ru || test.category;
  const categoryColor = categoryColors[test.category] || 'bg-gray-100 text-gray-700';

  return (
    <div className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden">
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${categoryColor}`}>
            {categoryLabel}
          </span>
          {test.isPremium && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
              Premium
            </span>
          )}
        </div>

        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          {test.titleRu}
        </h3>

        <p className="text-gray-600 text-sm mb-4 line-clamp-2">
          {test.descriptionRu}
        </p>

        <div className="flex items-center text-sm text-gray-500 mb-4 space-x-4">
          <span className="flex items-center">
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {test.durationMinutes} мин
          </span>
          <span className="flex items-center">
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            {test.ageMin}-{test.ageMax} лет
          </span>
          {test.questionsCount && (
            <span className="flex items-center">
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {test.questionsCount} вопросов
            </span>
          )}
        </div>

        <div className="flex items-center justify-between">
          <div className="text-lg font-bold">
            {test.price === 0 ? (
              <span className="text-green-600">Бесплатно</span>
            ) : (
              <span className="text-gray-900">{test.price.toLocaleString()} ₸</span>
            )}
          </div>
          <Link
            href={`/tests/${test.id}`}
            className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Подробнее
            <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>
    </div>
  );
}
