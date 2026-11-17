import { api } from './base';
import type { AuthUser } from '@/lib/auth';

type AuthResponse = {
  token: string;
  user: AuthUser;
};

export type PublicUser = Pick<
  AuthUser,
  'id' | 'name' | 'college' | 'gradYear' | 'targetRole' | 'bio' | 'avatarUrl' | 'totalPoints' | 'createdAt'
>;

export type UpdateProfileInput = {
  name?: string;
  bio?: string;
  college?: string;
  gradYear?: number | null;
  targetRole?: string;
  avatarUrl?: string;
};

export const authApi = {
  signup: (data: { name: string; email: string; password: string }) =>
    api.post<AuthResponse>('/auth/signup', data),

  login: (data: { email: string; password: string }) =>
    api.post<AuthResponse>('/auth/login', data),

  me: () => api.get<AuthUser>('/auth/me'),
};

export const userApi = {
  updateProfile: (data: UpdateProfileInput) => api.put<AuthUser>('/users/me', data),

  changePassword: (data: { oldPassword: string; newPassword: string }) =>
    api.put<{ message: string }>('/users/me/password', data),

  getUser: (id: string) => api.get<PublicUser>(`/users/${id}`),
};
