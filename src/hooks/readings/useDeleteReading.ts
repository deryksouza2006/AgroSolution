import { useMutation } from '@tanstack/react-query';
import type { Reading } from '../../types/reading';
import { readingService } from '../../services/readingService';
import { useReadingCache } from './useReadingCache';

export function useDeleteReading() {
  const sync = useReadingCache();
  return useMutation({ mutationFn: (reading: Pick<Reading, 'id' | 'sensorId' | 'cropAreaId'>) => readingService.delete(reading.id),
    retry: false, networkMode: 'always', onSuccess: (_, reading) => sync(reading) });
}
