import { useMutation } from '@tanstack/react-query';
import { activityService } from '../../services/activityService';
import type { ActivityRequest } from '../../types/activity';
import { useActivityCache } from './useActivityCache';

export function useUpdateActivity(cropAreaId: number) {
  const cache = useActivityCache(cropAreaId);
  return useMutation({ mutationFn: ({ id, input }: { id: number; input: ActivityRequest }) => activityService.update(cropAreaId, id, input),
    retry: false, networkMode: 'always', onSuccess: activity => cache.sync(activity.id, activity), onError: cache.onError });
}
