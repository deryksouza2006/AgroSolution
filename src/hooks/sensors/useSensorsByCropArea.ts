import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { sensorService } from '../../services/sensorService';
import { sensorKeys } from './sensorKeys';

export function useSensorsByCropArea(cropAreaId: number | undefined, page: number, size = 20) {
  return useQuery({ queryKey: sensorKeys.byCropArea(cropAreaId ?? 0, page, size),
    queryFn: ({ signal }) => sensorService.listByCropArea(cropAreaId ?? 0, page, size, signal),
    placeholderData: keepPreviousData, enabled: cropAreaId !== undefined });
}
