import { useMutation } from '@tanstack/react-query';
import { cropAreaService } from '../../services/cropAreaService';
import type { CropAreaRequest } from '../../types/cropArea';
import { useCropAreaCache } from './useCropAreaCache';

export function useUpdateCropArea() {
  const sync = useCropAreaCache();
  return useMutation({
    mutationFn: ({ id, input }: { id: number; input: CropAreaRequest; previousFarmId: number }) => cropAreaService.update(id, input),
    retry: false, networkMode: 'always',
    onSuccess: (area, { input, previousFarmId }) => sync(area.id, [input.farmId, previousFarmId], area),
  });
}
