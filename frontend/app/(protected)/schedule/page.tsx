'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import Link from 'next/link';

interface TimeSlot {
  id: string;
  time: string;
  hour: number;
  dateObj: Date;
  dateStr: string;
  isAvailable: boolean;
  isWorkingHour: boolean;
  isPast: boolean;
}

interface DaySchedule {
  date: string;
  dayName: string;
  dateObj: Date;
  slots: TimeSlot[];
}

interface SavedSlot {
  date: string;
  hour: number;
  isAvailable: boolean;
}

export default function SchedulePage() {
  const [currentWeek, setCurrentWeek] = useState(0);
  const [workingHours, setWorkingHours] = useState<{ [key: string]: boolean }>({});
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [hasChanges, setHasChanges] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Текущая дата и время для проверки прошедших слотов
  const now = useMemo(() => new Date(), []);

  // Проверка, прошло ли время слота
  const isSlotPast = useCallback((slotDate: Date, hour: number): boolean => {
    const slotDateTime = new Date(slotDate);
    slotDateTime.setHours(hour, 0, 0, 0);
    return slotDateTime < now;
  }, [now]);

  // Генерируем расписание на неделю
  const generateWeekSchedule = useCallback((): DaySchedule[] => {
    const days = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'];
    const today = new Date();
    today.setDate(today.getDate() + currentWeek * 7);

    return days.map((dayName, index) => {
      const date = new Date(today);
      date.setDate(today.getDate() - today.getDay() + index + 1);
      date.setHours(0, 0, 0, 0);

      const dateStr = date.toISOString().split('T')[0];

      const slots: TimeSlot[] = [];
      for (let hour = 9; hour <= 18; hour++) {
        const slotKey = `${dateStr}-${hour}`;
        const isPast = isSlotPast(date, hour);
        slots.push({
          id: slotKey,
          time: `${hour}:00`,
          hour,
          dateObj: new Date(date),
          dateStr,
          isAvailable: !isPast,
          isWorkingHour: workingHours[slotKey] || false,
          isPast,
        });
      }

      return {
        date: date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' }),
        dayName,
        dateObj: date,
        slots,
      };
    });
  }, [currentWeek, workingHours, isSlotPast]);

  const weekSchedule = generateWeekSchedule();

  // Получаем даты текущей недели для запроса к API
  const getWeekDates = useCallback(() => {
    const schedule = generateWeekSchedule();
    const startDate = schedule[0].slots[0].dateStr;
    const endDate = schedule[schedule.length - 1].slots[0].dateStr;
    return { startDate, endDate };
  }, [generateWeekSchedule]);

  // Загрузка расписания с сервера (через локальный API route)
  const loadSchedule = useCallback(async () => {
    try {
      const { startDate, endDate } = getWeekDates();

      const response = await fetch(
        `/api/schedule?startDate=${startDate}&endDate=${endDate}`,
        { credentials: 'include' }
      );

      if (response.status === 401) {
        // Не авторизован - это нормально, просто показываем пустое расписание
        setLoading(false);
        return;
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Ошибка загрузки расписания');
      }

      const slots: SavedSlot[] = await response.json();

      // Преобразуем слоты в формат workingHours
      const newWorkingHours: { [key: string]: boolean } = {};
      slots.forEach((slot) => {
        const key = `${slot.date}-${slot.hour}`;
        newWorkingHours[key] = slot.isAvailable;
      });

      setWorkingHours((prev) => ({ ...prev, ...newWorkingHours }));
      setError(null);
    } catch (err) {
      console.error('Failed to load schedule:', err);
      setError('Не удалось загрузить расписание');
    } finally {
      setLoading(false);
    }
  }, [getWeekDates]);

  // Загружаем расписание при изменении недели
  useEffect(() => {
    loadSchedule();
  }, [currentWeek, loadSchedule]);

  const toggleWorkingHour = (slot: TimeSlot) => {
    // Не позволяем изменять прошедшие слоты
    if (slot.isPast) return;

    setWorkingHours((prev) => ({
      ...prev,
      [slot.id]: !prev[slot.id],
    }));
    setHasChanges(true);
    setSaveStatus('idle');
  };

  // Отметить рабочую неделю (только будущие слоты Пн-Пт)
  const markWorkWeek = () => {
    const newWorkingHours: { [key: string]: boolean } = {};
    weekSchedule.forEach((day, dayIndex) => {
      if (dayIndex < 5) {
        // Пн-Пт (индексы 0-4)
        day.slots.forEach((slot) => {
          if (!slot.isPast) {
            newWorkingHours[slot.id] = true;
          }
        });
      }
    });
    setWorkingHours((prev) => ({ ...prev, ...newWorkingHours }));
    setHasChanges(true);
    setSaveStatus('idle');
  };

  // Сохранить расписание на сервер (через локальный API route)
  const saveSchedule = async () => {
    setSaveStatus('saving');

    try {
      // Собираем все слоты текущей недели
      const slots: SavedSlot[] = [];
      weekSchedule.forEach((day) => {
        day.slots.forEach((slot) => {
          if (!slot.isPast) {
            slots.push({
              date: slot.dateStr,
              hour: slot.hour,
              isAvailable: slot.isWorkingHour,
            });
          }
        });
      });

      const response = await fetch('/api/schedule', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ slots }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Ошибка сохранения');
      }

      setSaveStatus('saved');
      setHasChanges(false);
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (err) {
      console.error('Failed to save schedule:', err);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  };

  // Очистить расписание текущей недели
  const clearWeekSchedule = () => {
    const clearedHours = { ...workingHours };
    weekSchedule.forEach((day) => {
      day.slots.forEach((slot) => {
        delete clearedHours[slot.id];
      });
    });
    setWorkingHours(clearedHours);
    setHasChanges(true);
    setSaveStatus('idle');
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          <span className="ml-3 text-gray-600">Загрузка расписания...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Расписание</h1>
          <p className="mt-2 text-gray-600">Управляйте своим графиком консультаций</p>
        </div>
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setCurrentWeek(currentWeek - 1)}
            className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={() => setCurrentWeek(0)}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            Сегодня
          </button>
          <button
            onClick={() => setCurrentWeek(currentWeek + 1)}
            className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-red-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-sm text-red-800">{error}</span>
          </div>
        </div>
      )}

      {/* Info Banner */}
      <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
        <div className="flex items-start">
          <svg className="w-5 h-5 text-blue-600 mt-0.5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <h3 className="text-sm font-medium text-blue-800">Настройте ваше расписание</h3>
            <p className="mt-1 text-sm text-blue-700">
              Нажмите на ячейку, чтобы отметить рабочие часы. Не забудьте сохранить изменения.
              Прошедшие даты и время недоступны для редактирования.
            </p>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center flex-wrap gap-4 mb-6">
        <div className="flex items-center">
          <div className="w-4 h-4 bg-green-100 border border-green-300 rounded mr-2"></div>
          <span className="text-sm text-gray-600">Рабочие часы</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 bg-gray-100 border border-gray-300 rounded mr-2"></div>
          <span className="text-sm text-gray-600">Нерабочее время</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 bg-gray-200 border border-gray-400 rounded mr-2 relative">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-full h-0.5 bg-gray-400 transform -rotate-45"></div>
            </div>
          </div>
          <span className="text-sm text-gray-600">Прошедшее время</span>
        </div>
      </div>

      {/* Schedule Grid */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="grid grid-cols-7 border-b">
          <div className="p-4 bg-gray-50 font-medium text-gray-500 text-sm">Время</div>
          {weekSchedule.map((day) => (
            <div key={day.date} className="p-4 bg-gray-50 text-center border-l">
              <div className="font-medium text-gray-900">{day.dayName}</div>
              <div className="text-sm text-gray-500">{day.date}</div>
            </div>
          ))}
        </div>

        <div className="divide-y">
          {weekSchedule[0].slots.map((_, slotIndex) => (
            <div key={slotIndex} className="grid grid-cols-7">
              <div className="p-3 text-sm font-medium text-gray-600 bg-gray-50">
                {weekSchedule[0].slots[slotIndex].time}
              </div>
              {weekSchedule.map((day) => {
                const slot = day.slots[slotIndex];
                return (
                  <div
                    key={`${day.date}-${slot.time}`}
                    onClick={() => toggleWorkingHour(slot)}
                    className={`p-2 border-l text-center transition-colors ${
                      slot.isPast
                        ? 'bg-gray-200 cursor-not-allowed'
                        : slot.isWorkingHour
                          ? 'bg-green-50 hover:bg-green-100 cursor-pointer'
                          : 'bg-gray-50 hover:bg-gray-100 cursor-pointer'
                    }`}
                  >
                    {slot.isPast ? (
                      <span className="text-xs text-gray-400 line-through">—</span>
                    ) : slot.isWorkingHour ? (
                      <span className="text-xs text-green-600">Свободно</span>
                    ) : (
                      <span className="text-xs text-gray-400">—</span>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-4">
        <button
          onClick={saveSchedule}
          disabled={saveStatus === 'saving'}
          className={`flex items-center justify-center p-4 rounded-xl font-medium transition-colors ${
            saveStatus === 'saved'
              ? 'bg-green-600 text-white'
              : saveStatus === 'error'
                ? 'bg-red-600 text-white'
                : hasChanges
                  ? 'bg-green-600 text-white hover:bg-green-700'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          {saveStatus === 'saving' ? (
            <>
              <svg className="animate-spin w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Сохранение...
            </>
          ) : saveStatus === 'saved' ? (
            <>
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Сохранено!
            </>
          ) : saveStatus === 'error' ? (
            <>
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Ошибка
            </>
          ) : (
            <>
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
              </svg>
              Сохранить
            </>
          )}
        </button>

        <button
          onClick={markWorkWeek}
          className="flex items-center justify-center p-4 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Пн-Пт
        </button>

        <button
          onClick={clearWeekSchedule}
          className="flex items-center justify-center p-4 border border-gray-300 rounded-xl hover:bg-gray-50 text-gray-700"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          Очистить
        </button>

        <Link href="/dashboard" className="flex items-center justify-center p-4 border border-gray-300 rounded-xl hover:bg-gray-50">
          <svg className="w-5 h-5 mr-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Назад
        </Link>
      </div>

      {/* Unsaved Changes Warning */}
      {hasChanges && (
        <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-yellow-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span className="text-sm text-yellow-800">У вас есть несохраненные изменения</span>
          </div>
        </div>
      )}
    </div>
  );
}
