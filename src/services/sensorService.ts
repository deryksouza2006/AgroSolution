import type { Sensor, SensorCreateRequest, SensorHealth, SensorPage, SensorUpdateRequest } from '../types/sensor';
import { AppError } from '../utils/errors';
import { api } from './api';

function positiveId(id: number): number {
  if (!Number.isSafeInteger(id) || id <= 0) throw new AppError('Recurso não encontrado ou indisponível.');
  return id;
}
const path = (id: number) => `/api/sensors/${positiveId(id)}`;
export const sensorService = {
  async list(page: number, size: number, signal: AbortSignal): Promise<SensorPage> {
    const { data } = await api.get<SensorPage>('/api/sensors', { params: { page, size }, signal });
    return data;
  },
  async listByCropArea(cropAreaId: number, page: number, size: number, signal: AbortSignal): Promise<SensorPage> {
    const { data } = await api.get<SensorPage>(`/api/crop-areas/${positiveId(cropAreaId)}/sensors`, { params: { page, size }, signal });
    return data;
  },
  async get(id: number, signal: AbortSignal): Promise<Sensor> {
    const { data } = await api.get<Sensor>(path(id), { signal });
    return data;
  },
  async health(id: number, signal: AbortSignal): Promise<SensorHealth> {
    const { data } = await api.get<SensorHealth>(`${path(id)}/health`, { signal });
    return data;
  },
  async create(input: SensorCreateRequest): Promise<Sensor> {
    const { data } = await api.post<Sensor>('/api/sensors', {
      cropAreaId: positiveId(input.cropAreaId), name: input.name.trim(), deviceCode: input.deviceCode.trim().toUpperCase(),
      sensorType: input.sensorType, description: input.description?.trim() || null,
      ...(input.installationDate ? { installationDate: input.installationDate } : {}),
    });
    return data;
  },
  async update(id: number, input: SensorUpdateRequest): Promise<Sensor> {
    const { data } = await api.put<Sensor>(path(id), {
      cropAreaId: positiveId(input.cropAreaId), name: input.name.trim(), sensorType: input.sensorType, status: input.status,
      description: input.description?.trim() || null,
      ...(input.deviceCode !== undefined ? { deviceCode: input.deviceCode.trim().toUpperCase() } : {}),
      ...(input.installationDate ? { installationDate: input.installationDate } : {}),
    });
    return data;
  },
  async delete(id: number): Promise<void> { await api.delete<void>(path(id)); },
};
