import { useQuery } from '@tanstack/react-query';
import { activityService } from '../../services/activityService';
import { activityKeys } from './activityKeys';

export function useActivity(cropAreaId: number, activityId: number | undefined, enabled = true) {
  return useQuery({ queryKey: activityKeys.detail(cropAreaId, activityId ?? 0),
    queryFn: ({ signal }) => activityService.get(cropAreaId, activityId ?? 0, signal), enabled: activityId !== undefined && enabled });
}
