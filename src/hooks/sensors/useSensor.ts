import { useQuery } from '@tanstack/react-query';
import { sensorService } from '../../services/sensorService';
import { sensorKeys } from './sensorKeys';

export function useSensor(id: number | undefined, enabled = true) {
  return useQuery({ queryKey: sensorKeys.detail(id ?? 0), queryFn: ({ signal }) => sensorService.get(id ?? 0, signal), enabled: id !== undefined && enabled });
}
