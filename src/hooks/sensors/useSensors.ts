import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { sensorService } from '../../services/sensorService';
import { sensorKeys } from './sensorKeys';

export function useSensors(page: number, size = 20, enabled = true) {
  return useQuery({ queryKey: sensorKeys.list(page, size), queryFn: ({ signal }) => sensorService.list(page, size, signal), placeholderData: keepPreviousData, enabled });
}
