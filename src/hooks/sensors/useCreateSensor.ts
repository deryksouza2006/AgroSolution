import { useMutation } from '@tanstack/react-query';
import { sensorService } from '../../services/sensorService';
import { useSensorCache } from './useSensorCache';

export function useCreateSensor() {
  const sync = useSensorCache();
  return useMutation({ mutationFn: sensorService.create, retry: false, networkMode: 'always', onSuccess: (sensor, input) => sync(sensor.id, [input.cropAreaId], [sensor.farmId], sensor) });
}
