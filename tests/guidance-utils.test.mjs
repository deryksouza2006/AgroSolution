import assert from 'node:assert/strict';
import test from 'node:test';
import { AxiosError } from 'axios';
import { normalizeGuidance } from '../src/utils/guidanceNormalization.ts';
import { normalizeRiskJob } from '../src/utils/riskJobNormalization.ts';
import { formatGuidanceReason } from '../src/utils/guidanceFormatting.ts';
import { safeSourceUrl } from '../src/utils/safeSourceUrl.ts';
import { guidanceFailureKind, parseGuidanceError } from '../src/utils/guidanceErrors.ts';
import { attachGuidance, effectiveGuidance, emptyGuidanceLocalState, GUIDANCE_MUTATION_RETRY, GUIDANCE_REQUEST_TIMEOUT_MS, guidanceDecision, guidanceLocalAfterResponse, isValidGuidance, preserveRiskOnGuidanceRefresh } from '../src/utils/guidancePolicy.ts';

test('only explicit fallback=false confirms persisted guidance, including legacy payloads', () => {
  const valid = normalizeGuidance({ fallback: false, summary: 'Resumo' });
  const fallback = normalizeGuidance({ fallback: true, summary: 'Contingência' });
  assert.equal(isValidGuidance(valid), true);
  assert.equal(isValidGuidance(fallback), false);
  for (const flag of [undefined, null, 'false', 'true', 0, 1, {}]) {
    const legacy = normalizeGuidance({ fallback: flag, summary: 'Legado' });
    assert.equal(legacy.fallback, null);
    assert.equal(isValidGuidance(legacy), false);
    assert.equal(guidanceDecision(true, legacy, emptyGuidanceLocalState()), 'consult');
  }
  for (const missing of [null, undefined, [], false, 1, 'bad']) {
    assert.equal(normalizeGuidance(missing), null);
    assert.equal(isValidGuidance(missing === undefined ? undefined : null), false);
  }
});

test('contingency reasons use the documented explanations without inferring success', () => {
  assert.equal(formatGuidanceReason('INSUFFICIENT_CONTEXT'), 'Faltam dados para explicar esta análise. Confira as leituras e o perfil.');
  assert.equal(formatGuidanceReason('NO_RELEVANT_SOURCES'), 'Não há referências suficientes para uma orientação confiável.');
  assert.equal(formatGuidanceReason('PROVIDER_UNAVAILABLE'), 'A orientação está indisponível. O resultado da análise continua disponível.');
  for (const value of [null, 'UNKNOWN', 'toString']) assert.match(formatGuidanceReason(value), /não confirmou uma orientação válida/);
});

test('empty or invalid sources stay empty and prose/source metadata are preserved as plain strings', () => {
  for (const sources of [undefined, null, [], {}, [null, 2, {}, { title: 3 }]]) {
    assert.deepEqual(normalizeGuidance({ fallback: false, sources }).sources, []);
  }
  const source = { sourceId: 'original', title: '  Título original  ', institution: 'Instituição', version: 'v1 exata', url: 'https://example.org/source' };
  const summary = '<script>alert(1)</script> **texto** [link](javascript:alert(1))';
  const guidance = normalizeGuidance({ summary, signals: ['LOW_WATER_AVAILABILITY', null, {}], warnings: [summary], sources: [source], instruction: 'execute' });
  assert.equal(guidance.summary, summary);
  assert.deepEqual(guidance.warnings, [summary]);
  assert.deepEqual(guidance.signals, ['LOW_WATER_AVAILABILITY']);
  assert.deepEqual(guidance.sources, [source]);
  assert.equal(Object.hasOwn(guidance, 'instruction'), false);
});

test('source links require a complete HTTP(S) URL and reject executable schemes and ambiguous input', () => {
  for (const url of ['https://example.org', 'http://example.org/path?v=1#reference', 'HTTPS://example.org/source']) assert.equal(safeSourceUrl(url), url);
  for (const url of [null, undefined, 123, '', 'https://', 'https://?q=1', '//example.org', 'javascript:alert(1)', 'data:text/html,test', 'file:///etc/passwd', 'intent://example', 'https:example.org', ' https://example.org', 'https://example.org\n', 'https://example.org/a b', 'https://user:password@example.org', 'https://example.org\\@other.org', '<a href="https://example.org">']) assert.equal(safeSourceUrl(url), null);
});

test('attaching AI explanations cannot alter deterministic risk, snapshots, demo labels or alerts', () => {
  const original = normalizeRiskJob({ id: 1, demo: true, result: { riskLevel: 'CRITICAL', waterAvailabilityPercent: 4, vpdKpa: 2.5, demo: true }, alert: { level: 'CRITICAL', status: 'OPEN', demo: true }, measurements: [{ id: 2, simulated: true }], rainfall: { last24Hours: { millimeters: 0 } } });
  for (const fallback of [false, true, undefined]) {
    const guidance = normalizeGuidance({ fallback, riskLevel: 'NORMAL' });
    const combined = attachGuidance(original, guidance);
    assert.equal(combined.result, original.result);
    assert.equal(combined.result.riskLevel, 'CRITICAL');
    assert.equal(combined.alert, original.alert);
    assert.equal(combined.measurements, original.measurements);
    assert.equal(combined.rainfall, original.rainfall);
    assert.equal(combined.demo, true);
    assert.equal(combined.guidance.riskLevel, 'NORMAL');
  }
  assert.equal(original.guidance, null);
  const refreshed = preserveRiskOnGuidanceRefresh(original, normalizeRiskJob({ id: 1, guidance: null }));
  assert.equal(refreshed.demo, true);
  assert.equal(refreshed.result, original.result);
  assert.equal(refreshed.alert, original.alert);
  assert.equal(refreshed.measurements, original.measurements);
  assert.equal(refreshed.rainfall, original.rainfall);
});

test('generation is explicit and requires a result; persisted guidance is shown without another POST', () => {
  const empty = emptyGuidanceLocalState();
  const fallback = normalizeGuidance({ fallback: true });
  const valid = normalizeGuidance({ fallback: false });
  assert.equal(guidanceDecision(false, null, empty), 'wait');
  assert.equal(guidanceDecision(true, null, empty), 'generate');
  assert.equal(guidanceDecision(true, fallback, empty), 'retry');
  assert.equal(guidanceDecision(false, fallback, empty), 'wait');
  assert.equal(guidanceDecision(true, valid, empty), 'show');
  assert.equal(guidanceDecision(true, valid, { ...empty, uncertain: true, needsUpdate: true }), 'show');
  assert.equal(guidanceDecision(true, null, { ...empty, response: valid }), 'show');
  assert.equal(effectiveGuidance(valid, { ...empty, response: fallback }), valid);
});

test('timeout, disconnected network and 5xx keep the request uncertain and require GET before another explicit POST', () => {
  assert.equal(GUIDANCE_REQUEST_TIMEOUT_MS, 180000);
  assert.equal(GUIDANCE_MUTATION_RETRY, false);
  const failure = (status) => new AxiosError('failed', status ? 'ERR_BAD_RESPONSE' : 'ECONNABORTED', undefined, undefined, status ? { status, data: {} } : undefined);
  for (const error of [failure(), new AxiosError('Network Error', 'ERR_NETWORK'), failure(500), failure(503)]) {
    assert.equal(guidanceFailureKind(error), 'uncertain');
    assert.match(parseGuidanceError(error), /Consultar atualização/);
    const local = { ...emptyGuidanceLocalState(), uncertain: true, needsUpdate: true };
    assert.equal(guidanceDecision(true, null, local), 'consult');
    const persisted = normalizeGuidance({ fallback: false });
    assert.equal(guidanceDecision(true, null, guidanceLocalAfterResponse(local, persisted, true, true)), 'show');
    assert.equal(guidanceDecision(true, null, guidanceLocalAfterResponse(local, null, true, true)), 'generate');
  }
  assert.equal(guidanceFailureKind(failure(409)), 'conflict');
  assert.match(parseGuidanceError(failure(409)), /ainda não terminou/);
  assert.equal(guidanceFailureKind(failure(404)), 'unavailable');
  assert.match(parseGuidanceError(failure(404)), /indisponível/);
  for (const status of [401, 403]) assert.equal(guidanceFailureKind(failure(status)), 'unavailable');
});

test('local fallback survives GET guidance=null, query errors and legacy data until valid guidance arrives', () => {
  const fallback = normalizeGuidance({ fallback: true, reason: 'PROVIDER_UNAVAILABLE', summary: 'Contingência' });
  let local = guidanceLocalAfterResponse(emptyGuidanceLocalState(), fallback, true);
  assert.equal(guidanceDecision(true, null, local), 'retry');
  local = guidanceLocalAfterResponse(local, null, true, true);
  assert.equal(effectiveGuidance(null, local), fallback);
  assert.equal(guidanceDecision(true, null, local), 'retry');
  local = { ...local, uncertain: true, needsUpdate: true, error: 'Sem conexão' };
  assert.equal(effectiveGuidance(null, local), fallback);
  assert.equal(guidanceDecision(true, null, local), 'consult');
  local = guidanceLocalAfterResponse(local, normalizeGuidance({ summary: 'Legado' }), true, true);
  assert.equal(local.response, fallback);
  const valid = normalizeGuidance({ fallback: false, summary: 'Orientação persistida' });
  local = guidanceLocalAfterResponse(local, valid, true);
  assert.equal(effectiveGuidance(null, local), valid);
  assert.equal(guidanceDecision(true, null, local), 'show');
  local = guidanceLocalAfterResponse(local, fallback, true, true);
  assert.equal(effectiveGuidance(null, local), valid);
});

test('missing POST guidance and unfinished analysis remain consult-only without generation loops', () => {
  const missing = guidanceLocalAfterResponse(emptyGuidanceLocalState(), null, true);
  assert.equal(missing.uncertain, true);
  assert.equal(guidanceDecision(true, null, missing), 'consult');
  const unfinished = guidanceLocalAfterResponse(missing, null, false, true);
  assert.equal(unfinished.blocked, true);
  assert.equal(guidanceDecision(true, null, unfinished), 'consult');
  const completed = guidanceLocalAfterResponse(unfinished, null, true, true);
  assert.equal(guidanceDecision(true, null, completed), 'generate');
});
