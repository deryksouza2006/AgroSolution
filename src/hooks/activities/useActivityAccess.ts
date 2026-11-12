import { useCropArea } from '../cropAreas/useCropArea';

export function useActivityAccess(cropAreaId: number) {
  const query = useCropArea(cropAreaId);
  const archived = query.data?.status === 'ARCHIVED';
  return { query, archived, canWrite: Boolean(query.data) && !archived && !query.isFetching && !query.isError };
}
