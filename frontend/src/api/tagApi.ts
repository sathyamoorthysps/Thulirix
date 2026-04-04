import apiClient from './apiClient';
import type { TagResponse, CreateTagRequest } from '@/types';

export const tagApi = {
  list: (projectId: string) =>
    apiClient.get<TagResponse[]>(`/projects/${projectId}/tags`).then((r) => r.data),

  create: (projectId: string, data: CreateTagRequest) =>
    apiClient.post<TagResponse>(`/projects/${projectId}/tags`, data).then((r) => r.data),

  update: (projectId: string, id: string, data: Partial<CreateTagRequest>) =>
    apiClient.put<TagResponse>(`/projects/${projectId}/tags/${id}`, data).then((r) => r.data),

  remove: (projectId: string, id: string) =>
    apiClient.delete<void>(`/projects/${projectId}/tags/${id}`).then((r) => r.data),
};
