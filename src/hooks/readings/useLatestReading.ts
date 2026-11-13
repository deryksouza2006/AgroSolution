import { useQuery } from '@tanstack/react-query';
import { readingService } from '../../services/readingService';
import { readingKeys } from './readingKeys';

export function useLatestReading(cropAreaId: number, enabled = true) {
  return useQuery({ queryKey: readingKeys.latest(cropAreaId), queryFn: ({ signal }) => readingService.latest(cropAreaId, signal), enabled });
}
