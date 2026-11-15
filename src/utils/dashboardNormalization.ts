import type { Dashboard, DashboardActivity, DashboardCropSummary, DashboardJob, DashboardPage, DashboardProvenance, DashboardReading, DashboardSensorIssue } from '../types/dashboard';
import type { ReadingSource } from '../types/reading';

type ObjectData = Record<string, unknown>;
export const dashboardRecord = (value: unknown): ObjectData | null => typeof value === 'object' && value !== null && !Array.isArray(value) ? value as ObjectData : null;
export const dashboardId = (value: unknown): number | null => typeof value === 'number' && Number.isSafeInteger(value) && value > 0 ? value : null;
const count = (value: unknown): number | null => typeof value === 'number' && Number.isSafeInteger(value) && value >= 0 ? value : null;
const numeric = (value: unknown): number | null => typeof value === 'number' && Number.isFinite(value) ? value : null;
const text = (value: unknown): string | null => typeof value === 'string' && value.trim() ? value.trim().slice(0, 2000) : null;
const date = (value: unknown): string | null => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(value) && Number.isFinite(Date.parse(value)) ? value : null;
const source = (value: unknown): ReadingSource | null => value === 'MANUAL' || value === 'DEVICE' || value === 'SIMULATED' ? value : null;

export function dashboardProvenance(value: unknown): DashboardProvenance {
  const item = dashboardRecord(value);
  const result = dashboardRecord(item?.result), alert = dashboardRecord(item?.alert);
  return { source: [item?.source, result?.source, alert?.source].some(value => value === 'SIMULATED') ? 'SIMULATED' : source(item?.source),
    demo: item?.demo === true || result?.demo === true || alert?.demo === true };
}
function cropSummary(item: ObjectData): DashboardCropSummary | null {
  const result = { ...dashboardProvenance(item), cropAreaId: dashboardId(item.cropAreaId), latestReadingId: dashboardId(item.latestReadingId), measuredAt: date(item.measuredAt),
    latestJobId: dashboardId(item.latestJobId), riskLevel: text(item.riskLevel), waterAvailabilityPercent: numeric(item.waterAvailabilityPercent),
    vpdKpa: numeric(item.vpdKpa), moistureChangePerHour: numeric(item.moistureChangePerHour) };
  return result.cropAreaId || result.latestReadingId || result.riskLevel || result.measuredAt || [result.waterAvailabilityPercent, result.vpdKpa, result.moistureChangePerHour].some(value => value !== null) ? result : null;
}
function job(item: ObjectData): DashboardJob | null {
  const result = { ...dashboardProvenance(item), id: dashboardId(item.id), cropAreaId: dashboardId(item.cropAreaId), status: text(item.status), createdAt: date(item.createdAt), alertStatus: text(item.alertStatus) };
  return result.id || result.cropAreaId || result.status || result.createdAt ? result : null;
}
function sensor(item: ObjectData): DashboardSensorIssue | null {
  const result = { ...dashboardProvenance(item), id: dashboardId(item.id), cropAreaId: dashboardId(item.cropAreaId), name: text(item.name), status: text(item.status), lastMeasuredAt: date(item.lastMeasuredAt) };
  return result.id || result.cropAreaId || result.name || result.status || result.lastMeasuredAt ? result : null;
}
function activity(item: ObjectData): DashboardActivity | null {
  const result = { ...dashboardProvenance(item), id: dashboardId(item.id), cropAreaId: dashboardId(item.cropAreaId), type: text(item.type), performedAt: date(item.performedAt), description: text(item.description) };
  return result.id || result.cropAreaId || result.type || result.performedAt || result.description ? result : null;
}
function reading(item: ObjectData): DashboardReading | null {
  const result = { ...dashboardProvenance(item), id: dashboardId(item.id), sensorId: dashboardId(item.sensorId), sensorName: text(item.sensorName), cropAreaId: dashboardId(item.cropAreaId),
    cropAreaName: text(item.cropAreaName), farmName: text(item.farmName), measuredAt: date(item.measuredAt), rainfallIntervalStart: date(item.rainfallIntervalStart),
    temperatureCelsius: numeric(item.temperatureCelsius), airHumidityPercent: numeric(item.airHumidityPercent), soilMoisturePercent: numeric(item.soilMoisturePercent),
    batteryPercent: numeric(item.batteryPercent), rainfallMillimeters: numeric(item.rainfallMillimeters) };
  return result.id || result.sensorId || result.cropAreaId || result.measuredAt || [result.temperatureCelsius, result.airHumidityPercent, result.soilMoisturePercent, result.batteryPercent, result.rainfallMillimeters].some(value => value !== null) ? result : null;
}

export function normalizeDashboard(value: unknown): Dashboard {
  const root = dashboardRecord(value) ?? {};
  let partial = false;
  function items<T>(raw: unknown, parse: (item: ObjectData) => T | null): T[] {
    if (!Array.isArray(raw)) { partial = true; return []; }
    if (raw.length > 20) partial = true;
    return raw.slice(0, 20).flatMap(value => {
      const record = dashboardRecord(value);
      const item = record ? parse(record) : null;
      if (item === null) { partial = true; return []; }
      return [item];
    });
  }
  function page<T>(raw: unknown, parse: (item: ObjectData) => T | null, pageField = 'page'): DashboardPage<T> {
    const record = dashboardRecord(raw);
    const content = items(record?.content, parse);
    const totalElements = count(record?.totalElements);
    const page = count(record?.[pageField]), size = count(record?.size), totalPages = count(record?.totalPages);
    if ([totalElements, page, size, totalPages].some(value => value === null)) partial = true;
    return { content, totalElements, page, size, totalPages, available: Array.isArray(record?.content) };
  }
  const named = (item: ObjectData) => {
    const id = dashboardId(item.id), name = text(item.name);
    return id || name ? { id, name } : null;
  };
  const farms = page(root.farms, named);
  const cropAreas = page(root.cropAreas, item => { const value = named(item); return value ? { ...value, archived: item.status === 'ARCHIVED' } : null; });
  const recentReadings = page(root.recentReadings, reading);
  const alerts = page(root.alerts, job, 'number');
  const archivedIds = new Set(cropAreas.content.filter(item => item.archived && item.id !== null).map(item => item.id));
  const cropSummaries = items(root.cropSummaries, cropSummary).filter(item => !archivedIds.has(item.cropAreaId));
  const recentActivities = items(root.recentActivities, activity);
  const actionableJobs = items(root.actionableJobs, job);
  const sensorIssues = items(root.sensorIssues, sensor);
  const updatedAt = date(root.updatedAt);
  if (!updatedAt) partial = true;
  return { ...dashboardProvenance(root), updatedAt, farms, cropAreas, recentReadings, alerts, cropSummaries, recentActivities, actionableJobs, sensorIssues,
    sensorIssuesAvailable: Array.isArray(root.sensorIssues), partial };
}
