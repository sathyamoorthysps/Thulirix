import apiClient from './apiClient';
import type { DashboardResponse } from '@/types';

export const dashboardApi = {
  getDashboard: (projectId: string) =>
    apiClient.get<DashboardResponse>(`/projects/${projectId}/dashboard`).then((r) => r.data),
};
