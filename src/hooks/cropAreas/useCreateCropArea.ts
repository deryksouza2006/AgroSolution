import { useMutation } from '@tanstack/react-query';
import { cropAreaService } from '../../services/cropAreaService';
import { useCropAreaCache } from './useCropAreaCache';

export function useCreateCropArea() {
  const sync = useCropAreaCache();
  return useMutation({ mutationFn: cropAreaService.create, retry: false, networkMode: 'always',
    onSuccess: (area, input) => sync(area.id, [input.farmId], area) });
}
