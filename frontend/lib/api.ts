import axios from 'axios';
import type { AuthResponse, LoginRequest, RegisterRequest, User } from '@/types/auth';
import Cookies from 'js-cookie';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// Создаем axios instance с базовой конфигурацией
const api = axios.create({
  baseURL: `${API_URL}/api/v1`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Добавляем interceptor для добавления токена в каждый запрос
api.interceptors.request.use(
  (config) => {
    const token = Cookies.get('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Добавляем interceptor для обработки ошибок авторизации
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Если получили 401 и еще не пытались обновить токен
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = Cookies.get('refreshToken');
        if (refreshToken) {
          const response = await axios.post<AuthResponse>(
            `${API_URL}/api/v1/auth/refresh`,
            { refreshToken }
          );

          const { accessToken } = response.data;
          Cookies.set('accessToken', accessToken);

          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        // Если refresh token не валиден, очищаем cookies и редиректим на логин
        Cookies.remove('accessToken');
        Cookies.remove('refreshToken');
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// Test types
export interface TestData {
  id: string;
  titleRu: string;
  titleKz: string;
  descriptionRu: string;
  descriptionKz: string;
  category: string;
  ageMin: number;
  ageMax: number;
  durationMinutes: number;
  price: number;
  isPremium: boolean;
  isActive: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
  _count: {
    questions: number;
    sessions: number;
  };
}

export interface CreateTestData {
  titleRu: string;
  titleKz: string;
  descriptionRu: string;
  descriptionKz: string;
  category: string;
  ageMin: number;
  ageMax: number;
  durationMinutes: number;
  price?: number;
  isPremium?: boolean;
  isActive?: boolean;
  order?: number;
}

export interface UpdateTestData extends Partial<CreateTestData> {}

// Admin API
export const adminApi = {
  // Tests
  getTests: async (): Promise<TestData[]> => {
    const response = await api.get<TestData[]>('/admin/tests');
    return response.data;
  },

  getTestById: async (id: string): Promise<TestData> => {
    const response = await api.get<TestData>(`/admin/tests/${id}`);
    return response.data;
  },

  createTest: async (data: CreateTestData): Promise<TestData> => {
    const response = await api.post<TestData>('/admin/tests', data);
    return response.data;
  },

  updateTest: async (id: string, data: UpdateTestData): Promise<TestData> => {
    const response = await api.patch<TestData>(`/admin/tests/${id}`, data);
    return response.data;
  },

  deleteTest: async (id: string, force: boolean = false): Promise<void> => {
    await api.delete(`/admin/tests/${id}${force ? '?force=true' : ''}`);
  },

  toggleTest: async (id: string): Promise<TestData> => {
    const response = await api.post<TestData>(`/admin/tests/${id}/toggle`);
    return response.data;
  },

  // Dashboard
  getDashboardStats: async () => {
    const response = await api.get('/admin/dashboard');
    return response.data;
  },

  // Users
  getUsers: async (params?: { role?: string; search?: string; page?: number; limit?: number }) => {
    const response = await api.get('/admin/users', { params });
    return response.data;
  },

  updateUser: async (id: string, data: { firstName?: string; lastName?: string; role?: string; isActive?: boolean }) => {
    const response = await api.patch(`/admin/users/${id}`, data);
    return response.data;
  },

  deleteUser: async (id: string) => {
    const response = await api.delete(`/admin/users/${id}`);
    return response.data;
  },

  banUser: async (id: string) => {
    const response = await api.post(`/admin/users/${id}/ban`);
    return response.data;
  },

  unbanUser: async (id: string) => {
    const response = await api.post(`/admin/users/${id}/unban`);
    return response.data;
  },

  // Payments
  getPayments: async (params?: { status?: string; from?: string; to?: string; page?: number }) => {
    const response = await api.get('/admin/payments', { params });
    return response.data;
  },

  // Demo data cleanup
  cleanupDemoData: async (): Promise<{ success: boolean; message: string; deleted: Record<string, number> }> => {
    const response = await api.delete('/admin/cleanup-demo');
    return response.data;
  },

  // Psychologists management
  getPsychologists: async () => {
    const response = await api.get('/admin/psychologists');
    return response.data;
  },

  approvePsychologist: async (id: string) => {
    const response = await api.post(`/admin/psychologists/${id}/verify`);
    return response.data;
  },
};

// Auth API
export const authApi = {
  login: async (data: LoginRequest): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/login', data);
    // Сохраняем токены в cookies
    Cookies.set('accessToken', response.data.accessToken, { expires: 1 }); // 1 день
    Cookies.set('refreshToken', response.data.refreshToken, { expires: 7 }); // 7 дней
    return response.data;
  },

  register: async (data: RegisterRequest): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/register', data);
    // Сохраняем токены в cookies
    Cookies.set('accessToken', response.data.accessToken, { expires: 1 });
    Cookies.set('refreshToken', response.data.refreshToken, { expires: 7 });
    return response.data;
  },

  logout: async (): Promise<void> => {
    try {
      await api.post('/auth/logout');
    } finally {
      Cookies.remove('accessToken');
      Cookies.remove('refreshToken');
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }
  },

  getMe: async (): Promise<User> => {
    const response = await api.get<User>('/auth/me');
    return response.data;
  },
};

export default api;
