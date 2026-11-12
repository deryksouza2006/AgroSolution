import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { farmService } from '../../services/farmService';
import { farmKeys } from './farmKeys';

export function useFarms(page: number, size = 20) {
  return useQuery({
    queryKey: farmKeys.list(page, size),
    queryFn: ({ signal }) => farmService.list(page, size, signal),
    placeholderData: keepPreviousData,
  });
}
