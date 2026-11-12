import { useMutation } from '@tanstack/react-query';
import { sensorService } from '../../services/sensorService';
import { useSensorCache } from './useSensorCache';

export function useDeleteSensor() {
  const sync = useSensorCache();
  return useMutation({ mutationFn: ({ id }: { id: number; cropAreaId: number; farmId: number }) => sensorService.delete(id),
    retry: false, networkMode: 'always', onSuccess: (_, sensor) => sync(sensor.id, [sensor.cropAreaId], [sensor.farmId], undefined, true) });
}
