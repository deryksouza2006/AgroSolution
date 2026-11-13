import type { SensorType } from './sensor';

export type ReadingSource = 'MANUAL' | 'DEVICE' | 'SIMULATED';
export type MeasurementField = 'temperatureCelsius' | 'airHumidityPercent' | 'soilMoisturePercent' | 'batteryPercent' | 'rainfallMillimeters';
export type ReadingScope = { kind: 'all' } | { kind: 'sensor'; sensorId: number; sensorName?: string }
  | { kind: 'cropArea'; cropAreaId: number; cropAreaName?: string };
export interface ReadingRequest {
  sensorId: number;
  temperatureCelsius?: number;
  airHumidityPercent?: number;
  soilMoisturePercent?: number;
  batteryPercent?: number;
  rainfallMillimeters?: number;
  measuredAt?: string;
  rainfallIntervalStart?: string;
  source: 'MANUAL';
}
export interface Reading {
  id: number;
  sensorId: number;
  sensorName: string;
  sensorType: SensorType;
  cropAreaId: number;
  cropAreaName: string;
  farmId: number;
  farmName: string;
  temperatureCelsius: number | null;
  airHumidityPercent: number | null;
  soilMoisturePercent: number | null;
  batteryPercent: number | null;
  rainfallMillimeters: number | null;
  measuredAt: string;
  rainfallIntervalStart: string | null;
  source: ReadingSource;
  analysisStatus: string;
  createdAt: string;
  updatedAt: string;
}
export interface ReadingPage { content: Reading[]; page: number; size: number; totalElements: number; totalPages: number }
export interface ReadingFormValues {
  sensorId: number | null;
  temperatureCelsius: string;
  airHumidityPercent: string;
  soilMoisturePercent: string;
  batteryPercent: string;
  rainfallMillimeters: string;
  measuredDate: string;
  measuredTime: string;
  rainfallStartDate: string;
  rainfallStartTime: string;
}
export type ReadingFormErrors = Partial<Record<keyof ReadingFormValues | 'measurements', string>>;
