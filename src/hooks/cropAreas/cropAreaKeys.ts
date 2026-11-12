export const cropAreaKeys = {
  all: ['crop-areas'] as const,
  lists: () => [...cropAreaKeys.all, 'list'] as const,
  list: (page: number, size: number) => [...cropAreaKeys.lists(), 'all', page, size] as const,
  byFarm: (farmId: number, page: number, size: number) => [...cropAreaKeys.lists(), 'farm', farmId, page, size] as const,
  detail: (id: number) => [...cropAreaKeys.all, 'detail', id] as const,
};
