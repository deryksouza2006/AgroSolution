import { useQuery } from '@tanstack/react-query';
import { sensorService } from '../../services/sensorService';
import { sensorKeys } from './sensorKeys';

export function useSensorHealth(id: number, enabled: boolean) {
  return useQuery({ queryKey: sensorKeys.health(id), queryFn: ({ signal }) => sensorService.health(id, signal), enabled });
}
