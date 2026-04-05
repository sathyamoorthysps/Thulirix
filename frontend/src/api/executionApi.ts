import apiClient from './apiClient';
import type {
  TestPlanResponse,
  TestRunResponse,
  ExecutionResponse,
  ExecutionResult,
} from '@/types';

export const executionApi = {
  // Plans
  createPlan: (projectId: string, data: { name: string; description: string; testCaseIds: string[] }) =>
    apiClient
      .post<TestPlanResponse>(`/projects/${projectId}/test-plans`, data)
      .then((r) => r.data),

  listPlans: (projectId: string) =>
    apiClient
      .get<{ content: TestPlanResponse[] }>(`/projects/${projectId}/test-plans`)
      .then((r) => r.data.content),

  getPlan: (projectId: string, planId: string) =>
    apiClient
      .get<TestPlanResponse>(`/projects/${projectId}/test-plans/${planId}`)
      .then((r) => r.data),

  // Runs
  createRun: (projectId: string, planId: string, data: { name: string }) =>
    apiClient
      .post<TestRunResponse>(`/projects/${projectId}/test-plans/${planId}/runs`, data)
      .then((r) => r.data),

  listRuns: (projectId: string, planId: string) =>
    apiClient
      .get<{ content: TestRunResponse[] }>(`/projects/${projectId}/test-plans/${planId}/runs`)
      .then((r) => r.data.content),

  getRun: (projectId: string, planId: string, runId: string) =>
    apiClient
      .get<TestRunResponse>(`/projects/${projectId}/test-plans/${planId}/runs/${runId}`)
      .then((r) => r.data),

  updatePlan: (projectId: string, planId: string, data: { name: string; description: string; testCaseIds?: string[] }) =>
    apiClient
      .put<TestPlanResponse>(`/projects/${projectId}/test-plans/${planId}`, data)
      .then((r) => r.data),

  updateRun: (projectId: string, planId: string, runId: string, data: { name: string; environment?: string; buildVersion?: string }) =>
    apiClient
      .put<TestRunResponse>(`/projects/${projectId}/test-plans/${planId}/runs/${runId}`, data)
      .then((r) => r.data),

  // Executions
  getExecutions: (projectId: string, planId: string, runId: string) =>
    apiClient
      .get<ExecutionResponse[]>(
        `/projects/${projectId}/test-plans/${planId}/runs/${runId}/executions`,
      )
      .then((r) => r.data),

  updateExecution: (
    projectId: string,
    planId: string,
    runId: string,
    executionId: string,
    data: { result: ExecutionResult; notes?: string },
  ) =>
    apiClient
      .put<ExecutionResponse>(
        `/projects/${projectId}/test-plans/${planId}/runs/${runId}/executions/${executionId}`,
        data,
      )
      .then((r) => r.data),
};
