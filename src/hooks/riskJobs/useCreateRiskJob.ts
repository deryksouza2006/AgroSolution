import { useMutation } from '@tanstack/react-query';
import { riskJobService } from '../../services/riskJobService';
import { useRiskJobCache } from './useRiskJobCache';

export function useCreateRiskJob() {
  const sync = useRiskJobCache();
  return useMutation({ mutationFn: riskJobService.create, retry: false, networkMode: 'always', onSuccess: (job, cropAreaId) => {
    if (job.id !== null) return sync(job.id, cropAreaId, job);
  } });
}
