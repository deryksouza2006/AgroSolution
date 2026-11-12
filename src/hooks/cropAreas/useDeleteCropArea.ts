import { useMutation } from '@tanstack/react-query';
import { cropAreaService } from '../../services/cropAreaService';
import { useCropAreaCache } from './useCropAreaCache';

export function useDeleteCropArea() {
  const sync = useCropAreaCache();
  return useMutation({ mutationFn: ({ id }: { id: number; farmId: number }) => cropAreaService.delete(id),
    retry: false, networkMode: 'always',
    onSuccess: (_, { id, farmId }) => sync(id, [farmId], undefined, true) });
}
