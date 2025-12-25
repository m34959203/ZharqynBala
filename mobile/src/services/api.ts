import axios, { AxiosError, AxiosInstance } from 'axios';
import * as SecureStore from 'expo-secure-store';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'https://api.zharqynbala.kz';

class ApiService {
  private client: AxiosInstance;
  private refreshPromise: Promise<string> | null = null;

  constructor() {
    this.client = axios.create({
      baseURL: API_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor
    this.client.interceptors.request.use(
      async (config) => {
        const token = await SecureStore.getItemAsync('accessToken');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error),
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config as any;

        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            const newToken = await this.refreshToken();
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            return this.client(originalRequest);
          } catch (refreshError) {
            await this.logout();
            throw refreshError;
          }
        }

        throw error;
      },
    );
  }

  private async refreshToken(): Promise<string> {
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    this.refreshPromise = (async () => {
      const refreshToken = await SecureStore.getItemAsync('refreshToken');
      if (!refreshToken) {
        throw new Error('No refresh token');
      }

      const response = await axios.post(`${API_URL}/auth/refresh`, {
        refreshToken,
      });

      const { accessToken, refreshToken: newRefreshToken } = response.data;

      await SecureStore.setItemAsync('accessToken', accessToken);
      await SecureStore.setItemAsync('refreshToken', newRefreshToken);

      return accessToken;
    })().finally(() => {
      this.refreshPromise = null;
    });

    return this.refreshPromise;
  }

  async logout() {
    await SecureStore.deleteItemAsync('accessToken');
    await SecureStore.deleteItemAsync('refreshToken');
  }

  // Auth
  async login(email: string, password: string) {
    const response = await this.client.post('/auth/login', { email, password });
    const { accessToken, refreshToken, user } = response.data;

    await SecureStore.setItemAsync('accessToken', accessToken);
    await SecureStore.setItemAsync('refreshToken', refreshToken);

    return user;
  }

  async register(data: { email: string; password: string; name: string; phone?: string }) {
    const response = await this.client.post('/auth/register', data);
    const { accessToken, refreshToken, user } = response.data;

    await SecureStore.setItemAsync('accessToken', accessToken);
    await SecureStore.setItemAsync('refreshToken', refreshToken);

    return user;
  }

  async getMe() {
    const response = await this.client.get('/auth/me');
    return response.data;
  }

  // Children
  async getChildren() {
    const response = await this.client.get('/children');
    return response.data;
  }

  async createChild(data: { name: string; birthDate: string; gender: string }) {
    const response = await this.client.post('/children', data);
    return response.data;
  }

  async updateChild(id: string, data: Partial<{ name: string; birthDate: string; gender: string }>) {
    const response = await this.client.patch(`/children/${id}`, data);
    return response.data;
  }

  async deleteChild(id: string) {
    await this.client.delete(`/children/${id}`);
  }

  // Tests
  async getTests(params?: { category?: string; page?: number; limit?: number }) {
    const response = await this.client.get('/tests', { params });
    return response.data;
  }

  async getTest(id: string) {
    const response = await this.client.get(`/tests/${id}`);
    return response.data;
  }

  async startTest(testId: string, childId: string) {
    const response = await this.client.post(`/tests/${testId}/start`, { childId });
    return response.data;
  }

  async submitAnswer(sessionId: string, questionId: string, answerId: string) {
    const response = await this.client.post(`/tests/sessions/${sessionId}/answer`, {
      questionId,
      answerId,
    });
    return response.data;
  }

  async completeTest(sessionId: string) {
    const response = await this.client.post(`/tests/sessions/${sessionId}/complete`);
    return response.data;
  }

  // Results
  async getResults(params?: { childId?: string; page?: number; limit?: number }) {
    const response = await this.client.get('/results', { params });
    return response.data;
  }

  async getResult(id: string) {
    const response = await this.client.get(`/results/${id}`);
    return response.data;
  }

  // Consultations
  async getConsultations() {
    const response = await this.client.get('/consultations');
    return response.data;
  }

  async getPsychologists() {
    const response = await this.client.get('/consultations/psychologists');
    return response.data;
  }

  async bookConsultation(data: {
    psychologistId: string;
    childId: string;
    scheduledAt: string;
  }) {
    const response = await this.client.post('/consultations', data);
    return response.data;
  }

  async cancelConsultation(id: string) {
    const response = await this.client.patch(`/consultations/${id}/cancel`);
    return response.data;
  }

  // Payments
  async createPayment(subscriptionType: 'MONTHLY' | 'YEARLY') {
    const response = await this.client.post('/payments', { subscriptionType });
    return response.data;
  }

  async getPaymentStatus(paymentId: string) {
    const response = await this.client.get(`/payments/${paymentId}/status`);
    return response.data;
  }

  // Profile
  async updateProfile(data: Partial<{ name: string; phone: string }>) {
    const response = await this.client.patch('/users/profile', data);
    return response.data;
  }

  async changePassword(currentPassword: string, newPassword: string) {
    await this.client.post('/auth/change-password', {
      currentPassword,
      newPassword,
    });
  }

  // Notifications
  async registerPushToken(token: string) {
    await this.client.post('/notifications/push/register', { token });
  }

  async unregisterPushToken(token: string) {
    await this.client.post('/notifications/push/unregister', { token });
  }
}

export const api = new ApiService();
