import { useMutation } from '@tanstack/react-query';
import { alertService } from '../../services/alertService';
import type { AlertAction } from '../../types/riskJob';
import { useRiskJobCache } from '../riskJobs/useRiskJobCache';

export function useChangeAlert(action: AlertAction) {
  const sync = useRiskJobCache();
  return useMutation({ mutationFn: ({ jobId }: { jobId: number; cropAreaId: number | null }) => alertService.change(jobId, action),
    retry: false, networkMode: 'always', onSuccess: (_, input) => sync(input.jobId, input.cropAreaId) });
}
