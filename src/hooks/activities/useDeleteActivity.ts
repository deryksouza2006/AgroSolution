import { useMutation } from '@tanstack/react-query';
import { activityService } from '../../services/activityService';
import { useActivityCache } from './useActivityCache';

export function useDeleteActivity(cropAreaId: number) {
  const cache = useActivityCache(cropAreaId);
  return useMutation({ mutationFn: (id: number) => activityService.delete(cropAreaId, id),
    retry: false, networkMode: 'always', onSuccess: (_, id) => cache.sync(id, undefined, true), onError: cache.onError });
}
