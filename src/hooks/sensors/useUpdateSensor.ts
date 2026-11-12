import { useMutation } from '@tanstack/react-query';
import { sensorService } from '../../services/sensorService';
import type { SensorUpdateRequest } from '../../types/sensor';
import { useSensorCache } from './useSensorCache';

export function useUpdateSensor() {
  const sync = useSensorCache();
  return useMutation({ mutationFn: ({ id, input }: { id: number; input: SensorUpdateRequest; previousCropAreaId: number; previousFarmId: number }) => sensorService.update(id, input),
    retry: false, networkMode: 'always', onSuccess: (sensor, previous) => sync(sensor.id, [previous.previousCropAreaId, sensor.cropAreaId], [previous.previousFarmId, sensor.farmId], sensor) });
}
