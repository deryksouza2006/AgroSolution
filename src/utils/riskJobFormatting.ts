import { formatDashboardJobStatus, formatDashboardMetric, formatDashboardRisk } from './dashboardFormatting.ts';
import { formatCropAreaDate } from './cropAreaFormatting.ts';

const alertLabels = { OPEN: 'Aberto', ACKNOWLEDGED: 'Reconhecido', RESOLVED: 'Resolvido' };
const qualityLabels = { COMPLETE: 'Completa', PARTIAL: 'Parcial', INSUFFICIENT: 'Insuficiente' };
const trendLabels = { DRYING_FAST: 'Secagem rápida', DRYING_SLOWLY: 'Secagem gradual', RECOVERING: 'Recuperando', STABLE: 'Estável' };
function label(values: Record<string, string>, value: string | null): string { return value === null ? 'Sem dados' : Object.hasOwn(values, value) ? values[value] : 'Estado não reconhecido'; }
export const formatRiskLevel = (value: string | null) => value === null ? 'Sem dados' : formatDashboardRisk(value);
export const formatRiskJobStatus = (value: string | null) => value === null ? 'Sem dados' : formatDashboardJobStatus(value);
export const formatAlertStatus = (value: string | null) => label(alertLabels, value);
export const formatRiskQuality = (value: string | null) => label(qualityLabels, value);
export const formatMoistureTrend = (value: string | null) => label(trendLabels, value);
export const formatRiskMetric = (value: number | null | undefined, unit = '') => typeof value === 'number' && Number.isFinite(value) ? formatDashboardMetric(value, unit) : 'Sem dados';
export const formatRiskDate = (value: string | null) => value ? formatCropAreaDate(value) : 'Sem dados';
export const riskDemoLabel = (demo: boolean) => demo === true ? 'Regras demonstrativas' : null;
export const measurementOriginLabel = (simulated: boolean | null) => simulated === true ? 'Leitura simulada' : simulated === false ? 'Leitura real' : 'Origem: sem dados';
export const formatRiskRule = (rule: string) => rule === 'LOW_WATER_AVAILABILITY' ? 'Disponibilidade hídrica baixa' : rule;
