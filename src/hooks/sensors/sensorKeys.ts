export const sensorKeys = {
  all: ['sensors'] as const,
  lists: () => [...sensorKeys.all, 'list'] as const,
  list: (page: number, size: number) => [...sensorKeys.lists(), 'all', page, size] as const,
  byCropArea: (cropAreaId: number, page: number, size: number) => [...sensorKeys.lists(), 'crop-area', cropAreaId, page, size] as const,
  detail: (id: number) => [...sensorKeys.all, 'detail', id] as const,
  health: (id: number) => [...sensorKeys.all, 'health', id] as const,
};
