import type { Farm, FarmPage, FarmRequest } from '../types/farm';
import { AppError } from '../utils/errors';
import { api } from './api';

function path(id: number): string {
  if (!Number.isSafeInteger(id) || id <= 0) throw new AppError('Propriedade não encontrada ou indisponível.');
  return `/api/farms/${id}`;
}

function payload(input: FarmRequest): FarmRequest {
  return {
    name: input.name.trim(), city: input.city.trim(), state: input.state.trim().toUpperCase(),
    totalArea: input.totalArea, areaUnit: input.areaUnit,
  };
}

export const farmService = {
  async list(page: number, size: number, signal: AbortSignal): Promise<FarmPage> {
    const { data } = await api.get<FarmPage>('/api/farms', { params: { page, size }, signal });
    return data;
  },
  async get(id: number, signal: AbortSignal): Promise<Farm> {
    const { data } = await api.get<Farm>(path(id), { signal });
    return data;
  },
  async create(input: FarmRequest): Promise<Farm> {
    const { data } = await api.post<Farm>('/api/farms', payload(input));
    return data;
  },
  async update(id: number, input: FarmRequest): Promise<Farm> {
    const { data } = await api.put<Farm>(path(id), payload(input));
    return data;
  },
  async delete(id: number): Promise<void> {
    await api.delete<void>(path(id));
  },
};
