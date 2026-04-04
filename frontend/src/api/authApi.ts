import apiClient from './apiClient';
import type { LoginRequest, AuthResponse, UserResponse } from '@/types';

export const authApi = {
  login: (data: LoginRequest) =>
    apiClient.post<AuthResponse>('/auth/login', data).then((r) => r.data),

  register: (data: { firstName: string; lastName: string; email: string; password: string }) =>
    apiClient.post<AuthResponse>('/auth/register', data).then((r) => r.data),

  refresh: (refreshToken: string) =>
    apiClient.post<AuthResponse>('/auth/refresh', { refreshToken }).then((r) => r.data),

  me: () => apiClient.get<UserResponse>('/auth/me').then((r) => r.data),
};
