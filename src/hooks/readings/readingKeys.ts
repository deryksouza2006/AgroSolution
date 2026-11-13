import type { ReadingScope } from '../../types/reading';

export const readingKeys = {
  all: ['readings'] as const,
  lists: () => [...readingKeys.all, 'list'] as const,
  scope: (scope: ReadingScope) => scope.kind === 'sensor' ? ['sensor', scope.sensorId] as const
    : scope.kind === 'cropArea' ? ['crop-area', scope.cropAreaId] as const : ['all'] as const,
  list: (scope: ReadingScope, page: number, size: number) => [...readingKeys.lists(), ...readingKeys.scope(scope), page, size] as const,
  detail: (id: number) => [...readingKeys.all, 'detail', id] as const,
  latest: (cropAreaId: number) => [...readingKeys.all, 'latest', cropAreaId] as const,
};
