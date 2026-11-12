import { useMutation } from '@tanstack/react-query';
import { cropAreaService } from '../../services/cropAreaService';
import { useCropAreaCache } from './useCropAreaCache';

export function useArchiveCropArea() {
  const sync = useCropAreaCache();
  return useMutation({ mutationFn: ({ id, archived }: { id: number; farmId: number; archived: boolean }) => cropAreaService.archive(id, archived),
    retry: false, networkMode: 'always',
    onSuccess: (area, { id, farmId }) => sync(id, [farmId], area) });
}
