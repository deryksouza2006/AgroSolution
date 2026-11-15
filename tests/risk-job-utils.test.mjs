import assert from 'node:assert/strict';
import test from 'node:test';
import { normalizeRiskJob, normalizeRiskJobPage, riskId } from '../src/utils/riskJobNormalization.ts';
import { alertStatusOf, canChangeAlert, isTerminalRiskJob, isWaitingRiskJob, riskPollingExpired, RISK_POLL_INTERVAL_MS, RISK_POLL_TIMEOUT_MS, shouldPollRiskJob } from '../src/utils/riskJobPolicy.ts';
import { formatAlertStatus, formatMoistureTrend, formatRiskJobStatus, formatRiskLevel, formatRiskMetric, formatRiskQuality, measurementOriginLabel, riskDemoLabel } from '../src/utils/riskJobFormatting.ts';

test('only the three waiting states are polled and every terminal state stops polling', () => {
  for (const status of ['PENDING', 'QUEUED', 'PROCESSING']) {
    assert.equal(isWaitingRiskJob(status), true);
    assert.equal(isTerminalRiskJob(status), false);
    assert.equal(shouldPollRiskJob(status, 100, 1000, true), true);
  }
  for (const status of ['COMPLETED_WITHOUT_AI', 'COMPLETED', 'FAILED']) {
    assert.equal(isTerminalRiskJob(status), true);
    assert.equal(shouldPollRiskJob(status, 100, 1000, true), false);
  }
  for (const status of [null, undefined, '', 'UNKNOWN', 'toString']) {
    assert.equal(isTerminalRiskJob(status), false);
    assert.equal(shouldPollRiskJob(status, 100, 1000, true), false);
  }
});

test('polling is limited to sixty seconds and never allowed off screen or while a GET is running', () => {
  assert.ok(RISK_POLL_INTERVAL_MS >= 1000 && RISK_POLL_INTERVAL_MS <= 2000);
  assert.equal(RISK_POLL_TIMEOUT_MS, 60000);
  assert.equal(riskPollingExpired(1000, 60999), false);
  assert.equal(riskPollingExpired(1000, 61000), true);
  assert.equal(shouldPollRiskJob('PROCESSING', 1000, 60999, true), true);
  for (const now of [61000, 61001, 120000]) assert.equal(shouldPollRiskJob('PROCESSING', 1000, now, true), false);
  assert.equal(shouldPollRiskJob('PROCESSING', 1000, 1500, false), false);
  assert.equal(shouldPollRiskJob('PROCESSING', 1000, 1500, true, true), false);
  assert.equal(shouldPollRiskJob('QUEUED', 1000, 80000, true), false);
});

test('risk and job labels distinguish no data, insufficient data and a normal result', () => {
  assert.deepEqual(['NORMAL', 'ATTENTION', 'CRITICAL', 'INSUFFICIENT_DATA'].map(formatRiskLevel), ['Normal', 'Atenção', 'Crítico', 'Dados insuficientes']);
  assert.equal(formatRiskLevel(null), 'Sem dados');
  assert.deepEqual(['PENDING', 'QUEUED', 'PROCESSING', 'FAILED', 'COMPLETED_WITHOUT_AI', 'COMPLETED'].map(formatRiskJobStatus), ['Pendente', 'Na fila', 'Processando', 'Falhou', 'Análise concluída', 'Orientação concluída']);
  assert.equal(formatRiskJobStatus(null), 'Sem dados');
  assert.equal(formatRiskLevel('constructor'), 'Risco indisponível');
});

test('administrative statuses, quality and trends are translated safely', () => {
  assert.deepEqual(['OPEN', 'ACKNOWLEDGED', 'RESOLVED'].map(formatAlertStatus), ['Aberto', 'Reconhecido', 'Resolvido']);
  assert.deepEqual(['COMPLETE', 'PARTIAL', 'INSUFFICIENT'].map(formatRiskQuality), ['Completa', 'Parcial', 'Insuficiente']);
  assert.deepEqual(['DRYING_FAST', 'DRYING_SLOWLY', 'RECOVERING', 'STABLE'].map(formatMoistureTrend), ['Secagem rápida', 'Secagem gradual', 'Recuperando', 'Estável']);
  for (const format of [formatAlertStatus, formatRiskQuality, formatMoistureTrend]) {
    assert.equal(format(null), 'Sem dados');
    for (const value of ['UNKNOWN', '__proto__', 'toString']) assert.equal(format(value), 'Estado não reconhecido');
  }
});

test('optional metrics are never replaced by zero and raw availability is never clamped or recalculated', () => {
  for (const value of [null, undefined, NaN, Infinity, '1', {}]) assert.equal(formatRiskMetric(value, '%'), 'Sem dados');
  assert.equal(formatRiskMetric(0, '%'), '0 %');
  assert.equal(formatRiskMetric(-2.1, '/h'), '-2,1 /h');
  const job = normalizeRiskJob({ result: { waterAvailabilityPercent: 35.5, rawAvailabilityPercent: 125.5, vpdKpa: 1.8 } });
  assert.equal(formatRiskMetric(job.result.rawAvailabilityPercent, '%'), '125,5 %');
  assert.equal(job.result.riskLevel, null);
});

test('demonstrative rules and simulated measurements are independent badges', () => {
  const job = normalizeRiskJob({ demo: true, result: { demo: true }, alert: { demo: true }, measurements: [
    { id: 1, simulated: false }, { id: 2, simulated: true }, { id: 3, simulated: null },
  ] });
  for (const demo of [job.demo, job.result.demo, job.alert.demo]) assert.equal(riskDemoLabel(demo), 'Regras demonstrativas');
  assert.equal(riskDemoLabel(false), null);
  assert.deepEqual(job.measurements.map(item => measurementOriginLabel(item.simulated)), ['Leitura real', 'Leitura simulada', 'Origem: sem dados']);
  assert.equal(normalizeRiskJob({ result: { demo: 'true' } }).result.demo, false);
});

test('null and extra fields cannot break normalized jobs or accidentally reuse ReadingResponse field names', () => {
  for (const value of [null, undefined, false, [], 1, {}]) {
    const job = normalizeRiskJob(value);
    assert.equal(job.id, null);
    assert.equal(job.status, null);
    assert.equal(job.result, null);
    assert.equal(job.alert, null);
    assert.deepEqual(job.measurements, []);
    assert.equal(job.rainfall, null);
  }
  const job = normalizeRiskJob({ id: 1, result: { riskLevel: {}, waterAvailabilityPercent: '35', rulesTriggered: [null, {}, 'LOW_WATER_AVAILABILITY'], limitations: null },
    alert: { acknowledgedBy: null, resolvedBy: null }, guidance: { unexpected: true }, measurements: [null, 'bad', { id: 2, soilMoisture: 0, airTemperature: 27, airHumidity: 60, simulated: false }, { id: 3, soilMoisturePercent: 99, temperatureCelsius: 60 }] });
  assert.equal(job.result.riskLevel, null);
  assert.equal(job.result.waterAvailabilityPercent, null);
  assert.deepEqual(job.result.rulesTriggered, ['LOW_WATER_AVAILABILITY']);
  assert.deepEqual(job.result.limitations, []);
  assert.equal(job.measurements.length, 2);
  assert.equal(job.measurements[0].soilMoisture, 0);
  assert.equal(job.measurements[0].airTemperature, 27);
  assert.equal(job.measurements[1].soilMoisture, null);
  assert.equal(job.measurements[1].airTemperature, null);
  assert.equal(job.guidance.fallback, null);
  assert.equal(Object.hasOwn(job.guidance, 'unexpected'), false);
});

test('rainfall windows preserve zero, missing totals and incomplete coverage', () => {
  const job = normalizeRiskJob({ rainfall: { last24Hours: { millimeters: 0, complete: true, limitation: null }, last7Days: { millimeters: null, complete: false, limitation: 'Cobertura parcial da janela' } } });
  assert.equal(job.rainfall.last24Hours.millimeters, 0);
  assert.equal(job.rainfall.last24Hours.complete, true);
  assert.equal(job.rainfall.last7Days.millimeters, null);
  assert.equal(job.rainfall.last7Days.complete, false);
  assert.equal(job.rainfall.last7Days.limitation, 'Cobertura parcial da janela');
});

test('only documented alert transitions are available and administrative changes never reclassify risk', () => {
  assert.equal(canChangeAlert('OPEN', 'acknowledge'), true);
  assert.equal(canChangeAlert('OPEN', 'resolve'), true);
  assert.equal(canChangeAlert('ACKNOWLEDGED', 'acknowledge'), false);
  assert.equal(canChangeAlert('ACKNOWLEDGED', 'resolve'), true);
  for (const status of ['RESOLVED', 'UNKNOWN', null, undefined]) {
    assert.equal(canChangeAlert(status, 'acknowledge'), false);
    assert.equal(canChangeAlert(status, 'resolve'), false);
  }
  assert.equal(canChangeAlert('OPEN', 'invalid'), false);
  for (const status of ['OPEN', 'ACKNOWLEDGED', 'RESOLVED']) {
    const job = normalizeRiskJob({ result: { riskLevel: 'CRITICAL', waterAvailabilityPercent: 5 }, alertStatus: status, alert: { status, level: 'NORMAL' } });
    assert.equal(alertStatusOf(job), status);
    assert.equal(job.result.riskLevel, 'CRITICAL');
    assert.equal(formatRiskLevel(job.result.riskLevel), 'Crítico');
  }
  assert.equal(alertStatusOf(normalizeRiskJob({ alertStatus: 'OPEN', alert: null })), 'OPEN');
});

test('Spring pages use number and retain valid records among partial data', () => {
  const page = normalizeRiskJobPage({ content: [null, {}, { id: 1, status: 'PROCESSING' }, { cropAreaId: 2, status: null }], number: 2, page: 99, size: 20, totalElements: 50, totalPages: 3, first: false, last: true }, 0, 20);
  assert.equal(page.number, 2);
  assert.equal(page.totalElements, 50);
  assert.equal(page.partial, true);
  assert.equal(page.content.length, 2);
  assert.equal(page.content[1].id, null);
  const missing = normalizeRiskJobPage(null, 3, 20);
  assert.equal(missing.number, 3);
  assert.equal(missing.totalElements, null);
  assert.equal(missing.partial, true);
});

test('identifiers are positive safe integers and internal diagnostic errors are not displayed', () => {
  for (const id of [null, '1', 0, -1, 1.2, Infinity, Number.MAX_SAFE_INTEGER + 1]) assert.equal(riskId(id), null);
  assert.equal(riskId(1), 1);
  assert.equal(normalizeRiskJob({ errorMessage: 'Não foi possível concluir o processamento.' }).errorMessage, 'Não foi possível concluir o processamento.');
  assert.equal(normalizeRiskJob({ errorMessage: 'java.lang.RuntimeException: internal stacktrace' }).errorMessage, null);
});
