import apiClient from './apiClient';
import type { ProjectResponse, CreateProjectRequest, PageResponse } from '@/types';

export const projectApi = {
  list: (page = 0, size = 50) =>
    apiClient
      .get<PageResponse<ProjectResponse>>('/projects', { params: { page, size } })
      .then((r) => r.data),

  get: (id: string) =>
    apiClient.get<ProjectResponse>(`/projects/${id}`).then((r) => r.data),

  create: (data: CreateProjectRequest) =>
    apiClient.post<ProjectResponse>('/projects', data).then((r) => r.data),

  update: (id: string, data: Partial<CreateProjectRequest>) =>
    apiClient.put<ProjectResponse>(`/projects/${id}`, data).then((r) => r.data),

  archive: (id: string) =>
    apiClient.patch<void>(`/projects/${id}/archive`).then((r) => r.data),
};
