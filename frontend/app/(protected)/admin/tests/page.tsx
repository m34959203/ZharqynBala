'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import api, { adminApi, TestData, CreateTestData, UpdateTestData } from '@/lib/api';

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

  // Methodology upload modal
  const [isMethodologyModalOpen, setIsMethodologyModalOpen] = useState(false);
  const [methodologyText, setMethodologyText] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  const [parsedMethodology, setParsedMethodology] = useState<any>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [isCreatingFromMethodology, setIsCreatingFromMethodology] = useState(false);

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

  const handleDelete = async (id: string, force: boolean = false) => {
    setIsDeleting(true);
    try {
      await adminApi.deleteTest(id, force);
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

  // Methodology modal handlers
  const openMethodologyModal = () => {
    setMethodologyText('');
    setParsedMethodology(null);
    setParseError(null);
    setIsMethodologyModalOpen(true);
  };

  const closeMethodologyModal = () => {
    setIsMethodologyModalOpen(false);
    setMethodologyText('');
    setParsedMethodology(null);
    setParseError(null);
  };

  const handleParseMethodology = async () => {
    if (!methodologyText.trim()) {
      setParseError('Вставьте текст методики');
      return;
    }

    setIsParsing(true);
    setParseError(null);

    try {
      const response = await api.post('/ai/parse-methodology', {
        methodologyText: methodologyText.trim(),
      });
      setParsedMethodology(response.data.parsed);
    } catch (err: unknown) {
      console.error('Error parsing methodology:', err);
      const error = err as { response?: { data?: { message?: string } } };
      setParseError(error.response?.data?.message || 'Ошибка анализа методики. Попробуйте снова.');
    } finally {
      setIsParsing(false);
    }
  };

  const handleCreateFromMethodology = async () => {
    if (!parsedMethodology) return;

    setIsCreatingFromMethodology(true);
    setParseError(null);

    try {
      await api.post('/ai/create-test-from-methodology', {
        methodology: parsedMethodology,
      });
      closeMethodologyModal();
      await fetchTests();
    } catch (err: unknown) {
      console.error('Error creating test:', err);
      const error = err as { response?: { data?: { message?: string } } };
      setParseError(error.response?.data?.message || 'Ошибка создания теста');
    } finally {
      setIsCreatingFromMethodology(false);
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
          <div className="flex gap-3">
            <button
              onClick={openMethodologyModal}
              className="px-6 py-3 bg-green-600 text-white font-medium rounded-xl hover:bg-green-700 flex items-center"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              Загрузить методику (AI)
            </button>
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
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-gray-900 placeholder:text-gray-500 bg-white"
            />
          </div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-gray-900 bg-white"
          >
            <option value="all">Все категории</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{getCategoryLabel(cat)}</option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-gray-900 bg-white"
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
                      <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border z-10">
                        <button
                          onClick={() => handleToggleStatus(test)}
                          className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center"
                        >
                          {test.isActive ? (
                            <>
                              <svg className="w-4 h-4 mr-2 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              В черновик
                            </>
                          ) : (
                            <>
                              <svg className="w-4 h-4 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              Активировать
                            </>
                          )}
                        </button>
                        <hr className="my-1" />
                        <button
                          onClick={() => handleDelete(test.id, false)}
                          disabled={isDeleting}
                          className="w-full px-4 py-2 text-left text-sm text-orange-600 hover:bg-orange-50 flex items-center"
                        >
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          {isDeleting ? 'Удаление...' : 'Удалить'}
                        </button>
                        <button
                          onClick={() => {
                            if (confirm('Вы уверены? Это удалит тест и ВСЕ данные прохождений безвозвратно!')) {
                              handleDelete(test.id, true);
                            }
                          }}
                          disabled={isDeleting}
                          className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center"
                        >
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                          </svg>
                          Удалить полностью
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
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-gray-900 placeholder:text-gray-500"
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
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-gray-900 placeholder:text-gray-500"
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
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-gray-900 placeholder:text-gray-500"
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
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-gray-900 placeholder:text-gray-500"
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
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-gray-900 bg-white"
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
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-gray-900 bg-white"
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
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-gray-900 bg-white"
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
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-gray-900 bg-white"
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
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-gray-900 bg-white"
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

      {/* Methodology Upload Modal */}
      {isMethodologyModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    Создать тест из методики (AI)
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">
                    Вставьте текст методики, и AI автоматически создаст тест с вопросами
                  </p>
                </div>
                <button onClick={closeMethodologyModal} className="text-gray-400 hover:text-gray-600">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-6">
              {parseError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  {parseError}
                </div>
              )}

              {!parsedMethodology ? (
                <>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Текст методики
                    </label>
                    <textarea
                      value={methodologyText}
                      onChange={(e) => setMethodologyText(e.target.value)}
                      rows={15}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 text-gray-900 placeholder:text-gray-500 font-mono text-sm"
                      placeholder="Вставьте сюда полный текст методики психологического теста, включая:&#10;&#10;- Название теста&#10;- Описание и цель методики&#10;- Возрастной диапазон&#10;- Все вопросы с вариантами ответов&#10;- Ключ для подсчёта баллов&#10;- Интерпретацию результатов (уровни, описания, рекомендации)"
                    />
                  </div>

                  <div className="flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={closeMethodologyModal}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                    >
                      Отмена
                    </button>
                    <button
                      onClick={handleParseMethodology}
                      disabled={isParsing || !methodologyText.trim()}
                      className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center"
                    >
                      {isParsing ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                          Анализирую...
                        </>
                      ) : (
                        <>
                          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                          </svg>
                          Проанализировать
                        </>
                      )}
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="mb-6">
                    <div className="flex items-center mb-4">
                      <svg className="w-6 h-6 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <h3 className="text-lg font-semibold text-gray-900">Методика успешно проанализирована!</h3>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                      <div>
                        <span className="text-sm text-gray-500">Название:</span>
                        <p className="font-medium text-gray-900">{parsedMethodology.titleRu}</p>
                      </div>
                      <div>
                        <span className="text-sm text-gray-500">Описание:</span>
                        <p className="text-gray-700">{parsedMethodology.descriptionRu}</p>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <span className="text-sm text-gray-500">Категория:</span>
                          <p className="font-medium text-gray-900">{getCategoryLabel(parsedMethodology.category)}</p>
                        </div>
                        <div>
                          <span className="text-sm text-gray-500">Возраст:</span>
                          <p className="font-medium text-gray-900">{parsedMethodology.ageMin}-{parsedMethodology.ageMax} лет</p>
                        </div>
                        <div>
                          <span className="text-sm text-gray-500">Вопросов:</span>
                          <p className="font-medium text-gray-900">{parsedMethodology.questions?.length || 0}</p>
                        </div>
                        <div>
                          <span className="text-sm text-gray-500">Длительность:</span>
                          <p className="font-medium text-gray-900">{parsedMethodology.durationMinutes} мин</p>
                        </div>
                      </div>
                      {parsedMethodology.interpretationRanges?.length > 0 && (
                        <div>
                          <span className="text-sm text-gray-500">Уровни интерпретации:</span>
                          <div className="mt-2 flex flex-wrap gap-2">
                            {parsedMethodology.interpretationRanges.map((range: any, idx: number) => (
                              <span key={idx} className="px-2 py-1 bg-indigo-100 text-indigo-700 text-xs rounded-full">
                                {range.title} ({range.min}-{range.max})
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={() => setParsedMethodology(null)}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                    >
                      Изменить текст
                    </button>
                    <button
                      onClick={handleCreateFromMethodology}
                      disabled={isCreatingFromMethodology}
                      className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center"
                    >
                      {isCreatingFromMethodology ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                          Создаю тест...
                        </>
                      ) : (
                        <>
                          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                          </svg>
                          Создать тест
                        </>
                      )}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
