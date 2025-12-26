'use client';

import { useState } from 'react';
import Link from 'next/link';

interface TimeSlot {
  id: string;
  time: string;
  isAvailable: boolean;
  clientName?: string;
}

interface DaySchedule {
  date: string;
  dayName: string;
  slots: TimeSlot[];
}

export default function SchedulePage() {
  const [currentWeek, setCurrentWeek] = useState(0);

  // Генерируем расписание на неделю
  const generateWeekSchedule = (): DaySchedule[] => {
    const days = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'];
    const today = new Date();
    today.setDate(today.getDate() + currentWeek * 7);

    return days.map((dayName, index) => {
      const date = new Date(today);
      date.setDate(today.getDate() - today.getDay() + index + 1);

      const slots: TimeSlot[] = [];
      for (let hour = 9; hour <= 18; hour++) {
        const isBooked = Math.random() > 0.7;
        slots.push({
          id: `${date.toISOString()}-${hour}`,
          time: `${hour}:00`,
          isAvailable: !isBooked,
          clientName: isBooked ? ['Асем Н.', 'Марат С.', 'Динара Ж.'][Math.floor(Math.random() * 3)] : undefined,
        });
      }

      return {
        date: date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' }),
        dayName,
        slots,
      };
    });
  };

  const weekSchedule = generateWeekSchedule();

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

      {/* Legend */}
      <div className="flex items-center space-x-6 mb-6">
        <div className="flex items-center">
          <div className="w-4 h-4 bg-green-100 border border-green-300 rounded mr-2"></div>
          <span className="text-sm text-gray-600">Свободно</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 bg-indigo-100 border border-indigo-300 rounded mr-2"></div>
          <span className="text-sm text-gray-600">Забронировано</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 bg-gray-100 border border-gray-300 rounded mr-2"></div>
          <span className="text-sm text-gray-600">Недоступно</span>
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
                    className={`p-2 border-l text-center cursor-pointer transition-colors ${
                      slot.isAvailable
                        ? 'bg-green-50 hover:bg-green-100'
                        : 'bg-indigo-50'
                    }`}
                  >
                    {slot.clientName ? (
                      <span className="text-xs font-medium text-indigo-600">{slot.clientName}</span>
                    ) : (
                      <span className="text-xs text-green-600">Свободно</span>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
        <button className="flex items-center justify-center p-4 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700">
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Добавить рабочие часы
        </button>
        <button className="flex items-center justify-center p-4 border border-gray-300 rounded-xl hover:bg-gray-50">
          <svg className="w-5 h-5 mr-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          Заблокировать день
        </button>
        <Link href="/dashboard" className="flex items-center justify-center p-4 border border-gray-300 rounded-xl hover:bg-gray-50">
          <svg className="w-5 h-5 mr-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Назад к дашборду
        </Link>
      </div>
    </div>
  );
}
