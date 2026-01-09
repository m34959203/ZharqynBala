'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { Button, Card, CardHeader, CardBody, Alert } from '@/components/ui';

interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  role: string;
  createdAt: string;
}

interface PsychologistProfile {
  id: string;
  specialization: string[];
  languages: string[];
  experienceYears: number;
  education: string;
  bio: string | null;
  hourlyRate: number;
  rating: number;
  totalConsultations: number;
  isAvailable: boolean;
  certificateUrl: string | null;
  isProfileComplete: boolean;
}

const SPECIALIZATIONS = [
  'Детский психолог',
  'Семейный психолог',
  'Клинический психолог',
  'Психотерапевт',
  'Нейропсихолог',
  'Школьный психолог',
];

const LANGUAGES = [
  'Русский',
  'Казахский',
  'Английский',
];

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [psychologistProfile, setPsychologistProfile] = useState<PsychologistProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editingPsychologist, setEditingPsychologist] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savingPsychologist, setSavingPsychologist] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
  });
  const [psychologistFormData, setPsychologistFormData] = useState({
    specialization: [] as string[],
    languages: ['Русский'] as string[],
    experienceYears: 0,
    education: '',
    bio: '',
    hourlyRate: 5000,
    certificateUrl: '',
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await api.get('/users/me');
      setProfile(response.data);
      setFormData({
        firstName: response.data.firstName || '',
        lastName: response.data.lastName || '',
        phone: response.data.phone || '',
      });

      // Если пользователь - психолог, загружаем профиль психолога
      if (response.data.role === 'PSYCHOLOGIST') {
        try {
          const psychResponse = await fetch('/api/psychologists/me');
          if (psychResponse.ok) {
            const psychData = await psychResponse.json();
            setPsychologistProfile(psychData);
            setPsychologistFormData({
              specialization: psychData.specialization || [],
              languages: psychData.languages || ['Русский'],
              experienceYears: psychData.experienceYears || 0,
              education: psychData.education || '',
              bio: psychData.bio || '',
              hourlyRate: psychData.hourlyRate || 5000,
              certificateUrl: psychData.certificateUrl || '',
            });
          }
        } catch (error) {
          console.error('Failed to fetch psychologist profile:', error);
        }
      }
    } catch (error) {
      console.error('Failed to fetch profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.patch('/users/me', formData);
      await fetchProfile();
      setEditing(false);
    } catch (error) {
      console.error('Failed to update profile:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleSavePsychologist = async () => {
    setSavingPsychologist(true);
    try {
      const response = await fetch('/api/psychologists/me', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(psychologistFormData),
      });

      if (response.ok) {
        await fetchProfile();
        setEditingPsychologist(false);
      }
    } catch (error) {
      console.error('Failed to update psychologist profile:', error);
    } finally {
      setSavingPsychologist(false);
    }
  };

  const toggleSpecialization = (spec: string) => {
    setPsychologistFormData((prev) => ({
      ...prev,
      specialization: prev.specialization.includes(spec)
        ? prev.specialization.filter((s) => s !== spec)
        : [...prev.specialization, spec],
    }));
  };

  const toggleLanguage = (lang: string) => {
    setPsychologistFormData((prev) => ({
      ...prev,
      languages: prev.languages.includes(lang)
        ? prev.languages.filter((l) => l !== lang)
        : [...prev.languages, lang],
    }));
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
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Профиль</h1>

        <div className="space-y-6">
          {/* Предупреждение о незаполненном профиле психолога */}
          {profile?.role === 'PSYCHOLOGIST' && psychologistProfile && !psychologistProfile.isProfileComplete && (
            <Alert variant="warning">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-yellow-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <div>
                  <p className="font-medium text-yellow-800">Заполните профиль психолога</p>
                  <p className="text-sm text-yellow-700 mt-1">
                    Чтобы отображаться в списке психологов для клиентов, заполните все обязательные поля профиля.
                  </p>
                </div>
              </div>
            </Alert>
          )}

          {/* Profile Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Личная информация</h2>
                {!editing && (
                  <Button variant="ghost" size="sm" onClick={() => setEditing(true)}>
                    Редактировать
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardBody>
              {editing ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Имя</label>
                      <input
                        type="text"
                        value={formData.firstName}
                        onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 bg-white placeholder:text-gray-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Фамилия</label>
                      <input
                        type="text"
                        value={formData.lastName}
                        onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 bg-white placeholder:text-gray-500"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Телефон</label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 bg-white placeholder:text-gray-500"
                    />
                  </div>
                  <div className="flex space-x-3">
                    <Button onClick={handleSave} isLoading={saving}>Сохранить</Button>
                    <Button variant="ghost" onClick={() => setEditing(false)}>Отмена</Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center">
                      <span className="text-2xl font-bold text-indigo-600">
                        {profile?.firstName?.[0]?.toUpperCase() || 'U'}
                      </span>
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900">
                        {profile?.firstName} {profile?.lastName}
                      </h3>
                      <p className="text-gray-500">{profile?.email}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100">
                    <div>
                      <p className="text-sm text-gray-500">Телефон</p>
                      <p className="font-medium">{profile?.phone || 'Не указан'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Дата регистрации</p>
                      <p className="font-medium">
                        {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString('ru-RU') : '-'}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </CardBody>
          </Card>

          {/* Психолог профиль */}
          {profile?.role === 'PSYCHOLOGIST' && psychologistProfile && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900">Профиль психолога</h2>
                  {!editingPsychologist && (
                    <Button variant="ghost" size="sm" onClick={() => setEditingPsychologist(true)}>
                      Редактировать
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardBody>
                {editingPsychologist ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Специализации *
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {SPECIALIZATIONS.map((spec) => (
                          <button
                            key={spec}
                            type="button"
                            onClick={() => toggleSpecialization(spec)}
                            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                              psychologistFormData.specialization.includes(spec)
                                ? 'bg-indigo-600 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                          >
                            {spec}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Языки консультации *
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {LANGUAGES.map((lang) => (
                          <button
                            key={lang}
                            type="button"
                            onClick={() => toggleLanguage(lang)}
                            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                              psychologistFormData.languages.includes(lang)
                                ? 'bg-green-600 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                          >
                            {lang}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Опыт работы (лет) *
                        </label>
                        <input
                          type="number"
                          min="0"
                          max="50"
                          value={psychologistFormData.experienceYears}
                          onChange={(e) =>
                            setPsychologistFormData({
                              ...psychologistFormData,
                              experienceYears: parseInt(e.target.value) || 0,
                            })
                          }
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Стоимость (₸/час) *
                        </label>
                        <input
                          type="number"
                          min="1000"
                          max="100000"
                          step="500"
                          value={psychologistFormData.hourlyRate}
                          onChange={(e) =>
                            setPsychologistFormData({
                              ...psychologistFormData,
                              hourlyRate: parseInt(e.target.value) || 5000,
                            })
                          }
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 bg-white"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Образование *
                      </label>
                      <input
                        type="text"
                        value={psychologistFormData.education}
                        onChange={(e) =>
                          setPsychologistFormData({
                            ...psychologistFormData,
                            education: e.target.value,
                          })
                        }
                        placeholder="Например: КазНУ, факультет психологии, 2015"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 bg-white placeholder:text-gray-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        О себе *
                      </label>
                      <textarea
                        rows={4}
                        value={psychologistFormData.bio}
                        onChange={(e) =>
                          setPsychologistFormData({
                            ...psychologistFormData,
                            bio: e.target.value,
                          })
                        }
                        placeholder="Расскажите о своём опыте, подходе к работе и специализации..."
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 bg-white placeholder:text-gray-500 resize-none"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Ссылка на сертификат (необязательно)
                      </label>
                      <input
                        type="url"
                        value={psychologistFormData.certificateUrl}
                        onChange={(e) =>
                          setPsychologistFormData({
                            ...psychologistFormData,
                            certificateUrl: e.target.value,
                          })
                        }
                        placeholder="https://..."
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 bg-white placeholder:text-gray-500"
                      />
                    </div>

                    <div className="flex space-x-3">
                      <Button
                        onClick={handleSavePsychologist}
                        isLoading={savingPsychologist}
                        disabled={
                          psychologistFormData.specialization.length === 0 ||
                          psychologistFormData.languages.length === 0 ||
                          !psychologistFormData.education ||
                          psychologistFormData.education === 'Не указано'
                        }
                      >
                        Сохранить
                      </Button>
                      <Button variant="ghost" onClick={() => setEditingPsychologist(false)}>
                        Отмена
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-gray-500 mb-2">Специализации</p>
                      <div className="flex flex-wrap gap-2">
                        {psychologistProfile.specialization.length > 0 ? (
                          psychologistProfile.specialization.map((spec) => (
                            <span
                              key={spec}
                              className="px-3 py-1 rounded-full text-sm font-medium bg-indigo-100 text-indigo-700"
                            >
                              {spec}
                            </span>
                          ))
                        ) : (
                          <span className="text-gray-400">Не указаны</span>
                        )}
                      </div>
                    </div>

                    <div className="pt-4 border-t border-gray-100">
                      <p className="text-sm text-gray-500 mb-2">Языки консультации</p>
                      <div className="flex flex-wrap gap-2">
                        {psychologistProfile.languages?.length > 0 ? (
                          psychologistProfile.languages.map((lang) => (
                            <span
                              key={lang}
                              className="px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-700"
                            >
                              {lang}
                            </span>
                          ))
                        ) : (
                          <span className="text-gray-400">Не указаны</span>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100">
                      <div>
                        <p className="text-sm text-gray-500">Опыт работы</p>
                        <p className="font-medium">{psychologistProfile.experienceYears} лет</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Стоимость</p>
                        <p className="font-medium">{psychologistProfile.hourlyRate.toLocaleString()} ₸/час</p>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-gray-100">
                      <p className="text-sm text-gray-500">Образование</p>
                      <p className="font-medium">
                        {psychologistProfile.education === 'Не указано' ? (
                          <span className="text-gray-400">Не указано</span>
                        ) : (
                          psychologistProfile.education
                        )}
                      </p>
                    </div>

                    <div className="pt-4 border-t border-gray-100">
                      <p className="text-sm text-gray-500">О себе</p>
                      <p className="font-medium">
                        {psychologistProfile.bio || <span className="text-gray-400">Не указано</span>}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100">
                      <div>
                        <p className="text-sm text-gray-500">Рейтинг</p>
                        <div className="flex items-center gap-1">
                          <svg className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                          <span className="font-medium">{psychologistProfile.rating.toFixed(1)}</span>
                        </div>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Консультаций</p>
                        <p className="font-medium">{psychologistProfile.totalConsultations}</p>
                      </div>
                    </div>
                  </div>
                )}
              </CardBody>
            </Card>
          )}

          {/* Subscription Card */}
          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold text-gray-900">Подписка</h2>
            </CardHeader>
            <CardBody>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">Бесплатный план</p>
                  <p className="text-sm text-gray-500">3 бесплатных теста, 1 ребёнок</p>
                </div>
                <Button variant="outline">Улучшить план</Button>
              </div>
            </CardBody>
          </Card>

          {/* Security Card */}
          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold text-gray-900">Безопасность</h2>
            </CardHeader>
            <CardBody>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">Пароль</p>
                    <p className="text-sm text-gray-500">Последнее изменение: никогда</p>
                  </div>
                  <Button variant="ghost">Изменить</Button>
                </div>
                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                  <div>
                    <p className="font-medium text-gray-900">Удалить аккаунт</p>
                    <p className="text-sm text-gray-500">Безвозвратно удалить аккаунт и все данные</p>
                  </div>
                  <Button variant="danger">Удалить</Button>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}
