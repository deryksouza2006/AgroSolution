import type { Dashboard, DashboardCounts, DashboardJobStatus, DashboardPage, DashboardProvenance, DashboardRisk } from '../types/dashboard';
import { formatCropAreaDate } from './cropAreaFormatting.ts';
import { formatReadingSource } from './readingFormatting.ts';

const riskLabels: Record<DashboardRisk, string> = { NORMAL: 'Normal', ATTENTION: 'Atenção', CRITICAL: 'Crítico', INSUFFICIENT_DATA: 'Dados insuficientes' };
const jobLabels: Record<DashboardJobStatus, string> = { PENDING: 'Pendente', QUEUED: 'Na fila', PROCESSING: 'Processando', FAILED: 'Falhou', COMPLETED_WITHOUT_AI: 'Análise concluída', COMPLETED: 'Orientação concluída' };
export const formatDashboardRisk = (value: string | null) => value ? Object.hasOwn(riskLabels, value) ? riskLabels[value as DashboardRisk] : 'Risco indisponível' : 'Risco não informado';
export const formatDashboardJobStatus = (value: string | null) => value ? Object.hasOwn(jobLabels, value) ? jobLabels[value as DashboardJobStatus] : 'Estado indisponível' : 'Estado não informado';
export function formatDashboardMetric(value: number | null | undefined, unit = ''): string {
  if (typeof value !== 'number' || !Number.isFinite(value)) return 'Não informado';
  return `${new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 3 }).format(value)}${unit ? ` ${unit}` : ''}`;
}
export const formatDashboardDate = (value: string | null) => value ? formatCropAreaDate(value) : 'Não informado';
export const formatDashboardSource = (value: DashboardProvenance['source']) => value ? formatReadingSource(value) : 'Não informada';
export function dashboardDataLabels(value: DashboardProvenance): string[] {
  return [...(value.source === 'SIMULATED' ? ['Dado simulado'] : []), ...(value.demo ? ['Dados demonstrativos'] : [])];
}
export function dashboardCounts(dashboard: Dashboard): DashboardCounts {
  const total = (page: DashboardPage<unknown>) => page.totalElements ?? (page.available ? page.content.length : null);
  return { farms: total(dashboard.farms), cropAreas: total(dashboard.cropAreas), recentReadings: total(dashboard.recentReadings),
    openAlerts: total(dashboard.alerts), sensorIssues: dashboard.sensorIssuesAvailable ? dashboard.sensorIssues.length : null };
}
export function dashboardCropName(dashboard: Dashboard, id: number | null): string {
  if (id === null) return 'Talhão não informado';
  return dashboard.cropAreas.content.find(item => item.id === id)?.name ?? `Talhão #${id}`;
}
