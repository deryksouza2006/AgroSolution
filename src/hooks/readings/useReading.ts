import { useQuery } from '@tanstack/react-query';
import { readingService } from '../../services/readingService';
import { readingKeys } from './readingKeys';

export function useReading(id: number, enabled = true) {
  return useQuery({ queryKey: readingKeys.detail(id), queryFn: ({ signal }) => readingService.get(id, signal), enabled });
}
