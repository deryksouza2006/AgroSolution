export const guidanceKeys = {
  mutation: (jobId: number) => ['guidance-request', jobId] as const,
  // Screen-only memory, separate from the authoritative RiskJob query cache.
  local: (jobId: number) => ['guidance-local', jobId] as const,
};
