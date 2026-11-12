import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { cropAreaService } from '../../services/cropAreaService';
import { cropAreaKeys } from './cropAreaKeys';

export function useCropAreasByFarm(farmId: number | undefined, page: number, size = 20) {
  return useQuery({ queryKey: cropAreaKeys.byFarm(farmId ?? 0, page, size),
    queryFn: ({ signal }) => cropAreaService.listByFarm(farmId ?? 0, page, size, signal),
    placeholderData: keepPreviousData, enabled: farmId !== undefined });
}
