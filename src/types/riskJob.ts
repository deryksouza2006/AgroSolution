export type RiskLevel = 'NORMAL' | 'ATTENTION' | 'CRITICAL' | 'INSUFFICIENT_DATA';
export type JobStatus = 'PENDING' | 'QUEUED' | 'PROCESSING' | 'COMPLETED_WITHOUT_AI' | 'COMPLETED' | 'FAILED';
export type AlertStatus = 'OPEN' | 'ACKNOWLEDGED' | 'RESOLVED';
export type AlertAction = 'acknowledge' | 'resolve';
export interface RiskResult {
  riskLevel: string | null;
  waterAvailabilityPercent: number | null;
  rawAvailabilityPercent: number | null;
  vpdKpa: number | null;
  moistureChangePerHour: number | null;
  rulesTriggered: string[];
  limitations: string[];
  rulesVersion: string | null;
  demo: boolean;
  dataQuality: string | null;
  moistureTrend: string | null;
}
export interface RiskAlert {
  type: string | null;
  title: string | null;
  justification: string | null;
  level: string | null;
  rules: string[];
  demo: boolean;
  status: string | null;
  createdAt: string | null;
  acknowledgedAt: string | null;
  acknowledgedBy: number | null;
  resolvedAt: string | null;
  resolvedBy: number | null;
}
// Snapshots use the analysis contract, independently of ReadingResponse.
export interface RiskMeasurement {
  id: number | null;
  sensorId: number | null;
  measuredAt: string | null;
  soilMoisture: number | null;
  airTemperature: number | null;
  airHumidity: number | null;
  simulated: boolean | null;
}
export interface RiskRainfallWindow { millimeters: number | null; complete: boolean | null; limitation: string | null }
export interface GuidanceSource {
  sourceId: string | null;
  title: string | null;
  institution: string | null;
  url: string | null;
  version: string | null;
}
export interface RiskGuidance {
  summary: string | null;
  recommendation: string | null;
  recommendedActions: string[];
  warnings: string[];
  signals: string[];
  sources: GuidanceSource[];
  riskLevel: string | null;
  // null denotes legacy/unknown provenance, never successful generation.
  fallback: boolean | null;
  reason: string | null;
  model: string | null;
  promptVersion: string | null;
  generatedAt: string | null;
}
export interface RiskJob {
  id: number | null;
  cropAreaId: number | null;
  status: string | null;
  createdAt: string | null;
  completedAt: string | null;
  errorMessage: string | null;
  demo: boolean;
  result: RiskResult | null;
  guidance?: RiskGuidance | null;
  alertStatus: string | null;
  alert: RiskAlert | null;
  measurements: RiskMeasurement[];
  rainfall: { last24Hours: RiskRainfallWindow | null; last7Days: RiskRainfallWindow | null } | null;
}
export interface RiskJobPage {
  content: RiskJob[];
  number: number;
  size: number;
  totalElements: number | null;
  totalPages: number;
  first: boolean;
  last: boolean;
  partial: boolean;
}
