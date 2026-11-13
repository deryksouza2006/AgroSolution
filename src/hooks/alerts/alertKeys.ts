export const alertKeys = {
  all: ['alerts'] as const,
  lists: () => [...alertKeys.all, 'list'] as const,
  list: (cropAreaId: number | undefined, page: number, size: number) => [...alertKeys.lists(), cropAreaId ?? 'all', page, size] as const,
  detail: (jobId: number) => [...alertKeys.all, 'detail', jobId] as const,
};
