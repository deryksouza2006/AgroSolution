import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../auth/useAuth';
import { sensorKeys } from '../sensors/sensorKeys';
import type { Reading } from '../../types/reading';
import { readingKeys } from './readingKeys';

export function useReadingCache() {
  const client = useQueryClient();
  const { session, isSessionCurrent } = useAuth();
  return async (reading: Pick<Reading, 'id' | 'sensorId' | 'cropAreaId'>, result?: Reading) => {
    if (!isSessionCurrent(session)) return;
    await Promise.all([
      client.cancelQueries({ queryKey: readingKeys.detail(reading.id) }),
      client.cancelQueries({ queryKey: readingKeys.lists() }),
      client.cancelQueries({ queryKey: [...readingKeys.all, 'latest'] }),
      client.cancelQueries({ queryKey: sensorKeys.health(reading.sensorId) }),
    ]);
    if (!isSessionCurrent(session)) return;
    if (result) client.setQueryData(readingKeys.detail(reading.id), result);
    else client.removeQueries({ queryKey: readingKeys.detail(reading.id), exact: true });
    void client.invalidateQueries({ queryKey: readingKeys.lists() });
    // A sensor may have been transferred since this reading was recorded.
    void client.invalidateQueries({ queryKey: [...readingKeys.all, 'latest'] });
    void client.invalidateQueries({ queryKey: sensorKeys.health(reading.sensorId) });
  };
}
