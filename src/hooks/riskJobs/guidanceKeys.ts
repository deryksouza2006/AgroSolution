export const guidanceKeys = {
  mutation: (jobId: number) => ['guidance-request', jobId] as const,
  local: (jobId: number) => ['guidance-local', jobId] as const,
};
