export interface User {
  id: string;
  email: string;
  phone?: string | null;
  firstName: string;
  lastName: string;
  role: 'PARENT' | 'PSYCHOLOGIST' | 'SCHOOL' | 'ADMIN';
  language: 'RU' | 'KZ';
  isVerified: boolean;
  isActive: boolean;
  avatarUrl?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export type UserRole = 'PARENT' | 'PSYCHOLOGIST' | 'SCHOOL' | 'ADMIN';

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role?: UserRole;
  language?: 'RU' | 'KZ';
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}
