export const riskJobKeys = {
  all: ['risk-jobs'] as const,
  lists: () => [...riskJobKeys.all, 'list'] as const,
  list: (cropAreaId: number, page: number, size: number) => [...riskJobKeys.lists(), cropAreaId, page, size] as const,
  detail: (jobId: number) => [...riskJobKeys.all, 'detail', jobId] as const,
};
