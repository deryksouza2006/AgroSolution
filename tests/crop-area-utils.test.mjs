import assert from 'node:assert/strict';
import test from 'node:test';
import { parseCropNumber, toCropAreaRequest, validateCropAreaForm } from '../src/utils/cropAreaValidation.ts';
import { formatCoordinate, formatCropAreaDate, formatCropAreaStatus } from '../src/utils/cropAreaFormatting.ts';
import { classifyCropAreaDeleteConflict, isCropAreaCapacityConflict } from '../src/utils/cropAreaConflicts.ts';
import { formatAreaUnit, formatFarmArea } from '../src/utils/numberFormatting.ts';

const values = { farmId: 1, name: 'Talhão A', cropType: 'Milho', areaSize: '1,50', areaUnit: 'HECTARE', latitude: '', longitude: '', description: '' };

test('crop area requires a positive safe farm ID and all mandatory fields', () => {
  assert.deepEqual(validateCropAreaForm(values), {});
  for (const farmId of [null, 0, -1, 1.5, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1]) assert.ok(validateCropAreaForm({ ...values, farmId }).farmId);
  for (const key of ['name', 'cropType', 'areaSize', 'areaUnit']) {
    assert.ok(validateCropAreaForm({ ...values, [key]: '' })[key]);
    assert.equal(toCropAreaRequest({ ...values, [key]: '' }).valid, false);
  }
});

test('name, crop and description enforce their length boundaries', () => {
  for (const name of ['ab', ' ', 'a'.repeat(121)]) assert.ok(validateCropAreaForm({ ...values, name }).name);
  for (const name of ['abc', 'a'.repeat(120), '  Talhão A  ']) assert.equal(validateCropAreaForm({ ...values, name }).name, undefined);
  for (const cropType of ['a', ' ', 'a'.repeat(81)]) assert.ok(validateCropAreaForm({ ...values, cropType }).cropType);
  for (const cropType of ['ab', 'a'.repeat(80)]) assert.equal(validateCropAreaForm({ ...values, cropType }).cropType, undefined);
  assert.equal(validateCropAreaForm({ ...values, description: 'x'.repeat(500) }).description, undefined);
  assert.ok(validateCropAreaForm({ ...values, description: 'x'.repeat(501) }).description);
});

test('coordinates must be supplied together or both left blank', () => {
  for (const pair of [{ latitude: '-23,550520', longitude: '' }, { latitude: '', longitude: '-46.633308' }]) {
    const errors = validateCropAreaForm({ ...values, ...pair });
    assert.ok(errors.latitude);
    assert.ok(errors.longitude);
  }
  assert.deepEqual(validateCropAreaForm({ ...values, latitude: ' ', longitude: ' ' }), {});
  assert.deepEqual(validateCropAreaForm({ ...values, latitude: '0', longitude: '0' }), {});
});

test('geographic limits are inclusive and coordinates allow six decimal places', () => {
  for (const latitude of ['-90', '90', '90,000000', '-23.550520', '0,000001']) {
    assert.equal(validateCropAreaForm({ ...values, latitude, longitude: '180' }).latitude, undefined, latitude);
  }
  for (const longitude of ['-180', '180', '-180.000000', '-46,633308']) {
    assert.equal(validateCropAreaForm({ ...values, latitude: '90', longitude }).longitude, undefined, longitude);
  }
  for (const latitude of ['-90.000001', '90,000001', '23.1234567', '1e1', 'NaN']) assert.ok(validateCropAreaForm({ ...values, latitude, longitude: '0' }).latitude, latitude);
  for (const longitude of ['-180,000001', '180.000001', '46,1234567', 'Infinity']) assert.ok(validateCropAreaForm({ ...values, latitude: '0', longitude }).longitude, longitude);
});

test('decimal conversion accepts comma or dot without rounding invalid values', () => {
  for (const [input, decimals, expected] of [['1,50', 2, 1.5], ['1.50', 2, 1.5], ['-23,550520', 6, -23.55052], ['-46.633308', 6, -46.633308], ['0,000001', 6, 0.000001], [' 001.01 ', 2, 1.01]]) {
    assert.equal(parseCropNumber(input, decimals), expected);
  }
  for (const input of ['1,001', '1.005', '1.500', '1.000,50', '1,000.50', '1e2', '1,', 'NaN', 'Infinity', '90071992547409.91']) assert.equal(parseCropNumber(input, 2), null, input);
  assert.equal(parseCropNumber('0.0000001', 6), null);
});

test('area must be positive and use at most two decimal places', () => {
  for (const areaSize of ['0', '0,00', '-1.5', '1.001', '1,999', '', ' ', '1.2.3']) assert.ok(validateCropAreaForm({ ...values, areaSize }).areaSize, areaSize);
  for (const areaSize of ['0,01', '1.50', '1,50', '20']) assert.equal(validateCropAreaForm({ ...values, areaSize }).areaSize, undefined);
});

test('request permits only API fields and normalizes optional values', () => {
  const input = { ...values, name: ' Talhão A ', cropType: ' Milho ', description: ' Cultivo irrigado ', latitude: '-23,550520', longitude: '-46.633308', status: 'CRITICAL', ownerId: 9, userId: 8, farmName: 'Extra' };
  assert.deepEqual(toCropAreaRequest(input), { valid: true, data: {
    farmId: 1, name: 'Talhão A', cropType: 'Milho', areaSize: 1.5, areaUnit: 'HECTARE',
    latitude: -23.55052, longitude: -46.633308, description: 'Cultivo irrigado',
  } });
  const request = toCropAreaRequest(values);
  assert.equal(request.valid, true);
  assert.equal(request.data.latitude, null);
  assert.equal(request.data.longitude, null);
  assert.equal(request.data.description, null);
});

test('units and all backend statuses have translated labels', () => {
  assert.equal(formatAreaUnit('HECTARE'), 'hectares');
  assert.equal(formatAreaUnit('SQUARE_METER'), 'm²');
  assert.equal(formatFarmArea(1.5, 'HECTARE'), '1,50 hectares');
  for (const [status, label] of Object.entries({ NORMAL: 'Normal', ATTENTION: 'Atenção', CRITICAL: 'Crítico', ARCHIVED: 'Arquivado' })) assert.equal(formatCropAreaStatus(status), label);
  assert.equal(formatCoordinate(null), 'Não informada');
  assert.equal(formatCoordinate(-23.55052), '-23,55052');
  assert.equal(formatCropAreaDate('invalid'), 'Data indisponível');
});

test('only supported area units pass validation', () => {
  for (const areaUnit of ['HECTARE', 'SQUARE_METER']) assert.equal(validateCropAreaForm({ ...values, areaUnit }).areaUnit, undefined);
  for (const areaUnit of ['', 'ACRE', 'm²', 'hectare']) assert.ok(validateCropAreaForm({ ...values, areaUnit }).areaUnit);
});

test('deletion conflicts use only the exact API message, including history-first responses', () => {
  assert.equal(classifyCropAreaDeleteConflict({ message: 'Não é possível excluir área de cultivo com sensores vinculados' }), 'sensors');
  assert.equal(classifyCropAreaDeleteConflict({ message: 'Cultivo com histórico deve ser arquivado' }), 'history');
  for (const response of [null, {}, { code: 'HISTORY' }, { detail: 'Cultivo com histórico deve ser arquivado' }, { message: 'Conflito desconhecido' }, { message: 'Outro conflito com sensores e histórico' }]) assert.equal(classifyCropAreaDeleteConflict(response), 'unknown');
});

test('capacity conflicts require a capacity or area message; unknown conflicts stay generic', () => {
  for (const message of ['A soma das áreas ultrapassa a área da propriedade', 'Capacidade da propriedade excedida', 'Área total dos talhões maior que a área da propriedade']) assert.equal(isCropAreaCapacityConflict({ message }), true, message);
  for (const response of [{ message: 'Conflito desconhecido' }, { message: 'Cultivo com histórico deve ser arquivado' }, { message: 'Não é possível excluir área de cultivo com sensores vinculados' }, { detail: 'Capacidade excedida' }, {}]) assert.equal(isCropAreaCapacityConflict(response), false);
});
