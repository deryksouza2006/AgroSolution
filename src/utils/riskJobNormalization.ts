import type { RiskAlert, RiskJob, RiskJobPage, RiskMeasurement, RiskRainfallWindow, RiskResult } from '../types/riskJob';
import { safeApiMessage } from './errors.ts';
import { normalizeGuidance } from './guidanceNormalization.ts';

export const riskRecord = (value: unknown): Record<string, unknown> | null => typeof value === 'object' && value !== null && !Array.isArray(value) ? value as Record<string, unknown> : null;
export const riskId = (value: unknown): number | null => typeof value === 'number' && Number.isSafeInteger(value) && value > 0 ? value : null;
const text = (value: unknown) => typeof value === 'string' && value.trim() ? value.trim() : null;
const numeric = (value: unknown) => typeof value === 'number' && Number.isFinite(value) ? value : null;
const date = (value: unknown) => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(value) && Number.isFinite(Date.parse(value)) ? value : null;
const boolean = (value: unknown) => typeof value === 'boolean' ? value : null;
const strings = (value: unknown): string[] => Array.isArray(value) ? value.flatMap(item => { const value = text(item); return value ? [value] : []; }) : [];

function result(value: unknown): RiskResult | null {
  const data = riskRecord(value);
  return data ? { riskLevel: text(data.riskLevel), waterAvailabilityPercent: numeric(data.waterAvailabilityPercent), rawAvailabilityPercent: numeric(data.rawAvailabilityPercent),
    vpdKpa: numeric(data.vpdKpa), moistureChangePerHour: numeric(data.moistureChangePerHour), rulesTriggered: strings(data.rulesTriggered), limitations: strings(data.limitations),
    rulesVersion: text(data.rulesVersion), demo: data.demo === true, dataQuality: text(data.dataQuality), moistureTrend: text(data.moistureTrend) } : null;
}
function alert(value: unknown): RiskAlert | null {
  const data = riskRecord(value);
  return data ? { type: text(data.type), title: text(data.title), justification: text(data.justification), level: text(data.level), rules: strings(data.rules), demo: data.demo === true,
    status: text(data.status), createdAt: date(data.createdAt), acknowledgedAt: date(data.acknowledgedAt), acknowledgedBy: riskId(data.acknowledgedBy),
    resolvedAt: date(data.resolvedAt), resolvedBy: riskId(data.resolvedBy) } : null;
}
function rainfallWindow(value: unknown): RiskRainfallWindow | null {
  const data = riskRecord(value);
  return data ? { millimeters: numeric(data.millimeters), complete: boolean(data.complete), limitation: text(data.limitation) } : null;
}
export function normalizeRiskJob(value: unknown): RiskJob {
  const data = riskRecord(value) ?? {};
  const rainfall = riskRecord(data.rainfall);
  const measurements: RiskMeasurement[] = Array.isArray(data.measurements) ? data.measurements.flatMap(value => {
    const item = riskRecord(value);
    return item ? [{ id: riskId(item.id), sensorId: riskId(item.sensorId), measuredAt: date(item.measuredAt), soilMoisture: numeric(item.soilMoisture),
      airTemperature: numeric(item.airTemperature), airHumidity: numeric(item.airHumidity), simulated: boolean(item.simulated) }] : [];
  }) : [];
  return { id: riskId(data.id), cropAreaId: riskId(data.cropAreaId), status: text(data.status), createdAt: date(data.createdAt), completedAt: date(data.completedAt),
    errorMessage: safeApiMessage(data.errorMessage) ?? null, demo: data.demo === true, result: result(data.result), guidance: normalizeGuidance(data.guidance), alertStatus: text(data.alertStatus), alert: alert(data.alert), measurements,
    rainfall: rainfall ? { last24Hours: rainfallWindow(rainfall.last24Hours), last7Days: rainfallWindow(rainfall.last7Days) } : null };
}
export function normalizeRiskJobPage(value: unknown, requestedPage: number, size: number): RiskJobPage {
  const data = riskRecord(value) ?? {};
  const count = (value: unknown) => typeof value === 'number' && Number.isSafeInteger(value) && value >= 0 ? value : null;
  let partial = !Array.isArray(data.content);
  const content = Array.isArray(data.content) ? data.content.flatMap(value => {
    if (!riskRecord(value)) { partial = true; return []; }
    const job = normalizeRiskJob(value);
    if (job.id === null && job.cropAreaId === null && job.status === null) { partial = true; return []; }
    return [job];
  }) : [];
  const number = count(data.number), totalPages = count(data.totalPages), totalElements = count(data.totalElements), actualSize = count(data.size);
  if ([number, totalPages, totalElements, actualSize].some(value => value === null)) partial = true;
  return { content, number: number ?? requestedPage, size: actualSize ?? size, totalElements, totalPages: totalPages ?? 0,
    first: typeof data.first === 'boolean' ? data.first : (number ?? requestedPage) === 0,
    last: typeof data.last === 'boolean' ? data.last : totalPages === null || (number ?? requestedPage) + 1 >= totalPages, partial };
}
