import { useQuery } from '@tanstack/react-query';
import { cropAreaService } from '../../services/cropAreaService';
import { cropAreaKeys } from './cropAreaKeys';

export function useCropArea(id: number | undefined, enabled = true) {
  return useQuery({ queryKey: cropAreaKeys.detail(id ?? 0),
    queryFn: ({ signal }) => cropAreaService.get(id ?? 0, signal), enabled: id !== undefined && enabled });
}
