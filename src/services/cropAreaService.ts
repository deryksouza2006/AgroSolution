import type { CropArea, CropAreaPage, CropAreaRequest } from '../types/cropArea';
import { AppError } from '../utils/errors';
import { api } from './api';

function positiveId(id: number) {
  if (!Number.isSafeInteger(id) || id <= 0) throw new AppError('Recurso não encontrado ou indisponível.');
  return id;
}

function payload(input: CropAreaRequest): CropAreaRequest {
  return {
    farmId: positiveId(input.farmId), name: input.name.trim(), cropType: input.cropType.trim(),
    areaSize: input.areaSize, areaUnit: input.areaUnit, latitude: input.latitude,
    longitude: input.longitude, description: input.description?.trim() || null,
  };
}

export const cropAreaService = {
  async list(page: number, size: number, signal: AbortSignal): Promise<CropAreaPage> {
    const { data } = await api.get<CropAreaPage>('/api/crop-areas', { params: { page, size }, signal });
    return data;
  },
  async listByFarm(farmId: number, page: number, size: number, signal: AbortSignal): Promise<CropAreaPage> {
    const { data } = await api.get<CropAreaPage>(`/api/farms/${positiveId(farmId)}/crop-areas`, { params: { page, size }, signal });
    return data;
  },
  async get(id: number, signal: AbortSignal): Promise<CropArea> {
    const { data } = await api.get<CropArea>(`/api/crop-areas/${positiveId(id)}`, { signal });
    return data;
  },
  async create(input: CropAreaRequest): Promise<CropArea> {
    const { data } = await api.post<CropArea>('/api/crop-areas', payload(input));
    return data;
  },
  async update(id: number, input: CropAreaRequest): Promise<CropArea> {
    const { data } = await api.put<CropArea>(`/api/crop-areas/${positiveId(id)}`, payload(input));
    return data;
  },
  async delete(id: number): Promise<void> {
    await api.delete<void>(`/api/crop-areas/${positiveId(id)}`);
  },
  async archive(id: number, archived: boolean): Promise<CropArea | undefined> {
    const { data } = await api.patch<CropArea | undefined>(`/api/crop-areas/${positiveId(id)}/archive`, { archived });
    return data || undefined;
  },
};
