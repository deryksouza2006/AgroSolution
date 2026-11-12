import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../auth/useAuth';
import { farmService } from '../../services/farmService';
import { farmKeys } from './farmKeys';

export function useDeleteFarm() {
  const queryClient = useQueryClient();
  const { session, isSessionCurrent } = useAuth();
  return useMutation({
    mutationFn: farmService.delete,
    retry: false,
    networkMode: 'always',
    onSuccess: async (_, id) => {
      if (!isSessionCurrent(session)) return;
      await queryClient.cancelQueries({ queryKey: farmKeys.detail(id) });
      if (!isSessionCurrent(session)) return;
      queryClient.removeQueries({ queryKey: farmKeys.detail(id), exact: true });
      void queryClient.invalidateQueries({ queryKey: farmKeys.lists() });
    },
  });
}
