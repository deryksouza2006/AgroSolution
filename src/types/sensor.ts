export type SensorType = 'SOIL_MOISTURE' | 'TEMPERATURE' | 'HUMIDITY' | 'WEATHER_STATION';
export type SensorStatus = 'ACTIVE' | 'INACTIVE' | 'FAULT' | 'MAINTENANCE';
export type SensorCommunicationStatus = 'RECENT' | 'STALE' | 'OFFLINE' | 'INVALID_TIMESTAMP';
export type SensorCalculatedHealth = 'HEALTHY' | 'STALE' | 'OFFLINE' | 'POSSIBLE_FAULT' | 'INSUFFICIENT_DATA';

export interface SensorCreateRequest {
  cropAreaId: number;
  name: string;
  deviceCode: string;
  sensorType: SensorType;
  installationDate?: string;
  description: string | null;
}
export interface SensorUpdateRequest extends Omit<SensorCreateRequest, 'deviceCode'> {
  deviceCode?: string;
  status: SensorStatus;
}
export interface Sensor extends Omit<SensorCreateRequest, 'installationDate'> {
  id: number;
  cropAreaName: string;
  farmId: number;
  farmName: string;
  status: SensorStatus;
  installationDate: string;
  createdAt: string;
  updatedAt: string;
}
export interface SensorPage {
  content: Sensor[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}
export interface SensorHealth {
  sensorId: number;
  communicationStatus: SensorCommunicationStatus | null;
  lastMeasuredAt: string | null;
  ageSeconds: number | null;
  policy: string | null;
  batteryPercent: number | null;
  administrativeStatus: SensorStatus | null;
  calibratedAt: string | null;
  maintenanceNote: string | null;
  calculatedHealth: SensorCalculatedHealth | null;
}
export interface SensorFormValues {
  cropAreaId: number | null;
  name: string;
  deviceCode: string;
  sensorType: SensorType | '';
  status: SensorStatus;
  installationDate: string;
  description: string;
}
export type SensorFormErrors = Partial<Record<keyof SensorFormValues, string>>;
