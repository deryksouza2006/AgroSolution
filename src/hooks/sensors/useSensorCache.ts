import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../auth/useAuth';
import { cropAreaKeys } from '../cropAreas/cropAreaKeys';
import { farmKeys } from '../farms/farmKeys';
import type { Sensor } from '../../types/sensor';
import { sensorKeys } from './sensorKeys';

export function useSensorCache() {
  const client = useQueryClient();
  const { session, isSessionCurrent } = useAuth();
  return async (id: number, cropAreaIds: number[], farmIds: number[], result?: Sensor, remove = false) => {
    if (!isSessionCurrent(session)) return;
    await Promise.all([client.cancelQueries({ queryKey: sensorKeys.detail(id) }), client.cancelQueries({ queryKey: sensorKeys.health(id) })]);
    if (!isSessionCurrent(session)) return;
    if (remove) {
      client.removeQueries({ queryKey: sensorKeys.detail(id), exact: true });
      client.removeQueries({ queryKey: sensorKeys.health(id), exact: true });
    } else {
      if (result) client.setQueryData(sensorKeys.detail(id), result);
      void client.invalidateQueries({ queryKey: sensorKeys.health(id) });
    }
    void client.invalidateQueries({ queryKey: sensorKeys.lists() });
    void client.invalidateQueries({ queryKey: cropAreaKeys.lists() });
    void client.invalidateQueries({ queryKey: farmKeys.lists() });
    for (const cropAreaId of new Set([...cropAreaIds, ...(result ? [result.cropAreaId] : [])])) void client.invalidateQueries({ queryKey: cropAreaKeys.detail(cropAreaId) });
    for (const farmId of new Set([...farmIds, ...(result ? [result.farmId] : [])])) void client.invalidateQueries({ queryKey: farmKeys.detail(farmId) });
  };
}
