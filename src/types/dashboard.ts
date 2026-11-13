import type { MeasurementField, ReadingSource } from './reading';

export type DashboardRisk = 'NORMAL' | 'ATTENTION' | 'CRITICAL' | 'INSUFFICIENT_DATA';
export type DashboardJobStatus = 'PENDING' | 'QUEUED' | 'PROCESSING' | 'FAILED' | 'COMPLETED_WITHOUT_AI' | 'COMPLETED';
export interface DashboardProvenance { source: ReadingSource | null; demo: boolean }
export interface DashboardPage<T> {
  content: T[];
  page: number | null;
  size: number | null;
  totalElements: number | null;
  totalPages: number | null;
  available: boolean;
}
export interface DashboardNamedResource { id: number | null; name: string | null }
export interface DashboardCropArea extends DashboardNamedResource { archived: boolean }
export interface DashboardCropSummary extends DashboardProvenance {
  cropAreaId: number | null;
  latestReadingId: number | null;
  measuredAt: string | null;
  latestJobId: number | null;
  riskLevel: string | null;
  waterAvailabilityPercent: number | null;
  vpdKpa: number | null;
  moistureChangePerHour: number | null;
}
export interface DashboardJob extends DashboardProvenance {
  id: number | null;
  cropAreaId: number | null;
  status: string | null;
  createdAt: string | null;
  alertStatus: string | null;
}
export interface DashboardSensorIssue extends DashboardProvenance {
  id: number | null;
  cropAreaId: number | null;
  name: string | null;
  status: string | null;
  lastMeasuredAt: string | null;
}
export interface DashboardActivity extends DashboardProvenance {
  id: number | null;
  cropAreaId: number | null;
  type: string | null;
  performedAt: string | null;
  description: string | null;
}
export interface DashboardReading extends DashboardProvenance, Record<MeasurementField, number | null> {
  id: number | null;
  sensorId: number | null;
  sensorName: string | null;
  cropAreaId: number | null;
  cropAreaName: string | null;
  farmName: string | null;
  measuredAt: string | null;
  rainfallIntervalStart: string | null;
}
export interface Dashboard extends DashboardProvenance {
  updatedAt: string | null;
  farms: DashboardPage<DashboardNamedResource>;
  cropAreas: DashboardPage<DashboardCropArea>;
  recentReadings: DashboardPage<DashboardReading>;
  alerts: DashboardPage<DashboardJob>;
  cropSummaries: DashboardCropSummary[];
  recentActivities: DashboardActivity[];
  actionableJobs: DashboardJob[];
  sensorIssues: DashboardSensorIssue[];
  sensorIssuesAvailable: boolean;
  partial: boolean;
}
export interface DashboardCounts {
  farms: number | null;
  cropAreas: number | null;
  recentReadings: number | null;
  openAlerts: number | null;
  sensorIssues: number | null;
}
