import assert from 'node:assert/strict';
import test from 'node:test';
import { normalizeDeviceCode, parseSensorInstallationDate, sensorDateToInput, toSensorCreateRequest, toSensorUpdateRequest, validateSensorForm } from '../src/utils/sensorValidation.ts';
import { formatSensorCommunication, formatSensorHealth, formatSensorStatus, formatSensorType, interpretSensorHealth } from '../src/utils/sensorFormatting.ts';
import { classifySensorConflict } from '../src/utils/sensorConflicts.ts';

const now = new Date(2026, 10, 12, 0, 1);
const values = { cropAreaId: 1, name: 'Sensor do solo', deviceCode: ' solo-001 ', sensorType: 'SOIL_MOISTURE', status: 'ACTIVE', installationDate: '12/11/2026', description: '' };
const health = { sensorId: 1, communicationStatus: 'RECENT', lastMeasuredAt: '2026-11-12T01:00:00Z', ageSeconds: 300,
  policy: 'DEMO: política do servidor', batteryPercent: 92, administrativeStatus: 'ACTIVE', calibratedAt: null, maintenanceNote: null, calculatedHealth: 'HEALTHY' };

test('sensor form requires a positive integer crop area, valid name, code and type', () => {
  assert.deepEqual(validateSensorForm(values, false, now), {});
  for (const cropAreaId of [null, 0, -1, 1.5, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1]) assert.ok(validateSensorForm({ ...values, cropAreaId }, false, now).cropAreaId);
  for (const name of ['', '  ', 'ab', 'x'.repeat(101)]) assert.ok(validateSensorForm({ ...values, name }, false, now).name);
  for (const name of [' abc ', 'x'.repeat(100)]) assert.equal(validateSensorForm({ ...values, name }, false, now).name, undefined);
  for (const deviceCode of ['', ' ', 'ab', 'x'.repeat(81)]) assert.ok(validateSensorForm({ ...values, deviceCode }, false, now).deviceCode);
  for (const deviceCode of ['abc', 'x'.repeat(80)]) assert.equal(validateSensorForm({ ...values, deviceCode }, false, now).deviceCode, undefined);
  for (const sensorType of ['', 'soil_moisture', 'UNKNOWN']) assert.ok(validateSensorForm({ ...values, sensorType }, false, now).sensorType);
  for (const sensorType of ['SOIL_MOISTURE', 'TEMPERATURE', 'HUMIDITY', 'WEATHER_STATION']) assert.equal(validateSensorForm({ ...values, sensorType }, false, now).sensorType, undefined);
});

test('device codes are trimmed and normalized to uppercase', () => {
  assert.equal(normalizeDeviceCode(' solo-Abc-001 '), 'SOLO-ABC-001');
  assert.equal(toSensorCreateRequest(values, now).data.deviceCode, 'SOLO-001');
});

test('create allows only contract fields and never sends an administrative status', () => {
  const result = toSensorCreateRequest({ ...values, status: 'FAULT', ownerId: 9, userId: 7, id: 8, farmId: 10, name: ' Sensor do solo ', description: ' Irrigado ' }, now);
  assert.deepEqual(result, { valid: true, data: { cropAreaId: 1, name: 'Sensor do solo', deviceCode: 'SOLO-001', sensorType: 'SOIL_MOISTURE', installationDate: '2026-11-12', description: 'Irrigado' } });
  const noDate = toSensorCreateRequest({ ...values, installationDate: ' ', description: ' ' }, now);
  assert.equal(noDate.valid, true);
  assert.equal(Object.hasOwn(noDate.data, 'installationDate'), false);
  assert.equal(noDate.data.description, null);
});

test('update preserves an omitted or unchanged code, supports transfer and includes a valid status', () => {
  for (const deviceCode of ['', ' ', 'solo-001', ' SOLO-001 ']) {
    const result = toSensorUpdateRequest({ ...values, deviceCode, cropAreaId: 2, status: 'MAINTENANCE', ownerId: 9 }, 'SOLO-001', now);
    assert.equal(result.valid, true);
    assert.equal(Object.hasOwn(result.data, 'deviceCode'), false);
    assert.equal(Object.hasOwn(result.data, 'ownerId'), false);
    assert.equal(result.data.cropAreaId, 2);
    assert.equal(result.data.status, 'MAINTENANCE');
  }
  assert.equal(toSensorUpdateRequest({ ...values, deviceCode: 'novo-002' }, 'SOLO-001', now).data.deviceCode, 'NOVO-002');
  assert.equal(toSensorUpdateRequest({ ...values, deviceCode: 'x' }, 'SOLO-001', now).valid, false);
  for (const status of ['ACTIVE', 'INACTIVE', 'FAULT', 'MAINTENANCE']) assert.equal(validateSensorForm({ ...values, status }, true, now).status, undefined);
  for (const status of ['', 'ARCHIVED', 'UNKNOWN']) assert.ok(validateSensorForm({ ...values, status }, true, now).status);
});

test('installation date validates the calendar and uses a date without timezone conversion', () => {
  assert.equal(parseSensorInstallationDate('29/02/2024'), '2024-02-29');
  assert.equal(parseSensorInstallationDate('12/11/2026'), '2026-11-12');
  assert.equal(sensorDateToInput('2026-11-12'), '12/11/2026');
  for (const date of ['29/02/2025', '31/04/2026', '00/11/2026', '12/00/2026', '12/13/2026', '2026-11-12', '1/1/2026', '12/11/2026x']) assert.equal(parseSensorInstallationDate(date), null, date);
  assert.equal(sensorDateToInput('2026-11-12T00:00:00Z'), '');
});

test('installation rejects future dates while allowing today and blank in create or edit', () => {
  for (const editing of [false, true]) {
    for (const installationDate of ['', ' ', '11/11/2026', '12/11/2026']) assert.equal(validateSensorForm({ ...values, installationDate }, editing, now).installationDate, undefined);
    for (const installationDate of ['13/11/2026', '01/01/2027', '31/04/2026']) assert.ok(validateSensorForm({ ...values, installationDate }, editing, now).installationDate);
  }
  assert.equal(toSensorCreateRequest({ ...values, installationDate: '13/11/2026' }, now).valid, false);
  assert.equal(toSensorUpdateRequest({ ...values, installationDate: '13/11/2026' }, 'SOLO-001', now).valid, false);
});

test('installation compares against the device local date rather than the UTC date', () => {
  const previous = process.env.TZ;
  try {
    process.env.TZ = 'America/Sao_Paulo';
    const localToday = new Date('2026-11-13T01:00:00Z');
    assert.equal(validateSensorForm({ ...values, installationDate: '12/11/2026' }, false, localToday).installationDate, undefined);
    assert.ok(validateSensorForm({ ...values, installationDate: '13/11/2026' }, false, localToday).installationDate);
    process.env.TZ = 'Asia/Tokyo';
    assert.equal(validateSensorForm({ ...values, installationDate: '13/11/2026' }, false, localToday).installationDate, undefined);
  } finally { if (previous === undefined) delete process.env.TZ; else process.env.TZ = previous; }
});

test('description is optional and limited to 500 characters', () => {
  assert.equal(validateSensorForm({ ...values, description: 'x'.repeat(500) }, false, now).description, undefined);
  assert.ok(validateSensorForm({ ...values, description: 'x'.repeat(501) }, false, now).description);
});

test('sensor type, administrative status, communication and health have Portuguese labels', () => {
  assert.deepEqual(['SOIL_MOISTURE', 'TEMPERATURE', 'HUMIDITY', 'WEATHER_STATION'].map(formatSensorType), ['Umidade do solo', 'Temperatura', 'Umidade do ar', 'Estação meteorológica']);
  assert.deepEqual(['ACTIVE', 'INACTIVE', 'FAULT', 'MAINTENANCE'].map(formatSensorStatus), ['Ativo', 'Inativo', 'Falha', 'Manutenção']);
  assert.deepEqual(['RECENT', 'STALE', 'OFFLINE', 'INVALID_TIMESTAMP'].map(formatSensorCommunication), ['Comunicação recente', 'Comunicação desatualizada', 'Offline', 'Data/hora inválida']);
  assert.deepEqual(['HEALTHY', 'STALE', 'OFFLINE', 'POSSIBLE_FAULT', 'INSUFFICIENT_DATA'].map(formatSensorHealth), ['Saudável', 'Dados desatualizados', 'Offline', 'Possível falha', 'Dados insuficientes']);
});

test('health interpretation keeps independent server states and preserves zero battery and age', () => {
  const result = interpretSensorHealth({ ...health, administrativeStatus: 'INACTIVE', communicationStatus: 'OFFLINE', calculatedHealth: 'HEALTHY', batteryPercent: 0, ageSeconds: 0 });
  assert.equal(result.administrativeStatus, 'Inativo');
  assert.equal(result.communication, 'Offline');
  assert.equal(result.calculatedHealth, 'Saudável');
  assert.equal(result.battery, '0%');
  assert.equal(result.ageSeconds, 0);
  assert.equal(result.policy, health.policy);
  assert.equal(interpretSensorHealth({ ...health, communicationStatus: 'INVALID_TIMESTAMP', calculatedHealth: 'POSSIBLE_FAULT' }).calculatedHealth, 'Possível falha');
});

test('health supports no readings without inventing measurements or recalculating the diagnosis', () => {
  for (const calculatedHealth of ['INSUFFICIENT_DATA', 'OFFLINE']) {
    const result = interpretSensorHealth({ ...health, communicationStatus: 'OFFLINE', calculatedHealth, lastMeasuredAt: null, ageSeconds: null,
      batteryPercent: null, calibratedAt: null, maintenanceNote: null, policy: null });
    assert.equal(result.calculatedHealth, formatSensorHealth(calculatedHealth));
    assert.equal(result.communication, 'Offline');
    assert.equal(result.lastMeasuredAt, null);
    assert.equal(result.ageSeconds, null);
    assert.equal(result.battery, 'Não informada');
    assert.equal(result.calibratedAt, null);
    assert.equal(result.maintenanceNote, 'Não informada');
    assert.match(result.policy, /demonstrativa/);
  }
  for (const batteryPercent of [-1, 101, Infinity, NaN]) assert.equal(interpretSensorHealth({ ...health, batteryPercent }).battery, 'Não informada');
  for (const ageSeconds of [-1, Infinity, NaN]) assert.equal(interpretSensorHealth({ ...health, ageSeconds }).ageSeconds, null);
});

test('only the two documented conflict messages receive a specific classification', () => {
  assert.equal(classifySensorConflict({ message: 'Código de dispositivo já cadastrado' }), 'duplicate-code');
  assert.equal(classifySensorConflict({ message: 'Não é possível excluir sensor com leituras vinculadas' }), 'linked-readings');
  for (const data of [null, '', {}, { message: 'Conflito desconhecido' }, { detail: 'Código de dispositivo já cadastrado' }, { message: 'Outra falha com leituras' }]) assert.equal(classifySensorConflict(data), 'unknown');
});
