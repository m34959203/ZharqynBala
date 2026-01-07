'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { adminApi, TestData, CreateTestData, UpdateTestData } from '@/lib/api';

const TEST_CATEGORIES = [
  { value: 'ANXIETY', label: 'Тревожность', labelKz: 'Алаңдаушылық' },
  { value: 'MOTIVATION', label: 'Мотивация', labelKz: 'Мотивация' },
  { value: 'ATTENTION', label: 'Внимание', labelKz: 'Зейін' },
  { value: 'EMOTIONS', label: 'Эмоции', labelKz: 'Эмоциялар' },
  { value: 'CAREER', label: 'Карьера', labelKz: 'Мансап' },
  { value: 'SELF_ESTEEM', label: 'Самооценка', labelKz: 'Өзін-өзі бағалау' },
  { value: 'SOCIAL', label: 'Социальные навыки', labelKz: 'Әлеуметтік дағдылар' },
  { value: 'COGNITIVE', label: 'Когнитивное развитие', labelKz: 'Когнитивтік даму' },
];

const getCategoryLabel = (category: string): string => {
  return TEST_CATEGORIES.find(c => c.value === category)?.label || category;
};

const getStatusColor = (isActive: boolean) => {
  return isActive ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800';
};

const getStatusLabel = (isActive: boolean) => {
  return isActive ? 'Активен' : 'Черновик';
};

interface TestFormData {
  titleRu: string;
  titleKz: string;
  descriptionRu: string;
  descriptionKz: string;
  category: string;
  ageMin: number;
  ageMax: number;
  durationMinutes: number;
  price: number;
  isPremium: boolean;
  isActive: boolean;
}

const initialFormData: TestFormData = {
  titleRu: '',
  titleKz: '',
  descriptionRu: '',
  descriptionKz: '',
  category: 'ANXIETY',
  ageMin: 7,
  ageMax: 17,
  durationMinutes: 15,
  price: 0,
  isPremium: false,
  isActive: false,
};

export default function AdminTestsPage() {
  const [tests, setTests] = useState<TestData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingTestId, setEditingTestId] = useState<string | null>(null);
  const [formData, setFormData] = useState<TestFormData>(initialFormData);
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Delete confirmation
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch tests from API
  useEffect(() => {
    fetchTests();
  }, []);

  const fetchTests = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await adminApi.getTests();
      setTests(data);
    } catch (err: unknown) {
      console.error('Error fetching tests:', err);
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || 'Ошибка загрузки тестов');
    } finally {
      setIsLoading(false);
    }
  };

  const categories = [...new Set(tests.map(t => t.category))];

  const filteredTests = tests.filter(test => {
    const matchesSearch = test.titleRu.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         test.titleKz.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || test.category === categoryFilter;
    const matchesStatus = statusFilter === 'all' ||
                          (statusFilter === 'ACTIVE' && test.isActive) ||
                          (statusFilter === 'DRAFT' && !test.isActive);
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const stats = {
    total: tests.length,
    active: tests.filter(t => t.isActive).length,
    totalSessions: tests.reduce((sum, t) => sum + (t._count?.sessions || 0), 0),
    avgDuration: tests.length > 0
      ? Math.round(tests.reduce((sum, t) => sum + t.durationMinutes, 0) / tests.length)
      : 0,
  };

  // Modal handlers
  const openCreateModal = () => {
    setFormData(initialFormData);
    setIsEditing(false);
    setEditingTestId(null);
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (test: TestData) => {
    setFormData({
      titleRu: test.titleRu,
      titleKz: test.titleKz,
      descriptionRu: test.descriptionRu,
      descriptionKz: test.descriptionKz,
      category: test.category,
      ageMin: test.ageMin,
      ageMax: test.ageMax,
      durationMinutes: test.durationMinutes,
      price: test.price,
      isPremium: test.isPremium,
      isActive: test.isActive,
    });
    setIsEditing(true);
    setEditingTestId(test.id);
    setFormError(null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setFormData(initialFormData);
    setIsEditing(false);
    setEditingTestId(null);
    setFormError(null);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;

    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else if (type === 'number') {
      setFormData(prev => ({ ...prev, [name]: parseInt(value) || 0 }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setIsSaving(true);

    try {
      if (isEditing && editingTestId) {
        // Update existing test
        const updateData: UpdateTestData = {
          ...formData,
        };
        await adminApi.updateTest(editingTestId, updateData);
      } else {
        // Create new test
        const createData: CreateTestData = {
          ...formData,
        };
        await adminApi.createTest(createData);
      }

      closeModal();
      await fetchTests();
    } catch (err: unknown) {
      console.error('Error saving test:', err);
      const error = err as { response?: { data?: { message?: string } } };
      setFormError(error.response?.data?.message || 'Ошибка сохранения теста');
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleStatus = async (test: TestData) => {
    try {
      await adminApi.toggleTest(test.id);
      await fetchTests();
      setDeleteConfirmId(null);
    } catch (err: unknown) {
      console.error('Error toggling test:', err);
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || 'Ошибка изменения статуса');
    }
  };

  const handleDelete = async (id: string) => {
    setIsDeleting(true);
    try {
      await adminApi.deleteTest(id);
      setDeleteConfirmId(null);
      await fetchTests();
    } catch (err: unknown) {
      console.error('Error deleting test:', err);
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || 'Ошибка удаления теста');
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <Link href="/dashboard" className="text-indigo-600 hover:text-indigo-500 text-sm font-medium flex items-center mb-4">
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Назад к дашборду
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Каталог тестов</h1>
            <p className="mt-2 text-gray-600">Управление психологическими тестами</p>
          </div>
          <button
            onClick={openCreateModal}
            className="px-6 py-3 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 flex items-center"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Добавить тест
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
          <button onClick={() => setError(null)} className="ml-2 text-red-500 hover:text-red-700">
            &times;
          </button>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl shadow-sm p-5">
          <p className="text-sm text-gray-500">Всего тестов</p>
          <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-5">
          <p className="text-sm text-gray-500">Активных</p>
          <p className="text-2xl font-bold text-green-600">{stats.active}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-5">
          <p className="text-sm text-gray-500">Прохождений</p>
          <p className="text-2xl font-bold text-indigo-600">{stats.totalSessions.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-5">
          <p className="text-sm text-gray-500">Ср. длительность</p>
          <p className="text-2xl font-bold text-gray-900">{stats.avgDuration} мин</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Поиск по названию..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">Все категории</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{getCategoryLabel(cat)}</option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">Все статусы</option>
            <option value="ACTIVE">Активные</option>
            <option value="DRAFT">Черновики</option>
          </select>
        </div>
      </div>

      {/* Tests Grid */}
      {filteredTests.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-8 text-center">
          <p className="text-gray-500">Тесты не найдены</p>
          <button
            onClick={openCreateModal}
            className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            Создать первый тест
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTests.map((test) => (
            <div key={test.id} className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow">
              <div className="p-6">
                <div className="flex items-start justify-between mb-3">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(test.isActive)}`}>
                    {getStatusLabel(test.isActive)}
                  </span>
                  <div className="relative">
                    <button
                      onClick={() => setDeleteConfirmId(deleteConfirmId === test.id ? null : test.id)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                      </svg>
                    </button>
                    {deleteConfirmId === test.id && (
                      <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border z-10">
                        <button
                          onClick={() => handleToggleStatus(test)}
                          className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100"
                        >
                          {test.isActive ? 'Деактивировать' : 'Активировать'}
                        </button>
                        <button
                          onClick={() => handleDelete(test.id)}
                          disabled={isDeleting}
                          className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                        >
                          {isDeleting ? 'Удаление...' : 'Удалить'}
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <h3 className="font-semibold text-gray-900 mb-1">{test.titleRu}</h3>
                <p className="text-sm text-gray-500 mb-3 line-clamp-2">{test.descriptionRu}</p>

                <div className="flex flex-wrap gap-2 mb-4">
                  <span className="px-2 py-1 bg-indigo-50 text-indigo-700 text-xs rounded-full">
                    {getCategoryLabel(test.category)}
                  </span>
                  <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                    {test.ageMin}-{test.ageMax} лет
                  </span>
                  {test.isPremium && (
                    <span className="px-2 py-1 bg-amber-100 text-amber-700 text-xs rounded-full">
                      Премиум
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-2 text-center border-t pt-4">
                  <div>
                    <p className="text-lg font-bold text-gray-900">{test._count?.questions || 0}</p>
                    <p className="text-xs text-gray-500">вопросов</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-gray-900">{test.durationMinutes}</p>
                    <p className="text-xs text-gray-500">минут</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-indigo-600">{test._count?.sessions || 0}</p>
                    <p className="text-xs text-gray-500">прошли</p>
                  </div>
                </div>
              </div>

              <div className="px-6 py-3 bg-gray-50 flex justify-between items-center">
                <span className="text-xs text-gray-500">
                  {test.price > 0 ? `${test.price.toLocaleString()} KZT` : 'Бесплатно'}
                </span>
                <button
                  onClick={() => openEditModal(test)}
                  className="text-indigo-600 hover:text-indigo-500 text-sm font-medium"
                >
                  Редактировать
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">
                  {isEditing ? 'Редактировать тест' : 'Создать новый тест'}
                </h2>
                <button onClick={closeModal} className="text-gray-400 hover:text-gray-600">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  {formError}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Название (RU) *
                  </label>
                  <input
                    type="text"
                    name="titleRu"
                    value={formData.titleRu}
                    onChange={handleInputChange}
                    required
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    placeholder="Тест на тревожность"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Название (KZ) *
                  </label>
                  <input
                    type="text"
                    name="titleKz"
                    value={formData.titleKz}
                    onChange={handleInputChange}
                    required
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    placeholder="Алаңдаушылық тесті"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Описание (RU) *
                </label>
                <textarea
                  name="descriptionRu"
                  value={formData.descriptionRu}
                  onChange={handleInputChange}
                  required
                  rows={3}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  placeholder="Описание теста на русском языке..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Описание (KZ) *
                </label>
                <textarea
                  name="descriptionKz"
                  value={formData.descriptionKz}
                  onChange={handleInputChange}
                  required
                  rows={3}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  placeholder="Тест сипаттамасы қазақ тілінде..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Категория *
                  </label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    required
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  >
                    {TEST_CATEGORIES.map(cat => (
                      <option key={cat.value} value={cat.value}>{cat.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Мин. возраст *
                  </label>
                  <input
                    type="number"
                    name="ageMin"
                    value={formData.ageMin}
                    onChange={handleInputChange}
                    required
                    min={1}
                    max={99}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Макс. возраст *
                  </label>
                  <input
                    type="number"
                    name="ageMax"
                    value={formData.ageMax}
                    onChange={handleInputChange}
                    required
                    min={1}
                    max={99}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Длительность (мин) *
                  </label>
                  <input
                    type="number"
                    name="durationMinutes"
                    value={formData.durationMinutes}
                    onChange={handleInputChange}
                    required
                    min={1}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Цена (KZT)
                  </label>
                  <input
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleInputChange}
                    min={0}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-6">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    name="isPremium"
                    checked={formData.isPremium}
                    onChange={handleInputChange}
                    className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                  />
                  <span className="text-sm text-gray-700">Премиум тест</span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    name="isActive"
                    checked={formData.isActive}
                    onChange={handleInputChange}
                    className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                  />
                  <span className="text-sm text-gray-700">Активировать сразу</span>
                </label>
              </div>

              <div className="pt-4 border-t flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                >
                  {isSaving ? 'Сохранение...' : (isEditing ? 'Сохранить' : 'Создать')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
