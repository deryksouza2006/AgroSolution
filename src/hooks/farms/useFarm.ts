import { useQuery } from '@tanstack/react-query';
import { farmService } from '../../services/farmService';
import { farmKeys } from './farmKeys';

export function useFarm(id: number | undefined, enabled = true) {
  return useQuery({
    queryKey: farmKeys.detail(id ?? 0),
    queryFn: ({ signal }) => farmService.get(id ?? 0, signal),
    enabled: id !== undefined && enabled,
  });
}
