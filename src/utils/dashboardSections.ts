import type { Dashboard, DashboardActivity, DashboardCropSummary, DashboardJob, DashboardReading, DashboardSensorIssue } from '../types/dashboard';

export type DashboardEntry = (
  | { kind: 'crop'; value: DashboardCropSummary }
  | { kind: 'alert' | 'job'; value: DashboardJob }
  | { kind: 'sensor'; value: DashboardSensorIssue }
  | { kind: 'activity'; value: DashboardActivity }
  | { kind: 'reading'; value: DashboardReading }
) & { key: string };
export interface DashboardSection { title: string; data: DashboardEntry[] }
export function dashboardSections(dashboard: Dashboard): DashboardSection[] {
  return [
    { title: 'Situação dos talhões', data: dashboard.cropSummaries.map((value, index): DashboardEntry => ({ kind: 'crop', value, key: `crop-${value.cropAreaId}-${index}` })) },
    { title: 'Alertas abertos', data: dashboard.alerts.content.map((value, index): DashboardEntry => ({ kind: 'alert', value, key: `alert-${value.id}-${index}` })) },
    { title: 'Problemas nos sensores', data: dashboard.sensorIssues.map((value, index): DashboardEntry => ({ kind: 'sensor', value, key: `sensor-${value.id}-${index}` })) },
    { title: 'Atividades recentes', data: dashboard.recentActivities.map((value, index): DashboardEntry => ({ kind: 'activity', value, key: `activity-${value.id}-${index}` })) },
    { title: 'Leituras recentes', data: dashboard.recentReadings.content.map((value, index): DashboardEntry => ({ kind: 'reading', value, key: `reading-${value.id}-${index}` })) },
    { title: 'Processamentos pendentes ou com falha', data: dashboard.actionableJobs.map((value, index): DashboardEntry => ({ kind: 'job', value, key: `job-${value.id}-${index}` })) },
  ].filter(section => section.data.length > 0);
}
