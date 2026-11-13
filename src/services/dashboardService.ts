import type { Dashboard } from '../types/dashboard';
import { dashboardRecord, normalizeDashboard } from '../utils/dashboardNormalization';
import { AppError } from '../utils/errors';
import { api } from './api';

export const dashboardService = {
  async get(signal: AbortSignal): Promise<Dashboard> {
    const { data } = await api.get<unknown>('/api/dashboard', { signal });
    if (!dashboardRecord(data)) throw new AppError('O servidor retornou um dashboard inválido. Tente novamente.');
    return normalizeDashboard(data);
  },
};
