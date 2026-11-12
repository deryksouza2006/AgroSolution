import type { Activity, ActivityFilters, ActivityPage, ActivityRequest } from '../types/activity';
import { AppError } from '../utils/errors';
import { api } from './api';

function positiveId(id: number): number {
  if (!Number.isSafeInteger(id) || id <= 0) throw new AppError('Recurso não encontrado ou indisponível.');
  return id;
}
function path(cropAreaId: number, activityId?: number) {
  const base = `/api/crop-areas/${positiveId(cropAreaId)}/activities`;
  return activityId === undefined ? base : `${base}/${positiveId(activityId)}`;
}
function payload(input: ActivityRequest): ActivityRequest {
  return { type: input.type, performedAt: input.performedAt, description: input.description?.trim() || null,
    quantity: input.quantity, unit: input.unit?.trim() || null };
}
export const activityService = {
  async list(cropAreaId: number, page: number, size: number, filters: ActivityFilters, signal: AbortSignal): Promise<ActivityPage> {
    if (!Number.isInteger(page) || page < 0 || !Number.isInteger(size) || size < 1 || size > 100) throw new AppError('Paginação inválida. Use de 1 a 100 atividades por página.');
    const { data } = await api.get<ActivityPage>(path(cropAreaId), {
      params: { page, size, type: filters.type, from: filters.from, to: filters.to, sort: 'performedAt,desc' }, signal,
    });
    return data;
  },
  async get(cropAreaId: number, activityId: number, signal: AbortSignal): Promise<Activity> {
    const { data } = await api.get<Activity>(path(cropAreaId, activityId), { signal });
    return data;
  },
  async create(cropAreaId: number, input: ActivityRequest): Promise<Activity> {
    const { data } = await api.post<Activity>(path(cropAreaId), payload(input));
    return data;
  },
  async update(cropAreaId: number, activityId: number, input: ActivityRequest): Promise<Activity> {
    const { data } = await api.put<Activity>(path(cropAreaId, activityId), payload(input));
    return data;
  },
  async delete(cropAreaId: number, activityId: number): Promise<void> {
    await api.delete<void>(path(cropAreaId, activityId));
  },
};
