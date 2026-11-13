import { keepPreviousData, useQuery } from '@tanstack/react-query';
import type { ReadingScope } from '../../types/reading';
import { readingService } from '../../services/readingService';
import { readingKeys } from './readingKeys';

export function useReadings(scope: ReadingScope, page: number, size = 20) {
  return useQuery({ queryKey: readingKeys.list(scope, page, size), queryFn: ({ signal }) => readingService.list(scope, page, size, signal), placeholderData: keepPreviousData });
}
