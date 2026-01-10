import { UserRole } from '@/types/auth';

export interface NavItem {
  name: string;
  href: string;
  icon: string;
}

export const navigationByRole: Record<UserRole, NavItem[]> = {
  PARENT: [
    { name: 'Главная', href: '/dashboard', icon: 'home' },
    { name: 'Мои дети', href: '/children', icon: 'users' },
    { name: 'Тесты', href: '/tests', icon: 'clipboard' },
    { name: 'Результаты', href: '/results', icon: 'chart' },
    { name: 'Консультации', href: '/consultations', icon: 'video' },
  ],
  PSYCHOLOGIST: [
    { name: 'Главная', href: '/dashboard', icon: 'home' },
    { name: 'Расписание', href: '/schedule', icon: 'calendar' },
    { name: 'Клиенты', href: '/clients', icon: 'users' },
    { name: 'Консультации', href: '/consultations', icon: 'video' },
    { name: 'Доход', href: '/earnings', icon: 'wallet' },
  ],
  SCHOOL: [
    { name: 'Главная', href: '/dashboard', icon: 'home' },
    { name: 'Классы', href: '/classes', icon: 'building' },
    { name: 'Ученики', href: '/students', icon: 'users' },
    { name: 'Тестирование', href: '/testing', icon: 'clipboard' },
    { name: 'Отчёты', href: '/reports', icon: 'document' },
  ],
  ADMIN: [
    { name: 'Dashboard', href: '/dashboard', icon: 'home' },
    { name: 'Пользователи', href: '/admin/users', icon: 'users' },
    { name: 'Психологи', href: '/admin/psychologists', icon: 'video' },
    { name: 'Тесты', href: '/admin/tests', icon: 'clipboard' },
    { name: 'Платежи', href: '/admin/payments', icon: 'wallet' },
    { name: 'Аналитика', href: '/admin/analytics', icon: 'chart' },
    { name: 'Настройки', href: '/admin/settings', icon: 'cog' },
  ],
};

export const roleLabels: Record<UserRole, string> = {
  PARENT: 'Родитель',
  PSYCHOLOGIST: 'Психолог',
  SCHOOL: 'Школа',
  ADMIN: 'Администратор',
};

export const roleColors: Record<UserRole, string> = {
  PARENT: 'bg-blue-100 text-blue-800',
  PSYCHOLOGIST: 'bg-purple-100 text-purple-800',
  SCHOOL: 'bg-green-100 text-green-800',
  ADMIN: 'bg-red-100 text-red-800',
};
