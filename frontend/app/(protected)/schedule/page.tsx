'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';

interface TimeSlot {
  id: string;
  time: string;
  hour: number;
  dateObj: Date;
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

export default function SchedulePage() {
  const [currentWeek, setCurrentWeek] = useState(0);
  const [workingHours, setWorkingHours] = useState<{ [key: string]: boolean }>({});

  // Текущая дата и время для проверки прошедших слотов
  const now = useMemo(() => new Date(), []);

  // Проверка, прошло ли время слота
  const isSlotPast = (slotDate: Date, hour: number): boolean => {
    const slotDateTime = new Date(slotDate);
    slotDateTime.setHours(hour, 0, 0, 0);
    return slotDateTime < now;
  };

  // Генерируем расписание на неделю
  const generateWeekSchedule = (): DaySchedule[] => {
    const days = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'];
    const today = new Date();
    today.setDate(today.getDate() + currentWeek * 7);

    return days.map((dayName, index) => {
      const date = new Date(today);
      date.setDate(today.getDate() - today.getDay() + index + 1);
      date.setHours(0, 0, 0, 0);

      const slots: TimeSlot[] = [];
      for (let hour = 9; hour <= 18; hour++) {
        const slotKey = `${date.toISOString().split('T')[0]}-${hour}`;
        const isPast = isSlotPast(date, hour);
        slots.push({
          id: slotKey,
          time: `${hour}:00`,
          hour,
          dateObj: new Date(date),
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
  };

  const toggleWorkingHour = (slot: TimeSlot) => {
    // Не позволяем изменять прошедшие слоты
    if (slot.isPast) return;

    setWorkingHours(prev => ({
      ...prev,
      [slot.id]: !prev[slot.id]
    }));
  };

  const weekSchedule = generateWeekSchedule();

  // Отметить рабочую неделю (только будущие слоты)
  const markWorkWeek = () => {
    const newWorkingHours: { [key: string]: boolean } = {};
    weekSchedule.forEach((day, dayIndex) => {
      if (dayIndex < 5) { // Пн-Пт
        day.slots.forEach(slot => {
          if (!slot.isPast) {
            newWorkingHours[slot.id] = true;
          }
        });
      }
    });
    setWorkingHours(prev => ({ ...prev, ...newWorkingHours }));
  };

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

      {/* Info Banner */}
      <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
        <div className="flex items-start">
          <svg className="w-5 h-5 text-blue-600 mt-0.5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <h3 className="text-sm font-medium text-blue-800">Настройте ваше расписание</h3>
            <p className="mt-1 text-sm text-blue-700">
              Нажмите на ячейку, чтобы отметить рабочие часы. Клиенты смогут записываться только на отмеченное время.
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
      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
        <button
          onClick={markWorkWeek}
          className="flex items-center justify-center p-4 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Отметить рабочую неделю (Пн-Пт)
        </button>
        <Link href="/dashboard" className="flex items-center justify-center p-4 border border-gray-300 rounded-xl hover:bg-gray-50">
          <svg className="w-5 h-5 mr-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Назад к дашборду
        </Link>
      </div>

      {/* Coming Soon Notice */}
      <div className="mt-8 p-6 bg-amber-50 border border-amber-200 rounded-xl">
        <div className="flex items-center">
          <svg className="w-6 h-6 text-amber-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <div>
            <h3 className="font-medium text-amber-800">Функция в разработке</h3>
            <p className="text-sm text-amber-700 mt-1">
              Полная интеграция расписания с записью клиентов будет доступна в ближайшее время.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
