'use client';

export default function OfflinePage() {
  const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="text-center max-w-md">
        <div className="mb-8">
          <svg
            className="mx-auto h-24 w-24 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414"
            />
          </svg>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Нет подключения к интернету
        </h1>

        <p className="text-gray-600 mb-8">
          Проверьте подключение к интернету и попробуйте снова. Некоторые функции
          могут быть недоступны в офлайн-режиме.
        </p>

        <div className="space-y-4">
          <button
            onClick={handleRefresh}
            className="w-full bg-indigo-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-indigo-700 transition-colors"
          >
            Попробовать снова
          </button>

          <div className="text-sm text-gray-500">
            <p className="mb-2">Доступно в офлайн-режиме:</p>
            <ul className="space-y-1">
              <li>• Просмотр сохранённых результатов</li>
              <li>• Просмотр списка тестов</li>
              <li>• Профиль ребёнка</li>
            </ul>
          </div>
        </div>

        <div className="mt-8 text-sm text-gray-400">
          <p>ZharqynBala работает и без интернета!</p>
          <p>Данные синхронизируются автоматически.</p>
        </div>
      </div>
    </div>
  );
}
