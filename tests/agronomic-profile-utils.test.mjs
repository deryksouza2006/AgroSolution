import assert from 'node:assert/strict';
import test from 'node:test';
import { parseAgronomicDecimal, toAgronomicDecimalInput, toAgronomicProfileRequest, validateAgronomicProfile } from '../src/utils/agronomicProfileValidation.ts';

const values = {
  soilTexture: 'Argiloso', fieldCapacityPercent: '38', wiltingPointPercent: '18',
  rootDepthCentimeters: '40', sensorDepthCentimeters: '20', source: 'Informado pelo produtor', demo: false,
};

test('profile requires soil texture, percentages, source and a boolean demo flag', () => {
  assert.deepEqual(validateAgronomicProfile(values), {});
  for (const key of ['soilTexture', 'fieldCapacityPercent', 'wiltingPointPercent', 'source']) {
    assert.ok(validateAgronomicProfile({ ...values, [key]: ' ' })[key], key);
    assert.equal(toAgronomicProfileRequest({ ...values, [key]: '' }).valid, false);
  }
  for (const demo of [undefined, null, '', 'false', 0, 1]) assert.ok(validateAgronomicProfile({ ...values, demo }).demo);
  for (const demo of [false, true]) assert.equal(validateAgronomicProfile({ ...values, demo }).demo, undefined);
});

test('percentages accept the inclusive range 0 to 100 and reject invalid numbers', () => {
  assert.deepEqual(validateAgronomicProfile({ ...values, fieldCapacityPercent: '100', wiltingPointPercent: '0' }), {});
  assert.deepEqual(validateAgronomicProfile({ ...values, fieldCapacityPercent: '0,1', wiltingPointPercent: '0' }), {});
  for (const key of ['fieldCapacityPercent', 'wiltingPointPercent']) {
    for (const input of ['-0,001', '100.001', 'NaN', 'Infinity', '', '38x']) assert.ok(validateAgronomicProfile({ ...values, [key]: input })[key], `${key}: ${input}`);
  }
});

test('field capacity must be strictly greater than wilting point', () => {
  for (const [capacity, wilting] of [['18', '18'], ['17.999', '18'], ['0', '0'], ['100', '100']]) {
    assert.match(validateAgronomicProfile({ ...values, fieldCapacityPercent: capacity, wiltingPointPercent: wilting }).fieldCapacityPercent, /maior/);
  }
  assert.equal(validateAgronomicProfile({ ...values, fieldCapacityPercent: '18,001', wiltingPointPercent: '18.000' }).fieldCapacityPercent, undefined);
});

test('optional depths are positive when provided and blank values become null', () => {
  for (const key of ['rootDepthCentimeters', 'sensorDepthCentimeters']) {
    for (const input of ['0', '-1', '0,000', 'NaN', 'Infinity', 'abc']) assert.ok(validateAgronomicProfile({ ...values, [key]: input })[key], `${key}: ${input}`);
    for (const input of ['', ' ', '0.001', '40,5', '0.0000001']) assert.equal(validateAgronomicProfile({ ...values, [key]: input })[key], undefined);
  }
  const result = toAgronomicProfileRequest({ ...values, rootDepthCentimeters: ' ', sensorDepthCentimeters: '' });
  assert.equal(result.valid, true);
  assert.equal(result.data.rootDepthCentimeters, null);
  assert.equal(result.data.sensorDepthCentimeters, null);
});

test('decimal normalization accepts comma, dot, whitespace and leading or trailing zeros', () => {
  for (const [input, expected] of [['38,5', 38.5], ['38.5', 38.5], [' 0038,5000 ', 38.5], ['0', 0], ['100.000', 100], ['0.0000001', 0.0000001], ['-1,5', -1.5]]) {
    assert.equal(parseAgronomicDecimal(input), expected, input);
  }
});

test('decimal normalization rejects partial, grouped, nonfinite and precision-losing values', () => {
  for (const input of ['', ' ', '.', '38,', '1.000,50', '1,000.50', '1 000', '1e2', 'NaN', 'Infinity', '38abc', '0.1234567890123456789', '9007199254740993', '9'.repeat(400)]) assert.equal(parseAgronomicDecimal(input), null, input);
});

test('decimal form values round-trip small and large API numbers without exponent notation', () => {
  for (const value of [0, 38.5, 0.0000001, 1e-20, 1e21]) {
    const input = toAgronomicDecimalInput(value);
    assert.doesNotMatch(input, /e/i);
    assert.equal(parseAgronomicDecimal(input), value);
  }
});

test('soil texture and source enforce trimmed length boundaries', () => {
  assert.equal(validateAgronomicProfile({ ...values, soilTexture: 'a'.repeat(100), source: 'x'.repeat(500) }).source, undefined);
  assert.equal(validateAgronomicProfile({ ...values, soilTexture: 'a'.repeat(100) }).soilTexture, undefined);
  assert.ok(validateAgronomicProfile({ ...values, soilTexture: 'a'.repeat(101) }).soilTexture);
  assert.ok(validateAgronomicProfile({ ...values, source: 'x'.repeat(501) }).source);
});

test('request includes false explicitly, normalizes values and excludes revision or ownership fields', () => {
  const result = toAgronomicProfileRequest({ ...values, soilTexture: ' Argiloso ', source: ' Informado pelo produtor ', fieldCapacityPercent: '38,5', wiltingPointPercent: '18.25', rootDepthCentimeters: '40,5', sensorDepthCentimeters: '20.5', revision: 99, id: 8, cropAreaId: 7, ownerId: 6 });
  assert.deepEqual(result, { valid: true, data: { soilTexture: 'Argiloso', fieldCapacityPercent: 38.5, wiltingPointPercent: 18.25, rootDepthCentimeters: 40.5, sensorDepthCentimeters: 20.5, source: 'Informado pelo produtor', demo: false } });
  assert.equal(toAgronomicProfileRequest({ ...values, demo: true }).data.demo, true);
});
