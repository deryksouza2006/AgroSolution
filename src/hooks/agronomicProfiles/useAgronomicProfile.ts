import { useQuery } from '@tanstack/react-query';
import { agronomicProfileService } from '../../services/agronomicProfileService';
import { agronomicProfileKeys } from './agronomicProfileKeys';

export function useAgronomicProfile(cropAreaId: number) {
  return useQuery({ queryKey: agronomicProfileKeys.latest(cropAreaId),
    queryFn: ({ signal }) => agronomicProfileService.get(cropAreaId, signal) });
}
