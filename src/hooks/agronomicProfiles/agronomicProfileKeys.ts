export const agronomicProfileKeys = {
  all: ['agronomic-profiles'] as const,
  latest: (cropAreaId: number) => [...agronomicProfileKeys.all, cropAreaId, 'latest'] as const,
};
