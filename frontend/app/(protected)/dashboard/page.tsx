'use client';

import { useEffect, useState } from 'react';
import { UserRole } from '@/types/auth';
import ParentDashboard from './components/ParentDashboard';
import PsychologistDashboard from './components/PsychologistDashboard';
import SchoolDashboard from './components/SchoolDashboard';
import AdminDashboard from './components/AdminDashboard';

interface User {
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
}

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        setUser(JSON.parse(userData));
      } catch {
        // Handle error silently - layout will redirect
      }
    }
  }, []);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const userName = `${user.firstName} ${user.lastName}`.trim() || user.email;
  const userRole: UserRole = user.role || 'PARENT';

  switch (userRole) {
    case 'PSYCHOLOGIST':
      return <PsychologistDashboard userName={userName} />;
    case 'SCHOOL':
      return <SchoolDashboard userName={userName} />;
    case 'ADMIN':
      return <AdminDashboard userName={userName} />;
    case 'PARENT':
    default:
      return <ParentDashboard userName={userName} />;
  }
}
