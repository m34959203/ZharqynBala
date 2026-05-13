import axios from 'axios';
import type { AuthResponse, LoginRequest, RegisterRequest, User } from '@/types/auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// SEC-CRIT-001: токены живут в HttpOnly cookies, выставленных бэкендом.
// `withCredentials: true` → axios автоматически прицепит cookie к каждому
// запросу, нам не нужно ни Cookies.get/set, ни Authorization header.
// JS этих токенов не видит — XSS перестаёт эскалировать в кражу сессии.
const api = axios.create({
  baseURL: `${API_URL}/api/v1`,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// На 401 пробуем один разворот через /auth/refresh. Refresh token лежит
// в HttpOnly cookie, передаётся сам; тело запроса пустое.
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const isRefreshCall = typeof originalRequest?.url === 'string'
      && originalRequest.url.includes('/auth/refresh');

    if (error.response?.status === 401 && !originalRequest._retry && !isRefreshCall) {
      originalRequest._retry = true;
      try {
        await axios.post(
          `${API_URL}/api/v1/auth/refresh`,
          {},
          { withCredentials: true },
        );
        return api(originalRequest);
      } catch (refreshError) {
        if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
          window.location.href = '/login';
        }
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// ──────────────────────────────────────────────────
// Admin overview DTO (mirror backend AdminOverviewDto)
// ──────────────────────────────────────────────────

export interface ParentOverviewDto {
  parent: { id: string; firstName: string; lastName: string };
  children: Array<{
    id: string; firstName: string; lastName: string;
    ageYears: number; gradeLevel: number | null;
    joinedAt: string; progressPct: number; testsInProgress: number;
    testsInProgressList: Array<{
      sessionId: string; testId: string; testName: string; startedAt: string;
    }>;
    avatarTone: string;
  }>;
  totals: {
    childrenCount: number; testsPassed: number; testsPassedDeltaMonth: number;
    avgScore: number | null; avgScoreDeltaMonth: number | null;
    consultationsTotal: number; consultationsThisMonth: number;
  };
  recentResults: Array<{
    id: string; testName: string; category: string; completedAt: string;
    scorePct: number; riskZone: 'GREEN' | 'YELLOW' | 'RED';
    childName: string; childId: string;
  }>;
  attentionZone: Array<{
    resultId: string; testName: string; shortLabel: string;
    scorePct: number; riskZone: 'YELLOW' | 'RED';
    childId: string; childName: string;
  }>;
  aiRecommendation: {
    testId: string; testName: string; heading: string; reason: string;
    childId: string; childName: string;
    source: 'rule_v1' | 'llm_v1'; generatedAt: string;
  } | null;
  upcomingConsultation: {
    id: string; startsAt: string;
    psychologist: { id: string; fullName: string; avatarUrl: string | null };
    topic: string;
  } | null;
}

export interface PsychologistInModerationDto {
  id: string;
  fullName: string;
  initials: string;
  tone: string;
  experienceYears: number;
  education: string;
  appliedAt: string;
}

export interface TopTestDto {
  rank: number;
  name: string;
  author: string;
  count: number;
  max: number;
}

export interface RegionStatDto {
  name: string;
  count: number;
  percent: number;
}

export interface RevenueTimeseriesPoint {
  label: string;
  value: number;
  current: boolean;
}
export interface RevenueTimeseriesDto {
  range: 'week' | 'month' | 'year';
  unit: 'KZT';
  max: number;
  data: RevenueTimeseriesPoint[];
}

export const parentsApi = {
  getOverview: async (): Promise<ParentOverviewDto> => {
    const response = await api.get<ParentOverviewDto>('/parents/me/overview');
    return response.data;
  },
};

export interface AdminOverviewDto {
  users: { total: number; parents: number; psychologists: number; schools: number; admins: number; deltaWeek: number };
  children: { total: number; perParent: number | null; deltaWeek: number };
  psychologists: { approved: number; pending: number; rejected: number; deltaWeek: number };
  tests: { passed: number; premiumShare: number; deltaWeek: number };
  revenue: { monthAmountKzt: number; commissionKzt: number; deltaMomPct: number };
  conversion: { diagnosticToConsultPct: number; deltaPp: number; target: number; previousMonthPct: number };
  health: { servicesOnline: number; servicesTotal: number; lastIncidentAt: string | null };
}

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

  getOverview: async (): Promise<AdminOverviewDto> => {
    const response = await api.get<AdminOverviewDto>('/admin/stats/overview');
    return response.data;
  },

  getRevenueTimeseries: async (range: 'week' | 'month' | 'year'): Promise<RevenueTimeseriesDto> => {
    const response = await api.get<RevenueTimeseriesDto>('/admin/stats/revenue-timeseries', { params: { range } });
    return response.data;
  },

  getModerationQueue: async (limit = 5): Promise<PsychologistInModerationDto[]> => {
    const response = await api.get<PsychologistInModerationDto[]>('/admin/moderation/queue', { params: { limit } });
    return response.data;
  },

  getTopTests: async (period: 'current' | 'previous' | 'all' = 'current', limit = 5): Promise<TopTestDto[]> => {
    const response = await api.get<TopTestDto[]>('/admin/stats/top-tests', { params: { period, limit } });
    return response.data;
  },

  getRegions: async (): Promise<RegionStatDto[]> => {
    const response = await api.get<RegionStatDto[]>('/admin/stats/regions');
    return response.data;
  },

  getPaymentTotals: async (): Promise<{
    lifetimeRevenue: number; lifetimeCount: number;
    monthRevenue: number; pendingAmount: number; failedCount: number;
  }> => {
    const response = await api.get('/admin/payments/totals');
    return response.data;
  },

  getNotifications: async (limit = 5): Promise<Array<{
    id: string;
    type: 'payment' | 'user' | 'psychologist' | 'consultation';
    icon: string;
    tone: 'ok' | 'warn' | 'brand' | 'risk';
    title: string; meta: string; at: string;
  }>> => {
    const response = await api.get('/admin/notifications/recent', { params: { limit } });
    return response.data;
  },

  getSlaHealth: async (): Promise<Array<{
    id: 'payments' | 'consultations' | 'support';
    tone: 'ok' | 'warn' | 'risk';
    title: string; sub: string; cta?: string;
  }>> => {
    const response = await api.get('/admin/health/sla');
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

// Auth API. SEC-CRIT-001: токены ставит сервер через Set-Cookie с HttpOnly;
// клиент не трогает Cookies.set / localStorage — JS этих токенов не видит.
export const authApi = {
  login: async (data: LoginRequest): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/login', data);
    return response.data;
  },

  register: async (data: RegisterRequest): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/register', data);
    return response.data;
  },

  logout: async (): Promise<void> => {
    try {
      await api.post('/auth/logout');
    } finally {
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
