import { isAxiosError } from 'axios';
import type { Reading, ReadingPage, ReadingRequest, ReadingScope } from '../types/reading';
import { AppError } from '../utils/errors';
import { isLatestReadingEmptyStatus } from '../utils/readingConflicts';
import { api } from './api';

const idPath = (id: number) => {
  if (!Number.isSafeInteger(id) || id <= 0) throw new AppError('Recurso não encontrado ou indisponível.');
  return String(id);
};
export const readingService = {
  async list(scope: ReadingScope, page: number, size: number, signal: AbortSignal): Promise<ReadingPage> {
    const path = scope.kind === 'sensor' ? `/api/sensors/${idPath(scope.sensorId)}/readings`
      : scope.kind === 'cropArea' ? `/api/crop-areas/${idPath(scope.cropAreaId)}/readings` : '/api/sensor-readings';
    const { data } = await api.get<ReadingPage>(path, { params: { page, size, sort: 'measuredAt,desc' }, signal });
    return data;
  },
  async get(id: number, signal: AbortSignal): Promise<Reading> {
    const { data } = await api.get<Reading>(`/api/sensor-readings/${idPath(id)}`, { signal });
    return data;
  },
  async latest(cropAreaId: number, signal: AbortSignal): Promise<Reading | null> {
    try {
      const { data } = await api.get<Reading>(`/api/crop-areas/${idPath(cropAreaId)}/readings/latest`, { signal });
      return data;
    } catch (error: unknown) {
      if (isAxiosError(error) && isLatestReadingEmptyStatus(error.response?.status)) return null;
      throw error;
    }
  },
  async create(input: ReadingRequest): Promise<Reading> {
    idPath(input.sensorId);
    const { data } = await api.post<Reading>('/api/sensor-readings', {
      sensorId: input.sensorId, source: 'MANUAL',
      ...(input.temperatureCelsius !== undefined ? { temperatureCelsius: input.temperatureCelsius } : {}),
      ...(input.airHumidityPercent !== undefined ? { airHumidityPercent: input.airHumidityPercent } : {}),
      ...(input.soilMoisturePercent !== undefined ? { soilMoisturePercent: input.soilMoisturePercent } : {}),
      ...(input.batteryPercent !== undefined ? { batteryPercent: input.batteryPercent } : {}),
      ...(input.rainfallMillimeters !== undefined ? { rainfallMillimeters: input.rainfallMillimeters } : {}),
      ...(input.measuredAt ? { measuredAt: input.measuredAt } : {}),
      ...(input.rainfallIntervalStart ? { rainfallIntervalStart: input.rainfallIntervalStart } : {}),
    });
    return data;
  },
  async delete(id: number): Promise<void> { await api.delete<void>(`/api/sensor-readings/${idPath(id)}`); },
};
