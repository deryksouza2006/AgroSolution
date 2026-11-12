import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../auth/useAuth';
import { farmKeys } from '../farms/farmKeys';
import type { CropArea } from '../../types/cropArea';
import { cropAreaKeys } from './cropAreaKeys';

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
    for (const farmId of new Set([...farmIds, ...(result ? [result.farmId] : [])])) {
      void client.invalidateQueries({ queryKey: farmKeys.detail(farmId) });
    }
  };
}
