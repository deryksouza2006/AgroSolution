import { isAxiosError } from 'axios';
import type { AgronomicProfile, AgronomicProfileRequest } from '../types/agronomicProfile';
import { AppError } from '../utils/errors';
import { api } from './api';

function path(cropAreaId: number): string {
  if (!Number.isSafeInteger(cropAreaId) || cropAreaId <= 0) throw new AppError('Talhão não encontrado ou indisponível.');
  return `/api/crop-areas/${cropAreaId}/agronomic-profile`;
}

export const agronomicProfileService = {
  async get(cropAreaId: number, signal: AbortSignal): Promise<AgronomicProfile | null> {
    try {
      const { data } = await api.get<AgronomicProfile>(path(cropAreaId), { signal });
      return data;
    } catch (error: unknown) {
      if (isAxiosError(error) && error.response?.status === 404) return null;
      throw error;
    }
  },
  async save(cropAreaId: number, input: AgronomicProfileRequest): Promise<AgronomicProfile> {
    const { data } = await api.put<AgronomicProfile>(path(cropAreaId), {
      soilTexture: input.soilTexture.trim(), fieldCapacityPercent: input.fieldCapacityPercent,
      wiltingPointPercent: input.wiltingPointPercent, rootDepthCentimeters: input.rootDepthCentimeters,
      sensorDepthCentimeters: input.sensorDepthCentimeters, source: input.source.trim(), demo: input.demo,
    });
    return data;
  },
};
