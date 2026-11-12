import type { ActivityFilters } from '../../types/activity';

export const activityKeys = {
  all: ['activities'] as const,
  cropArea: (cropAreaId: number) => [...activityKeys.all, cropAreaId] as const,
  lists: (cropAreaId: number) => [...activityKeys.cropArea(cropAreaId), 'list'] as const,
  list: (cropAreaId: number, page: number, size: number, filters: ActivityFilters) => [
    ...activityKeys.lists(cropAreaId), page, size, filters.type ?? '', filters.from ?? '', filters.to ?? '',
  ] as const,
  detail: (cropAreaId: number, id: number) => [...activityKeys.cropArea(cropAreaId), 'detail', id] as const,
};
