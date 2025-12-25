'use client';

import { useSession } from 'next-auth/react';
import { UserRole } from '@/types/auth';
import ParentDashboard from './components/ParentDashboard';
import PsychologistDashboard from './components/PsychologistDashboard';
import SchoolDashboard from './components/SchoolDashboard';
import AdminDashboard from './components/AdminDashboard';

export default function DashboardPage() {
  const { data: session } = useSession();

  // Get user info
  const userName = session?.user?.name || session?.user?.email || 'Пользователь';
  const userRole: UserRole = (session?.user?.role as UserRole) || 'PARENT';

  // Render role-specific dashboard
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
