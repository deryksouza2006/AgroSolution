import { useQuery } from '@tanstack/react-query';
import { dashboardService } from '../../services/dashboardService';
import { dashboardKeys } from './dashboardKeys';

export function useDashboard(enabled = true) {
  return useQuery({ queryKey: dashboardKeys.all, queryFn: ({ signal }) => dashboardService.get(signal), enabled,
    staleTime: 0, refetchInterval: false });
}
