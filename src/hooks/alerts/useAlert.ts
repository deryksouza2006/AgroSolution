import { useQuery } from '@tanstack/react-query';
import { alertService } from '../../services/alertService';
import { alertKeys } from './alertKeys';

export function useAlert(jobId: number) {
  return useQuery({ queryKey: alertKeys.detail(jobId), queryFn: ({ signal }) => alertService.get(jobId, signal) });
}
