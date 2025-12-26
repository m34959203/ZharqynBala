'use client';

import { useState } from 'react';
import Link from 'next/link';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'PARENT' | 'PSYCHOLOGIST' | 'SCHOOL' | 'ADMIN';
  status: 'ACTIVE' | 'INACTIVE' | 'BANNED';
  createdAt: string;
  lastLogin?: string;
}

const mockUsers: User[] = [
  { id: '1', name: 'Асем Нурпеисова', email: 'asem@mail.kz', role: 'PARENT', status: 'ACTIVE', createdAt: '2025-12-25', lastLogin: '2025-12-26' },
  { id: '2', name: 'Марат Сагынбаев', email: 'marat@mail.kz', role: 'PARENT', status: 'ACTIVE', createdAt: '2025-12-24', lastLogin: '2025-12-25' },
  { id: '3', name: 'СШ №45 г. Алматы', email: 'school45@edu.kz', role: 'SCHOOL', status: 'ACTIVE', createdAt: '2025-12-20', lastLogin: '2025-12-26' },
  { id: '4', name: 'Др. Айгуль Касымова', email: 'aigul@psych.kz', role: 'PSYCHOLOGIST', status: 'ACTIVE', createdAt: '2025-12-15', lastLogin: '2025-12-26' },
  { id: '5', name: 'Динара Жумабаева', email: 'dinara@mail.kz', role: 'PARENT', status: 'INACTIVE', createdAt: '2025-11-10' },
  { id: '6', name: 'Бауыржан Ахметов', email: 'baurz@mail.kz', role: 'PARENT', status: 'BANNED', createdAt: '2025-10-05' },
  { id: '7', name: 'Гимназия №56', email: 'gym56@edu.kz', role: 'SCHOOL', status: 'ACTIVE', createdAt: '2025-12-01', lastLogin: '2025-12-24' },
  { id: '8', name: 'Др. Мадина Сериккызы', email: 'madina@psych.kz', role: 'PSYCHOLOGIST', status: 'ACTIVE', createdAt: '2025-11-20', lastLogin: '2025-12-25' },
];

export default function AdminUsersPage() {
  const [users] = useState<User[]>(mockUsers);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
    return matchesSearch && matchesRole && matchesStatus;
  });

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'PARENT': return 'Родитель';
      case 'PSYCHOLOGIST': return 'Психолог';
      case 'SCHOOL': return 'Школа';
      case 'ADMIN': return 'Админ';
      default: return role;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'PARENT': return 'bg-blue-100 text-blue-800';
      case 'PSYCHOLOGIST': return 'bg-purple-100 text-purple-800';
      case 'SCHOOL': return 'bg-green-100 text-green-800';
      case 'ADMIN': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-green-100 text-green-800';
      case 'INACTIVE': return 'bg-yellow-100 text-yellow-800';
      case 'BANNED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'Активен';
      case 'INACTIVE': return 'Неактивен';
      case 'BANNED': return 'Заблокирован';
      default: return status;
    }
  };

  const stats = {
    total: users.length,
    active: users.filter(u => u.status === 'ACTIVE').length,
    parents: users.filter(u => u.role === 'PARENT').length,
    psychologists: users.filter(u => u.role === 'PSYCHOLOGIST').length,
    schools: users.filter(u => u.role === 'SCHOOL').length,
  };

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
            <h1 className="text-3xl font-bold text-gray-900">Пользователи</h1>
            <p className="mt-2 text-gray-600">Управление пользователями платформы</p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-6 py-3 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 flex items-center"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Добавить пользователя
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        <div className="bg-white rounded-xl shadow-sm p-4">
          <p className="text-sm text-gray-500">Всего</p>
          <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <p className="text-sm text-gray-500">Активных</p>
          <p className="text-2xl font-bold text-green-600">{stats.active}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <p className="text-sm text-gray-500">Родителей</p>
          <p className="text-2xl font-bold text-blue-600">{stats.parents}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <p className="text-sm text-gray-500">Психологов</p>
          <p className="text-2xl font-bold text-purple-600">{stats.psychologists}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <p className="text-sm text-gray-500">Школ</p>
          <p className="text-2xl font-bold text-green-600">{stats.schools}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Поиск по имени или email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">Все роли</option>
            <option value="PARENT">Родители</option>
            <option value="PSYCHOLOGIST">Психологи</option>
            <option value="SCHOOL">Школы</option>
            <option value="ADMIN">Администраторы</option>
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">Все статусы</option>
            <option value="ACTIVE">Активные</option>
            <option value="INACTIVE">Неактивные</option>
            <option value="BANNED">Заблокированные</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Пользователь</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Роль</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Статус</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Регистрация</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Последний вход</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Действия</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                        {user.name[0]}
                      </div>
                      <div className="ml-3">
                        <p className="font-medium text-gray-900">{user.name}</p>
                        <p className="text-sm text-gray-500">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getRoleColor(user.role)}`}>
                      {getRoleLabel(user.role)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(user.status)}`}>
                      {getStatusLabel(user.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {new Date(user.createdAt).toLocaleDateString('ru-RU')}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString('ru-RU') : '—'}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                      <button className="p-2 text-gray-400 hover:text-indigo-600" title="Редактировать">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button className="p-2 text-gray-400 hover:text-red-600" title="Заблокировать">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredUsers.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">Пользователи не найдены</p>
          </div>
        )}
      </div>
    </div>
  );
}
