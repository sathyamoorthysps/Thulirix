import apiClient from './apiClient';
import type {
  TestCaseSummaryResponse,
  TestCaseResponse,
  CreateTestCaseRequest,
  PageResponse,
  StepAttachmentResponse,
} from '@/types';

export interface TestCaseListParams {
  page?: number;
  size?: number;
  search?: string;
  status?: string;
  priority?: string;
  automationStatus?: string;
  sort?: string;
}

export const testCaseApi = {
  list: (projectId: string, params: TestCaseListParams = {}) =>
    apiClient
      .get<PageResponse<TestCaseSummaryResponse>>(`/projects/${projectId}/test-cases`, { params })
      .then((r) => r.data),

  get: (projectId: string, id: string) =>
    apiClient
      .get<TestCaseResponse>(`/projects/${projectId}/test-cases/${id}`)
      .then((r) => r.data),

  create: (projectId: string, data: CreateTestCaseRequest) =>
    apiClient
      .post<TestCaseResponse>(`/projects/${projectId}/test-cases`, data)
      .then((r) => r.data),

  update: (projectId: string, id: string, data: Partial<CreateTestCaseRequest>) =>
    apiClient
      .put<TestCaseResponse>(`/projects/${projectId}/test-cases/${id}`, data)
      .then((r) => r.data),

  remove: (projectId: string, id: string) =>
    apiClient.delete<void>(`/projects/${projectId}/test-cases/${id}`).then((r) => r.data),

  archive: (projectId: string, id: string) =>
    apiClient
      .patch<void>(`/projects/${projectId}/test-cases/${id}/archive`)
      .then((r) => r.data),

  getVersions: (projectId: string, id: string) =>
    apiClient
      .get<TestCaseResponse[]>(`/projects/${projectId}/test-cases/${id}/versions`)
      .then((r) => r.data),

  restoreVersion: (projectId: string, id: string, version: number) =>
    apiClient
      .post<TestCaseResponse>(`/projects/${projectId}/test-cases/${id}/versions/${version}/restore`)
      .then((r) => r.data),
};

export const stepAttachmentApi = {
  list: (stepId: string) =>
    apiClient.get<StepAttachmentResponse[]>(`/steps/${stepId}/attachments`).then((r) => r.data),

  upload: (stepId: string, file: File) => {
    const form = new FormData();
    form.append('file', file);
    return apiClient
      .post<StepAttachmentResponse>(`/steps/${stepId}/attachments`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((r) => r.data);
  },

  delete: (attachmentId: string) =>
    apiClient.delete<void>(`/attachments/${attachmentId}`).then((r) => r.data),

  downloadUrl: (attachmentId: string) =>
    `/api/v1/attachments/${attachmentId}/file`,
};
