'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';

interface SchoolProfile {
  id: string;
  name: string;
  address?: string;
  city?: string;
  region?: string;
  phone?: string;
  studentCount: number;
}

export function useSchool() {
  const [school, setSchool] = useState<SchoolProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const cached = sessionStorage.getItem('schoolProfile');
    if (cached) {
      try {
        setSchool(JSON.parse(cached));
        setLoading(false);
        return;
      } catch {
        // ignore bad cache
      }
    }

    api
      .get('/schools/me')
      .then((res) => {
        const data = res.data;
        setSchool(data);
        sessionStorage.setItem('schoolProfile', JSON.stringify(data));
      })
      .catch((err) => {
        console.error('Failed to fetch school profile:', err);
        setError('Не удалось загрузить профиль школы');
      })
      .finally(() => setLoading(false));
  }, []);

  return { school, loading, error, schoolId: school?.id || '' };
}
