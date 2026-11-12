import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { activityService } from '../../services/activityService';
import type { ActivityFilters } from '../../types/activity';
import { activityKeys } from './activityKeys';

export function useActivities(cropAreaId: number, page: number, filters: ActivityFilters, size = 20) {
  return useQuery({ queryKey: activityKeys.list(cropAreaId, page, size, filters),
    queryFn: ({ signal }) => activityService.list(cropAreaId, page, size, filters, signal), placeholderData: keepPreviousData });
}
