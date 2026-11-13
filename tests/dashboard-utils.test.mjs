import assert from 'node:assert/strict';
import test from 'node:test';
import { dashboardId, dashboardProvenance, normalizeDashboard } from '../src/utils/dashboardNormalization.ts';
import { dashboardCounts, dashboardCropName, dashboardDataLabels, formatDashboardDate, formatDashboardJobStatus, formatDashboardMetric, formatDashboardRisk, formatDashboardSource } from '../src/utils/dashboardFormatting.ts';
import { dashboardSections } from '../src/utils/dashboardSections.ts';

const page = (content = [], totalElements = content.length) => ({ content, page: 0, size: 20, totalElements, totalPages: totalElements ? Math.ceil(totalElements / 20) : 0 });
const emptyResponse = () => ({ updatedAt: '2026-11-12T15:00:00Z', farms: page(), cropAreas: page(), recentReadings: page(),
  alerts: { content: [], number: 0, size: 20, totalElements: 0, totalPages: 0 }, cropSummaries: [], recentActivities: [], actionableJobs: [], sensorIssues: [] });

test('dashboard translates every backend risk and job status without deriving risk locally', () => {
  assert.deepEqual(['NORMAL', 'ATTENTION', 'CRITICAL', 'INSUFFICIENT_DATA'].map(formatDashboardRisk), ['Normal', 'Atenção', 'Crítico', 'Dados insuficientes']);
  assert.deepEqual(['PENDING', 'QUEUED', 'PROCESSING', 'FAILED', 'COMPLETED_WITHOUT_AI', 'COMPLETED'].map(formatDashboardJobStatus), ['Pendente', 'Na fila', 'Processando', 'Falhou', 'Análise concluída', 'Orientação concluída']);
  assert.equal(formatDashboardRisk(null), 'Risco não informado');
  assert.equal(formatDashboardJobStatus(null), 'Estado não informado');
  for (const value of ['UNKNOWN', 'toString', 'constructor', '__proto__']) {
    assert.equal(formatDashboardRisk(value), 'Risco indisponível');
    assert.equal(formatDashboardJobStatus(value), 'Estado indisponível');
  }
  const dashboard = normalizeDashboard({ ...emptyResponse(), cropSummaries: [{ cropAreaId: 1, riskLevel: null, waterAvailabilityPercent: 0, vpdKpa: 5, moistureChangePerHour: -30 }] });
  assert.equal(dashboard.cropSummaries[0].riskLevel, null);
});

test('optional metrics preserve zero, negative changes and Brazilian decimals, without inventing missing values', () => {
  assert.equal(formatDashboardMetric(70.5, '%'), '70,5 %');
  assert.equal(formatDashboardMetric(1.2, 'kPa'), '1,2 kPa');
  assert.equal(formatDashboardMetric(-0.8, '/h'), '-0,8 /h');
  assert.equal(formatDashboardMetric(0, '%'), '0 %');
  for (const value of [null, undefined, NaN, Infinity, -Infinity, '70', {}, []]) assert.equal(formatDashboardMetric(value, '%'), 'Não informado');
  assert.equal(formatDashboardDate(null), 'Não informado');
  assert.equal(formatDashboardSource(null), 'Não informada');
  assert.equal(formatDashboardSource('DEVICE'), 'Dispositivo IoT');
});

test('only explicit simulation or demo flags produce data notices, including job result and alert metadata', () => {
  assert.deepEqual(dashboardDataLabels(dashboardProvenance({ source: 'SIMULATED' })), ['Dado simulado']);
  assert.deepEqual(dashboardDataLabels(dashboardProvenance({ demo: true })), ['Dados demonstrativos']);
  assert.deepEqual(dashboardDataLabels(dashboardProvenance({ source: 'SIMULATED', demo: true })), ['Dado simulado', 'Dados demonstrativos']);
  assert.deepEqual(dashboardDataLabels(dashboardProvenance({ result: { demo: true }, alert: { source: 'SIMULATED' } })), ['Dado simulado', 'Dados demonstrativos']);
  for (const data of [null, {}, { source: 'MANUAL', demo: false }, { source: 'DEVICE', demo: 'true' }, { source: { name: 'SIMULATED' } }, { result: 'DEMO', alert: null }]) assert.deepEqual(dashboardDataLabels(dashboardProvenance(data)), []);
});

test('summary counts use totals instead of the capped content and preserve the Spring alert page number', () => {
  const dashboard = normalizeDashboard({ ...emptyResponse(), farms: page([{ id: 1, name: 'Fazenda' }], 42), cropAreas: page([], 80), recentReadings: page([], 123),
    alerts: { content: [{ id: 5, cropAreaId: 1, status: 'PROCESSING' }], number: 2, size: 20, totalElements: 55, totalPages: 3 }, sensorIssues: [{ id: 1 }, { id: 2 }] });
  assert.deepEqual(dashboardCounts(dashboard), { farms: 42, cropAreas: 80, recentReadings: 123, openAlerts: 55, sensorIssues: 2 });
  assert.equal(dashboard.alerts.page, 2);
  assert.equal(dashboard.partial, false);
});

test('missing totals fall back to available items and absent lists stay unknown instead of zero', () => {
  const dashboard = normalizeDashboard({ ...emptyResponse(), farms: { content: [{ id: 1 }, { id: 2 }], totalElements: null }, cropAreas: null, recentReadings: { content: [], totalElements: 0 }, sensorIssues: null });
  assert.deepEqual(dashboardCounts(dashboard), { farms: 2, cropAreas: null, recentReadings: 0, openAlerts: 0, sensorIssues: null });
  assert.equal(dashboard.partial, true);
  assert.deepEqual(dashboardCounts(normalizeDashboard(emptyResponse())), { farms: 0, cropAreas: 0, recentReadings: 0, openAlerts: 0, sensorIssues: 0 });
});

test('null or malformed fields and items cannot invalidate otherwise usable dashboard sections', () => {
  for (const response of [null, undefined, [], 'invalid', 4, {}]) {
    const dashboard = normalizeDashboard(response);
    assert.equal(dashboard.partial, true);
    assert.deepEqual(dashboardSections(dashboard), []);
    assert.equal(dashboardCounts(dashboard).farms, null);
  }
  const dashboard = normalizeDashboard({ ...emptyResponse(), updatedAt: {},
    cropSummaries: [null, 'bad', {}, { cropAreaId: 1, riskLevel: {}, vpdKpa: '1.2', waterAvailabilityPercent: null, moistureChangePerHour: -0.8, measuredAt: null, source: null }],
    recentReadings: page([null, { id: 1, sensorName: {}, measuredAt: 'invalid', soilMoisturePercent: 0, batteryPercent: 0, temperatureCelsius: NaN }]),
    recentActivities: [null, { id: 1, cropAreaId: null, type: {}, description: null }], sensorIssues: [false, { id: 1, name: [], status: null, lastMeasuredAt: null }],
    actionableJobs: [{ id: 1, status: null, errorMessage: { stacktrace: 'internal data' }, result: null, alert: null }] });
  assert.equal(dashboard.partial, true);
  assert.equal(dashboard.updatedAt, null);
  assert.equal(dashboard.cropSummaries.length, 1);
  assert.equal(dashboard.cropSummaries[0].riskLevel, null);
  assert.equal(dashboard.cropSummaries[0].vpdKpa, null);
  assert.equal(dashboard.recentReadings.content[0].soilMoisturePercent, 0);
  assert.equal(dashboard.recentReadings.content[0].batteryPercent, 0);
  assert.equal(dashboard.recentReadings.content[0].measuredAt, null);
  assert.equal(dashboard.recentReadings.content[0].temperatureCelsius, null);
  assert.equal(Object.hasOwn(dashboard.actionableJobs[0], 'errorMessage'), false);
  assert.equal(dashboardSections(dashboard).length, 5);
});

test('each dashboard list stays bounded to twenty items and empty sections are omitted', () => {
  const content = Array.from({ length: 25 }, (_, index) => ({ id: index + 1, cropAreaId: index + 1 }));
  const dashboard = normalizeDashboard({ ...emptyResponse(), recentReadings: page(content, 25), sensorIssues: content, cropSummaries: content, actionableJobs: content });
  assert.equal(dashboard.partial, true);
  assert.equal(dashboard.recentReadings.content.length, 20);
  assert.equal(dashboard.cropSummaries.length, 20);
  assert.equal(dashboard.actionableJobs.length, 20);
  assert.equal(dashboardCounts(dashboard).recentReadings, 25);
  assert.equal(dashboardCounts(dashboard).sensorIssues, 20);
  assert.deepEqual(dashboardSections(dashboard).map(section => section.title), ['Situação dos talhões', 'Problemas nos sensores', 'Leituras recentes', 'Processamentos pendentes ou com falha']);
  assert.deepEqual(dashboardSections(normalizeDashboard(emptyResponse())), []);
});

test('only positive integer identifiers can become navigation targets, with safe crop-name fallbacks', () => {
  for (const id of [null, undefined, '1', 0, -1, 1.5, Infinity, Number.MAX_SAFE_INTEGER + 1]) assert.equal(dashboardId(id), null);
  assert.equal(dashboardId(1), 1);
  const dashboard = normalizeDashboard({ ...emptyResponse(), cropAreas: page([{ id: 1, name: 'Talhão A' }, { id: null, name: 'Sem identificador', status: 'ARCHIVED' }]),
    cropSummaries: [{ cropAreaId: null, riskLevel: 'NORMAL' }] });
  assert.equal(dashboardCropName(dashboard, 1), 'Talhão A');
  assert.equal(dashboardCropName(dashboard, 2), 'Talhão #2');
  assert.equal(dashboardCropName(dashboard, null), 'Talhão não informado');
  assert.equal(dashboard.cropSummaries.length, 1);
});

test('known archived crops do not appear in crop summaries and no risk is inferred from their status', () => {
  const dashboard = normalizeDashboard({ ...emptyResponse(), cropAreas: page([{ id: 1, status: 'ARCHIVED' }, { id: 2, status: 'CRITICAL' }]),
    cropSummaries: [{ cropAreaId: 1, riskLevel: 'NORMAL' }, { cropAreaId: 2, riskLevel: null }] });
  assert.deepEqual(dashboard.cropSummaries.map(item => item.cropAreaId), [2]);
  assert.equal(dashboard.cropSummaries[0].riskLevel, null);
});
