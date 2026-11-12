import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../auth/useAuth';
import { farmService } from '../../services/farmService';
import type { FarmRequest } from '../../types/farm';
import { farmKeys } from './farmKeys';

export function useUpdateFarm() {
  const queryClient = useQueryClient();
  const { session, isSessionCurrent } = useAuth();
  return useMutation({
    mutationFn: ({ id, input }: { id: number; input: FarmRequest }) => farmService.update(id, input),
    retry: false,
    networkMode: 'always',
    onSuccess: async farm => {
      if (!isSessionCurrent(session)) return;
      await queryClient.cancelQueries({ queryKey: farmKeys.detail(farm.id) });
      if (!isSessionCurrent(session)) return;
      queryClient.setQueryData(farmKeys.detail(farm.id), farm);
      void queryClient.invalidateQueries({ queryKey: farmKeys.lists() });
    },
  });
}
