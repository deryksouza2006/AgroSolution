import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../auth/useAuth';
import { farmKeys } from '../farms/farmKeys';
import type { CropArea } from '../../types/cropArea';
import { cropAreaKeys } from './cropAreaKeys';
import { dashboardKeys } from '../dashboard/dashboardKeys';
import { sensorKeys } from '../sensors/sensorKeys';
import { readingKeys } from '../readings/readingKeys';

export function useCropAreaCache() {
  const client = useQueryClient();
  const { session, isSessionCurrent } = useAuth();
  return async (id: number, farmIds: number[], result?: CropArea, remove = false) => {
    if (!isSessionCurrent(session)) return;
    await client.cancelQueries({ queryKey: cropAreaKeys.detail(id) });
    if (!isSessionCurrent(session)) return;
    if (remove) client.removeQueries({ queryKey: cropAreaKeys.detail(id), exact: true });
    else if (result) client.setQueryData(cropAreaKeys.detail(id), result);
    else void client.invalidateQueries({ queryKey: cropAreaKeys.detail(id) });
    void client.invalidateQueries({ queryKey: cropAreaKeys.lists() });
    void client.invalidateQueries({ queryKey: farmKeys.lists() });
    void client.invalidateQueries({ queryKey: sensorKeys.all });
    void client.invalidateQueries({ queryKey: readingKeys.all });
    void client.invalidateQueries({ queryKey: dashboardKeys.all });
    for (const farmId of new Set([...farmIds, ...(result ? [result.farmId] : [])])) {
      void client.invalidateQueries({ queryKey: farmKeys.detail(farmId) });
    }
  };
}
