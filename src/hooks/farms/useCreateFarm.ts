import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../auth/useAuth';
import { farmService } from '../../services/farmService';
import { farmKeys } from './farmKeys';
import { dashboardKeys } from '../dashboard/dashboardKeys';

export function useCreateFarm() {
  const queryClient = useQueryClient();
  const { session, isSessionCurrent } = useAuth();
  return useMutation({
    mutationFn: farmService.create,
    retry: false,
    networkMode: 'always',
    onSuccess: async farm => {
      if (!isSessionCurrent(session)) return;
      await queryClient.cancelQueries({ queryKey: farmKeys.detail(farm.id) });
      if (!isSessionCurrent(session)) return;
      queryClient.setQueryData(farmKeys.detail(farm.id), farm);
      void queryClient.invalidateQueries({ queryKey: farmKeys.lists() });
      void queryClient.invalidateQueries({ queryKey: dashboardKeys.all });
    },
  });
}
