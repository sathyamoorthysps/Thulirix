import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { testCaseApi, type TestCaseListParams } from '@/api/testCaseApi';
import type { CreateTestCaseRequest } from '@/types';

export function useTestCases(projectId: string | undefined, params: TestCaseListParams = {}) {
  return useQuery({
    queryKey: ['testCases', projectId, params],
    queryFn: () => testCaseApi.list(projectId!, params),
    enabled: !!projectId,
  });
}

export function useTestCase(projectId: string | undefined, id: string | undefined) {
  return useQuery({
    queryKey: ['testCase', projectId, id],
    queryFn: () => testCaseApi.get(projectId!, id!),
    enabled: !!projectId && !!id,
  });
}

export function useCreateTestCase(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateTestCaseRequest) => testCaseApi.create(projectId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['testCases', projectId] });
      toast.success('Test case created');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to create test case');
    },
  });
}

export function useUpdateTestCase(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateTestCaseRequest> }) =>
      testCaseApi.update(projectId, id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['testCases', projectId] });
      qc.invalidateQueries({ queryKey: ['testCase', projectId] });
      toast.success('Test case updated');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to update test case');
    },
  });
}

export function useDeleteTestCase(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => testCaseApi.remove(projectId, id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['testCases', projectId] });
      toast.success('Test case deleted');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to delete test case');
    },
  });
}
