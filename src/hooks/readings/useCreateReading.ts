import { useMutation } from '@tanstack/react-query';
import { readingService } from '../../services/readingService';
import { useReadingCache } from './useReadingCache';

export function useCreateReading() {
  const sync = useReadingCache();
  return useMutation({ mutationFn: readingService.create, retry: false, networkMode: 'always', onSuccess: reading => sync(reading, reading) });
}
