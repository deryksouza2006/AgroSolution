import assert from 'node:assert/strict';
import test from 'node:test';
import { BRAZILIAN_STATES, isBrazilianState, parseFarmArea, toFarmRequest, validateFarmForm } from '../src/utils/farmValidation.ts';
import { formatArea, formatAreaUnit, formatFarmArea } from '../src/utils/numberFormatting.ts';

const values = { name: 'Fazenda Sol', city: 'Campinas', state: 'SP', totalArea: '25,50', areaUnit: 'HECTARE' };

test('farm requires all five fields', () => {
  assert.deepEqual(validateFarmForm(values), {});
  for (const key of Object.keys(values)) {
    assert.ok(validateFarmForm({ ...values, [key]: '' })[key], key);
    assert.equal(toFarmRequest({ ...values, [key]: '' }).valid, false);
  }
});

test('name and city validate trimmed lengths and boundaries', () => {
  for (const name of ['ab', ' '.repeat(5), 'x'.repeat(101)]) assert.ok(validateFarmForm({ ...values, name }).name);
  for (const name of ['abc', 'x'.repeat(100), '  Sol  ']) assert.equal(validateFarmForm({ ...values, name }).name, undefined);
  for (const city of [' ', 'x'.repeat(101)]) assert.ok(validateFarmForm({ ...values, city }).city);
  assert.equal(validateFarmForm({ ...values, city: 'x'.repeat(100) }).city, undefined);
});

test('all 27 Brazilian states are accepted and invalid abbreviations rejected', () => {
  assert.equal(new Set(BRAZILIAN_STATES).size, 27);
  for (const state of ['AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO']) {
    assert.equal(isBrazilianState(state), true, state);
    assert.equal(validateFarmForm({ ...values, state }).state, undefined);
  }
  assert.equal(isBrazilianState(' sp '), true);
  for (const state of ['', 'XX', 'ZZ', 'S', 'SPP', 'São Paulo', '12']) assert.equal(isBrazilianState(state), false, state);
});

test('area accepts comma or dot, integer, whitespace and up to two decimals', () => {
  for (const [input, expected] of [['25,50', 25.5], ['25.50', 25.5], ['25', 25], ['25,5', 25.5], [' 25.50 ', 25.5], ['0,01', 0.01], ['00025.50', 25.5], ['1.01', 1.01]]) {
    assert.equal(parseFarmArea(input), expected, input);
  }
});

test('area rejects zero, negatives, extra decimals and ambiguous or partial numbers without rounding', () => {
  for (const totalArea of ['0', '0,00', '-1', '-0.01', '1,001', '25.500', '1.005', '1,999', '', ' ', '1,', '.5', '+25', '1e2', 'Infinity', 'NaN', '25abc', '1.000,50', '1,000.50', '1 000', '1.2.3', '1,2,3', '90071992547409.91', '999999999999999999999999']) {
    assert.equal(parseFarmArea(totalArea), null, totalArea);
    assert.ok(validateFarmForm({ ...values, totalArea }).totalArea, totalArea);
  }
});

test('unit is required and limited to the two API values', () => {
  for (const areaUnit of ['HECTARE', 'SQUARE_METER']) assert.equal(validateFarmForm({ ...values, areaUnit }).areaUnit, undefined);
  for (const areaUnit of ['', 'hectare', 'ACRE', 'm²']) assert.ok(validateFarmForm({ ...values, areaUnit }).areaUnit);
});

test('request normalizes strings and explicitly excludes ownership and extra fields', () => {
  const result = toFarmRequest({ ...values, name: ' Fazenda Sol ', city: ' Campinas ', state: ' sp ', ownerId: 9, userId: 8, owner: {}, id: 7 });
  assert.deepEqual(result, { valid: true, data: { name: 'Fazenda Sol', city: 'Campinas', state: 'SP', totalArea: 25.5, areaUnit: 'HECTARE' } });
});

test('area and unit formatting use Brazilian notation and translated units', () => {
  assert.equal(formatAreaUnit('HECTARE'), 'hectares');
  assert.equal(formatAreaUnit('SQUARE_METER'), 'm²');
  assert.equal(formatArea(25.5), '25,50');
  assert.equal(formatArea(1234.56), '1.234,56');
  assert.equal(formatFarmArea(25.5, 'HECTARE'), '25,50 hectares');
  assert.equal(formatFarmArea(50, 'SQUARE_METER'), '50,00 m²');
});
