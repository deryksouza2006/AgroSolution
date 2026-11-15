import assert from 'node:assert/strict';
import test from 'node:test';
import { localDateTimeToISO, parseActivityQuantity, toActivityFilters, toActivityRequest, toLocalDateTimeFields, validateActivityForm } from '../src/utils/activityValidation.ts';
import { formatActivityQuantity, formatActivityType } from '../src/utils/activityFormatting.ts';

const now = Date.parse('2026-11-12T12:00:00Z');
const values = { type: 'IRRIGATION', date: '11/11/2026', time: '09:00', description: '', quantity: '', unit: '' };
function inTimezone(timezone, run) {
  const previous = process.env.TZ;
  process.env.TZ = timezone;
  try { return run(); } finally {
    if (previous === undefined) delete process.env.TZ;
    else process.env.TZ = previous;
  }
}

test('activity validates type, optional lengths and the request allowlist', () => inTimezone('UTC', () => {
  assert.deepEqual(validateActivityForm(values, now), {});
  for (const type of ['', 'OTHER', 'irrigation']) assert.ok(validateActivityForm({ ...values, type }, now).type);
  assert.equal(validateActivityForm({ ...values, description: 'x'.repeat(2000) }, now).description, undefined);
  assert.ok(validateActivityForm({ ...values, description: 'x'.repeat(2001) }, now).description);
  assert.ok(validateActivityForm({ ...values, quantity: '1', unit: 'x'.repeat(31) }, now).unit);
  assert.equal(validateActivityForm({ ...values, quantity: '1', unit: 'x'.repeat(30) }, now).unit, undefined);
  assert.deepEqual(toActivityRequest({ ...values, quantity: '100,000', unit: ' L ', description: ' Irrigação ', source: 'OTHER', authorId: 1, cropAreaId: 2 }, now), {
    valid: true, data: { type: 'IRRIGATION', performedAt: '2026-11-11T09:00:00.000Z', description: 'Irrigação', quantity: 100, unit: 'L' },
  });
}));

test('quantity and unit are supplied together or both omitted', () => inTimezone('UTC', () => {
  for (const pair of [{ quantity: '1', unit: '' }, { quantity: '', unit: 'L' }, { quantity: ' ', unit: 'kg' }]) {
    const errors = validateActivityForm({ ...values, ...pair }, now);
    assert.ok(errors.quantity);
    assert.ok(errors.unit);
  }
  const request = toActivityRequest({ ...values, quantity: ' ', unit: ' ' }, now);
  assert.equal(request.valid, true);
  assert.equal(request.data.quantity, null);
  assert.equal(request.data.unit, null);
  assert.equal(request.data.description, null);
}));

test('quantity accepts comma or dot with up to three decimals without rounding', () => {
  for (const [input, expected] of [['100.000', 100], ['100,000', 100], ['0,001', 0.001], ['1.005', 1.005], [' 0001,500 ', 1.5]]) assert.equal(parseActivityQuantity(input), expected, input);
  for (const input of ['', '0', '0,000', '-1', '+1', '1.0000', '1,2345', '1.000,50', '1,000.50', '1e3', 'NaN', 'Infinity', '9007199254740.991']) assert.equal(parseActivityQuantity(input), null, input);
});

test('activity quantity respects the real API limit of eleven integer digits', () => inTimezone('UTC', () => {
  for (const input of ['99999999999.999', '99999999999,999', '00099999999999.999']) {
    assert.equal(parseActivityQuantity(input), 99999999999.999);
    assert.equal(toActivityRequest({ ...values, quantity: input, unit: 'L' }, now).valid, true);
  }
  for (const input of ['100000000000', '100000000000.001', '000100000000000', '9999999999999']) {
    assert.equal(parseActivityQuantity(input), null);
    const result = toActivityRequest({ ...values, quantity: input, unit: 'L' }, now);
    assert.equal(result.valid, false);
    assert.match(result.errors.quantity, /11 dígitos inteiros/);
  }
}));

test('calendar validation rejects overflow and invalid time fields', () => {
  for (const date of ['', '31/02/2026', '29/02/2026', '31/04/2026', '00/11/2026', '12/13/2026', '2026-11-12']) assert.equal(localDateTimeToISO(date, '09:00'), null, date);
  for (const time of ['', '24:00', '12:60', '12:00:60', '9:00', '12:00:00.1234']) assert.equal(localDateTimeToISO('12/11/2026', time), null, time);
  inTimezone('UTC', () => assert.equal(localDateTimeToISO('29/02/2024', '09:00'), '2024-02-29T09:00:00.000Z'));
});

test('local date and time convert to UTC with real device timezones', () => {
  const cases = [['America/Sao_Paulo', '2026-11-12T12:00:00.000Z'], ['UTC', '2026-11-12T09:00:00.000Z'], ['Asia/Kolkata', '2026-11-12T03:30:00.000Z']];
  for (const [zone, expected] of cases) inTimezone(zone, () => {
    assert.equal(localDateTimeToISO('12/11/2026', '09:00'), expected);
    const fields = toLocalDateTimeFields(expected);
    assert.deepEqual(fields, { date: '12/11/2026', time: '09:00:00' });
    assert.equal(localDateTimeToISO(fields.date, fields.time), expected);
  });
});

test('conversion preserves seconds, milliseconds, and UTC day rollover', () => inTimezone('America/Sao_Paulo', () => {
  assert.equal(localDateTimeToISO('12/11/2026', '23:59:01.125'), '2026-11-13T02:59:01.125Z');
  assert.deepEqual(toLocalDateTimeFields('2026-11-13T02:59:01.125Z'), { date: '12/11/2026', time: '23:59:01.125' });
}));

test('future activities are rejected, including one millisecond ahead', () => inTimezone('UTC', () => {
  assert.equal(validateActivityForm({ ...values, date: '12/11/2026', time: '12:00' }, now).date, undefined);
  assert.equal(validateActivityForm({ ...values, date: '12/11/2026', time: '11:59:59.999' }, now).date, undefined);
  for (const future of [{ date: '12/11/2026', time: '12:00:00.001' }, { date: '13/11/2026', time: '00:00' }]) {
    const input = { ...values, ...future };
    assert.ok(validateActivityForm(input, now).date);
    assert.ok(validateActivityForm(input, now).time);
    assert.equal(toActivityRequest(input, now).valid, false);
  }
}));

test('filters allow open periods and reject from later than to', () => inTimezone('UTC', () => {
  assert.deepEqual(toActivityFilters({ type: '', fromDate: '', toDate: '' }), { valid: true, data: {} });
  assert.deepEqual(toActivityFilters({ type: 'HARVEST', fromDate: '12/11/2026', toDate: '' }), { valid: true, data: { type: 'HARVEST', from: '2026-11-12T00:00:00.000Z' } });
  assert.deepEqual(toActivityFilters({ type: '', fromDate: '', toDate: '12/11/2026' }), { valid: true, data: { to: '2026-11-12T23:59:59.999Z' } });
  assert.equal(toActivityFilters({ type: '', fromDate: '13/11/2026', toDate: '12/11/2026' }).valid, false);
  assert.equal(toActivityFilters({ type: '', fromDate: '31/02/2026', toDate: '' }).valid, false);
  assert.equal(toActivityFilters({ type: 'OTHER', fromDate: '', toDate: '' }).valid, false);
}));

test('filter dates cover full local days rather than UTC calendar days', () => inTimezone('America/Sao_Paulo', () => {
  assert.deepEqual(toActivityFilters({ type: '', fromDate: '12/11/2026', toDate: '12/11/2026' }), { valid: true, data: { from: '2026-11-12T03:00:00.000Z', to: '2026-11-13T02:59:59.999Z' } });
}));

test('DST gaps are rejected and period lengths follow the actual local day', () => inTimezone('America/New_York', () => {
  assert.equal(localDateTimeToISO('08/03/2026', '02:30'), null);
  assert.equal(localDateTimeToISO('01/11/2026', '01:30'), '2026-11-01T05:30:00.000Z');
  for (const [day, hours] of [['08/03/2026', 23], ['01/11/2026', 25]]) {
    const result = toActivityFilters({ type: '', fromDate: day, toDate: day });
    assert.equal(result.valid, true);
    assert.equal(Date.parse(result.data.to) - Date.parse(result.data.from) + 1, hours * 60 * 60 * 1000);
  }
}));

test('historical days with no midnight remain available as filter periods', () => inTimezone('America/Sao_Paulo', () => {
  assert.equal(localDateTimeToISO('04/11/2018', '00:30'), null);
  const result = toActivityFilters({ type: '', fromDate: '04/11/2018', toDate: '04/11/2018' });
  assert.equal(result.valid, true);
  assert.equal(result.data.from, '2018-11-04T03:00:00.000Z');
  assert.equal(Date.parse(result.data.to) - Date.parse(result.data.from) + 1, 23 * 60 * 60 * 1000);
}));

test('activity labels and quantities use Portuguese without changing user units', () => {
  for (const [type, label] of Object.entries({ IRRIGATION: 'Irrigação', FERTILIZATION: 'Fertilização', PLANTING: 'Plantio', HARVEST: 'Colheita' })) assert.equal(formatActivityType(type), label);
  assert.equal(formatActivityQuantity(1.005, 'kg'), '1,005 kg');
  assert.equal(formatActivityQuantity(null, null), 'Não informada');
});
