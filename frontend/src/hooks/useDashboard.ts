import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from '@/api/dashboardApi';

export function useDashboard(projectId: string | undefined) {
  return useQuery({
    queryKey: ['dashboard', projectId],
    queryFn: () => dashboardApi.getDashboard(projectId!),
    enabled: !!projectId,
    refetchInterval: 60_000,
  });
}
