import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../auth/useAuth';
import { cropAreaKeys } from '../cropAreas/cropAreaKeys';
import type { Activity } from '../../types/activity';
import type { CropArea } from '../../types/cropArea';
import { isArchivedActivityError } from '../../utils/activityErrors';
import { activityKeys } from './activityKeys';

export function useActivityCache(cropAreaId: number) {
  const client = useQueryClient();
  const { session, isSessionCurrent } = useAuth();
  return {
    async sync(id: number, result?: Activity, remove = false) {
      if (!isSessionCurrent(session)) return;
      await client.cancelQueries({ queryKey: activityKeys.detail(cropAreaId, id) });
      if (!isSessionCurrent(session)) return;
      if (remove) client.removeQueries({ queryKey: activityKeys.detail(cropAreaId, id), exact: true });
      else if (result) client.setQueryData(activityKeys.detail(cropAreaId, id), result);
      void client.invalidateQueries({ queryKey: activityKeys.lists(cropAreaId) });
      void client.invalidateQueries({ queryKey: cropAreaKeys.detail(cropAreaId) });
    },
    async onError(error: unknown) {
      if (!isSessionCurrent(session) || !isArchivedActivityError(error)) return;
      await client.cancelQueries({ queryKey: cropAreaKeys.detail(cropAreaId) });
      if (!isSessionCurrent(session)) return;
      // This reflects the server's explicit rejection, rather than an optimistic state.
      client.setQueryData<CropArea>(cropAreaKeys.detail(cropAreaId), current => current ? { ...current, status: 'ARCHIVED' } : current);
      void client.invalidateQueries({ queryKey: cropAreaKeys.detail(cropAreaId) });
      void client.invalidateQueries({ queryKey: cropAreaKeys.lists() });
    },
  };
}
