import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { cropAreaService } from '../../services/cropAreaService';
import { cropAreaKeys } from './cropAreaKeys';

export function useCropAreas(page: number, size = 20, enabled = true) {
  return useQuery({ queryKey: cropAreaKeys.list(page, size),
    queryFn: ({ signal }) => cropAreaService.list(page, size, signal),
    placeholderData: keepPreviousData, enabled });
}
