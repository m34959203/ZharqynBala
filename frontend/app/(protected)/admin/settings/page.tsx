'use client';

import { useState } from 'react';
import Link from 'next/link';
import { adminApi } from '@/lib/api';

export default function AdminSettingsPage() {
  const [activeTab, setActiveTab] = useState<'general' | 'payments' | 'notifications' | 'security'>('general');

  // General settings
  const [siteName, setSiteName] = useState('ZharqynBala');
  const [siteDescription, setSiteDescription] = useState('Платформа детской психологической диагностики');
  const [supportEmail, setSupportEmail] = useState('support@zharqynbala.kz');
  const [maintenanceMode, setMaintenanceMode] = useState(false);

  // Payment settings
  const [platformFee, setPlatformFee] = useState(15);
  const [minWithdrawal, setMinWithdrawal] = useState(5000);
  const [subscriptionPrice, setSubscriptionPrice] = useState(5000);
  const [consultationPrice, setConsultationPrice] = useState(15000);

  // Notification settings
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [smsNotifications, setSmsNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [marketingEmails, setMarketingEmails] = useState(false);

  // Security settings
  const [twoFactorRequired, setTwoFactorRequired] = useState(false);
  const [sessionTimeout, setSessionTimeout] = useState(30);
  const [maxLoginAttempts, setMaxLoginAttempts] = useState(5);

  // Demo cleanup
  const [cleaningDemo, setCleaningDemo] = useState(false);

  const handleSave = () => {
    alert('Настройки сохранены!');
  };

  const handleCleanupDemo = async () => {
    if (!confirm('Вы уверены? Это удалит все демо тесты, демо пользователя и демо ребёнка. Действие необратимо!')) {
      return;
    }
    setCleaningDemo(true);
    try {
      const result = await adminApi.cleanupDemoData();
      alert(`Успешно удалено:\n- Тестов: ${result.deleted.tests}\n- Вопросов: ${result.deleted.questions}\n- Сессий: ${result.deleted.sessions}\n- Пользователей: ${result.deleted.users}`);
    } catch (error) {
      console.error('Failed to cleanup demo data:', error);
      alert('Ошибка при удалении демо данных');
    } finally {
      setCleaningDemo(false);
    }
  };

  const tabs = [
    { id: 'general', label: 'Общие', icon: '⚙️' },
    { id: 'payments', label: 'Платежи', icon: '💳' },
    { id: 'notifications', label: 'Уведомления', icon: '🔔' },
    { id: 'security', label: 'Безопасность', icon: '🔒' },
  ] as const;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <Link href="/dashboard" className="text-indigo-600 hover:text-indigo-500 text-sm font-medium flex items-center mb-4">
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Назад к дашборду
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">Настройки системы</h1>
        <p className="mt-2 text-gray-600">Управление параметрами платформы</p>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-xl mb-8">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex items-center justify-center px-4 py-3 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab.id
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <span className="mr-2">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* General Settings */}
      {activeTab === 'general' && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Общие настройки</h2>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Название сайта</label>
              <input
                type="text"
                value={siteName}
                onChange={(e) => setSiteName(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Описание</label>
              <textarea
                value={siteDescription}
                onChange={(e) => setSiteDescription(e.target.value)}
                rows={3}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email поддержки</label>
              <input
                type="email"
                value={supportEmail}
                onChange={(e) => setSupportEmail(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg border border-yellow-200">
              <div>
                <p className="font-medium text-gray-900">Режим обслуживания</p>
                <p className="text-sm text-gray-500">Отключить доступ к сайту для всех кроме админов</p>
              </div>
              <button
                onClick={() => setMaintenanceMode(!maintenanceMode)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  maintenanceMode ? 'bg-yellow-500' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    maintenanceMode ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payment Settings */}
      {activeTab === 'payments' && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Настройки платежей</h2>

          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Комиссия платформы (%)</label>
                <input
                  type="number"
                  value={platformFee}
                  onChange={(e) => setPlatformFee(Number(e.target.value))}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Мин. сумма вывода (₸)</label>
                <input
                  type="number"
                  value={minWithdrawal}
                  onChange={(e) => setMinWithdrawal(Number(e.target.value))}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Цена подписки (₸/мес)</label>
                <input
                  type="number"
                  value={subscriptionPrice}
                  onChange={(e) => setSubscriptionPrice(Number(e.target.value))}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Цена консультации (₸)</label>
                <input
                  type="number"
                  value={consultationPrice}
                  onChange={(e) => setConsultationPrice(Number(e.target.value))}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="p-4 bg-gray-50 rounded-lg">
              <h3 className="font-medium text-gray-900 mb-3">Способы оплаты</h3>
              <div className="flex flex-wrap gap-3">
                <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                  Kaspi Pay ✓
                </span>
                <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                  Банковские карты ✓
                </span>
                <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                  Банковский перевод ✓
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Notification Settings */}
      {activeTab === 'notifications' && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Настройки уведомлений</h2>

          <div className="space-y-4">
            {[
              { label: 'Email уведомления', desc: 'Отправлять уведомления на email', value: emailNotifications, setter: setEmailNotifications },
              { label: 'SMS уведомления', desc: 'Отправлять SMS уведомления', value: smsNotifications, setter: setSmsNotifications },
              { label: 'Push уведомления', desc: 'Отправлять push в браузер', value: pushNotifications, setter: setPushNotifications },
              { label: 'Маркетинговые рассылки', desc: 'Рассылка акций и новостей', value: marketingEmails, setter: setMarketingEmails },
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">{item.label}</p>
                  <p className="text-sm text-gray-500">{item.desc}</p>
                </div>
                <button
                  onClick={() => item.setter(!item.value)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    item.value ? 'bg-indigo-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      item.value ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Security Settings */}
      {activeTab === 'security' && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Настройки безопасности</h2>

          <div className="space-y-6">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium text-gray-900">Обязательная 2FA</p>
                <p className="text-sm text-gray-500">Требовать двухфакторную аутентификацию для всех</p>
              </div>
              <button
                onClick={() => setTwoFactorRequired(!twoFactorRequired)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  twoFactorRequired ? 'bg-indigo-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    twoFactorRequired ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Таймаут сессии (минуты)</label>
              <input
                type="number"
                value={sessionTimeout}
                onChange={(e) => setSessionTimeout(Number(e.target.value))}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Макс. попыток входа</label>
              <input
                type="number"
                value={maxLoginAttempts}
                onChange={(e) => setMaxLoginAttempts(Number(e.target.value))}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
              <p className="text-xs text-gray-500 mt-1">После этого аккаунт будет заблокирован</p>
            </div>

            <div className="p-4 bg-red-50 rounded-lg border border-red-200">
              <h3 className="font-medium text-red-800 mb-2">Опасная зона</h3>
              <p className="text-sm text-red-600 mb-3">Эти действия необратимы</p>
              <div className="flex flex-wrap gap-3">
                <button className="px-4 py-2 bg-red-100 text-red-700 text-sm font-medium rounded-lg hover:bg-red-200">
                  Очистить кэш
                </button>
                <button className="px-4 py-2 bg-red-100 text-red-700 text-sm font-medium rounded-lg hover:bg-red-200">
                  Сбросить сессии
                </button>
                <button
                  onClick={handleCleanupDemo}
                  disabled={cleaningDemo}
                  className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 disabled:opacity-50"
                >
                  {cleaningDemo ? 'Удаление...' : 'Удалить демо данные'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Save Button */}
      <div className="mt-8 flex justify-end">
        <button
          onClick={handleSave}
          className="px-8 py-3 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700"
        >
          Сохранить настройки
        </button>
      </div>
    </div>
  );
}
