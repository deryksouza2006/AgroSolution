import { useMutation, useQueryClient } from '@tanstack/react-query';
import { agronomicProfileService } from '../../services/agronomicProfileService';
import type { AgronomicProfileRequest } from '../../types/agronomicProfile';
import { useAuth } from '../auth/useAuth';
import { agronomicProfileKeys } from './agronomicProfileKeys';

export function useSaveAgronomicProfile(cropAreaId: number) {
  const client = useQueryClient();
  const { session, isSessionCurrent } = useAuth();
  return useMutation({
    mutationFn: (input: AgronomicProfileRequest) => agronomicProfileService.save(cropAreaId, input),
    retry: false,
    networkMode: 'always',
    onSuccess: async profile => {
      if (!isSessionCurrent(session)) return;
      const queryKey = agronomicProfileKeys.latest(cropAreaId);
      await client.cancelQueries({ queryKey });
      if (!isSessionCurrent(session)) return;
      client.setQueryData(queryKey, profile);
      void client.invalidateQueries({ queryKey });
    },
  });
}
