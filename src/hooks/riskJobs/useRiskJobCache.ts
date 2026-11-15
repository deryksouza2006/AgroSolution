import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../auth/useAuth';
import { alertKeys } from '../alerts/alertKeys';
import { cropAreaKeys } from '../cropAreas/cropAreaKeys';
import { dashboardKeys } from '../dashboard/dashboardKeys';
import type { RiskJob } from '../../types/riskJob';
import { riskJobKeys } from './riskJobKeys';

export function useRiskJobCache() {
  const client = useQueryClient();
  const { session, isSessionCurrent } = useAuth();
  return async (jobId: number, cropAreaId: number | null | undefined, created?: RiskJob) => {
    if (!isSessionCurrent(session)) return;
    await Promise.all([client.cancelQueries({ queryKey: riskJobKeys.detail(jobId), exact: true }), client.cancelQueries({ queryKey: alertKeys.detail(jobId), exact: true })]);
    if (!isSessionCurrent(session)) return;
    if (created) client.setQueryData(riskJobKeys.detail(jobId), created);
    else void client.invalidateQueries({ queryKey: riskJobKeys.detail(jobId), exact: true, refetchType: 'none' });
    void client.invalidateQueries({ queryKey: riskJobKeys.lists() });
    void client.invalidateQueries({ queryKey: alertKeys.lists() });
    void client.invalidateQueries({ queryKey: dashboardKeys.all });
    void client.invalidateQueries({ queryKey: cropAreaKeys.lists() });
    if (cropAreaId) void client.invalidateQueries({ queryKey: cropAreaKeys.detail(cropAreaId) });
    else void client.invalidateQueries({ queryKey: cropAreaKeys.all });
    await client.invalidateQueries({ queryKey: alertKeys.detail(jobId), exact: true });
    if (!created && isSessionCurrent(session)) {
      const state = client.getQueryState<RiskJob>(alertKeys.detail(jobId));
      if (state?.status === 'success' && !state.isInvalidated && state.data) {
        client.setQueryData(riskJobKeys.detail(jobId), state.data);
      }
    }
  };
}
