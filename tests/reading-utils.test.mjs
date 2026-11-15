import assert from 'node:assert/strict';
import test from 'node:test';
import { localDateTimeToISO, toLocalDateTimeFields } from '../src/utils/activityValidation.ts';
import { parseReadingNumber, readingFieldsForType, toReadingRequest, validateReadingForm } from '../src/utils/readingValidation.ts';
import { formatReadingAnalysisStatus, formatReadingSource, formatReadingValue, isSimulatedReading } from '../src/utils/readingFormatting.ts';
import { classifyReadingConflict, isLatestReadingEmptyStatus } from '../src/utils/readingConflicts.ts';

const now = Date.parse('2026-11-12T15:00:00Z');
const values = { sensorId: 1, temperatureCelsius: '', airHumidityPercent: '', soilMoisturePercent: '42,75', batteryPercent: '',
  rainfallMillimeters: '', measuredDate: '', measuredTime: '', rainfallStartDate: '', rainfallStartTime: '' };
function measuredFields(instant) {
  const fields = toLocalDateTimeFields(new Date(instant).toISOString());
  return { measuredDate: fields.date, measuredTime: fields.time };
}
function rainFields(instant) {
  const fields = toLocalDateTimeFields(new Date(instant).toISOString());
  return { rainfallStartDate: fields.date, rainfallStartTime: fields.time };
}

test('readings require a positive safe sensor ID and at least one environmental measurement', () => {
  assert.deepEqual(validateReadingForm(values, 'SOIL_MOISTURE', now), {});
  for (const sensorId of [null, 0, -1, 1.5, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1]) assert.ok(validateReadingForm({ ...values, sensorId }, 'SOIL_MOISTURE', now).sensorId);
  for (const sensorType of [undefined, 'INVALID']) assert.ok(validateReadingForm(values, sensorType, now).sensorId);
  assert.ok(validateReadingForm({ ...values, soilMoisturePercent: '' }, 'WEATHER_STATION', now).measurements);
  assert.ok(validateReadingForm({ ...values, soilMoisturePercent: '', batteryPercent: '90' }, 'WEATHER_STATION', now).measurements);
});

test('each sensor type requires its main measurement and weather stations accept any environmental field', () => {
  for (const [type, field] of [['SOIL_MOISTURE', 'soilMoisturePercent'], ['TEMPERATURE', 'temperatureCelsius'], ['HUMIDITY', 'airHumidityPercent']]) {
    const input = { ...values, soilMoisturePercent: '', [field]: '0' };
    assert.deepEqual(validateReadingForm(input, type, now), {});
    assert.ok(validateReadingForm({ ...input, [field]: '', batteryPercent: '20' }, type, now)[field]);
    assert.deepEqual(readingFieldsForType(type), [field, 'batteryPercent']);
  }
  for (const field of ['temperatureCelsius', 'airHumidityPercent', 'soilMoisturePercent', 'rainfallMillimeters']) {
    const input = { ...values, soilMoisturePercent: '', [field]: '0', ...(field === 'rainfallMillimeters' ? rainFields(now - 1000) : {}) };
    assert.deepEqual(validateReadingForm(input, 'WEATHER_STATION', now), {}, field);
  }
});

test('numeric ranges include their boundaries and reject values immediately beyond them', () => {
  for (const [field, min, max] of [['temperatureCelsius', -50, 70], ['airHumidityPercent', 0, 100], ['soilMoisturePercent', 0, 100], ['batteryPercent', 0, 100]]) {
    for (const number of [String(min), String(max)]) assert.equal(validateReadingForm({ ...values, [field]: number }, 'WEATHER_STATION', now)[field], undefined);
    for (const number of [String(min - 0.001), String(max + 0.001)]) assert.ok(validateReadingForm({ ...values, [field]: number }, 'WEATHER_STATION', now)[field], `${field}: ${number}`);
  }
  assert.equal(validateReadingForm({ ...values, rainfallMillimeters: '0', ...rainFields(now - 1000) }, 'WEATHER_STATION', now).rainfallMillimeters, undefined);
  assert.ok(validateReadingForm({ ...values, rainfallMillimeters: '-0.001', ...rainFields(now - 1000) }, 'WEATHER_STATION', now).rainfallMillimeters);
});

test('decimals accept comma or dot up to three places without rounding invalid or imprecise input', () => {
  for (const [input, number] of [['25,5', 25.5], ['42.750', 42.75], ['-50', -50], [' 000.001 ', 0.001], ['0', 0], ['12,500', 12.5]]) assert.equal(parseReadingNumber(input), number, input);
  for (const input of ['', ' ', '1.0000', '0.0001', '1,2.3', '1.000,50', '1 000', '25.', '.5', '2e1', 'NaN', 'Infinity', '25abc', '9007199254740993', '9999999999999.999']) assert.equal(parseReadingNumber(input), null, input);
  for (const field of ['temperatureCelsius', 'airHumidityPercent', 'soilMoisturePercent', 'batteryPercent', 'rainfallMillimeters']) {
    assert.ok(validateReadingForm({ ...values, [field]: '1.2345', ...rainFields(now - 1000) }, 'WEATHER_STATION', now)[field]);
  }
});

test('measured date/time are optional together and reject invalid or incomplete local dates', () => {
  const request = toReadingRequest(values, 'SOIL_MOISTURE', now);
  assert.equal(request.valid, true);
  assert.equal(Object.hasOwn(request.data, 'measuredAt'), false);
  for (const fields of [{ measuredDate: '12/11/2026', measuredTime: '' }, { measuredDate: '', measuredTime: '12:00' },
    { measuredDate: '31/04/2026', measuredTime: '12:00' }, { measuredDate: '12/11/2026', measuredTime: '25:00' }]) {
    assert.ok(validateReadingForm({ ...values, ...fields }, 'SOIL_MOISTURE', now).measuredDate);
  }
});

test('measurements allow exactly five minutes ahead and reject one millisecond beyond', () => {
  for (const offset of [-1000, 0, 299999, 300000]) assert.equal(validateReadingForm({ ...values, ...measuredFields(now + offset) }, 'SOIL_MOISTURE', now).measuredTime, undefined);
  for (const offset of [300001, 360000]) assert.ok(validateReadingForm({ ...values, ...measuredFields(now + offset) }, 'SOIL_MOISTURE', now).measuredTime);
});

test('rain including zero requires a complete interval strictly before the measurement', () => {
  for (const rainfallMillimeters of ['0', '12,5']) {
    assert.ok(validateReadingForm({ ...values, rainfallMillimeters }, 'WEATHER_STATION', now).rainfallStartDate);
    assert.ok(validateReadingForm({ ...values, rainfallMillimeters, rainfallStartDate: '12/11/2026' }, 'WEATHER_STATION', now).rainfallStartTime);
    for (const offset of [0, 1, 1000]) assert.ok(validateReadingForm({ ...values, rainfallMillimeters, ...measuredFields(now), ...rainFields(now + offset) }, 'WEATHER_STATION', now).rainfallStartDate);
    assert.deepEqual(validateReadingForm({ ...values, rainfallMillimeters, ...measuredFields(now), ...rainFields(now - 1) }, 'WEATHER_STATION', now), {});
  }
  assert.ok(validateReadingForm({ ...values, ...rainFields(now - 1000) }, 'WEATHER_STATION', now).rainfallMillimeters);
});

test('rain with omitted measurement time sends the validated current instant required by the API', () => {
  const result = toReadingRequest({ ...values, rainfallMillimeters: '0', ...rainFields(now - 1000) }, 'WEATHER_STATION', now);
  assert.equal(result.valid, true);
  assert.equal(result.data.rainfallMillimeters, 0);
  assert.equal(result.data.rainfallIntervalStart, new Date(now - 1000).toISOString());
  assert.equal(result.data.measuredAt, new Date(now).toISOString());
  assert.ok(validateReadingForm({ ...values, rainfallMillimeters: '1', ...rainFields(now) }, 'WEATHER_STATION', now).rainfallStartTime);
});

test('rain respects the six integer digits accepted by the API without rounding', () => {
  const input = { ...values, rainfallMillimeters: '999999,999', ...rainFields(now - 1000) };
  assert.equal(toReadingRequest(input, 'WEATHER_STATION', now).data.rainfallMillimeters, 999999.999);
  for (const value of ['1000000', '1000000,001', '999999,9991']) {
    assert.ok(validateReadingForm({ ...input, rainfallMillimeters: value }, 'WEATHER_STATION', now).rainfallMillimeters);
  }
});

test('local measurement and rain times are converted to UTC using existing date helpers', () => {
  const previous = process.env.TZ;
  try {
    process.env.TZ = 'America/Sao_Paulo';
    const result = toReadingRequest({ ...values, rainfallMillimeters: '12,5', measuredDate: '12/11/2026', measuredTime: '12:00', rainfallStartDate: '12/11/2026', rainfallStartTime: '11:00' }, 'WEATHER_STATION', now);
    assert.equal(result.valid, true);
    assert.equal(result.data.measuredAt, '2026-11-12T15:00:00.000Z');
    assert.equal(result.data.rainfallIntervalStart, '2026-11-12T14:00:00.000Z');
    assert.equal(localDateTimeToISO('04/11/2018', '00:30'), null);
  } finally { if (previous === undefined) delete process.env.TZ; else process.env.TZ = previous; }
});

test('manual payload allows only contract fields, preserves zero and excludes incompatible measurements', () => {
  const result = toReadingRequest({ ...values, soilMoisturePercent: '0', batteryPercent: '0', temperatureCelsius: '50', source: 'DEVICE', ownerId: 9, analysisStatus: 'ANALYZED', id: 4, cropAreaId: 8 }, 'SOIL_MOISTURE', now);
  assert.deepEqual(result, { valid: true, data: { sensorId: 1, source: 'MANUAL', soilMoisturePercent: 0, batteryPercent: 0 } });
  assert.equal(toReadingRequest({ ...values, source: 'SIMULATED' }, 'SOIL_MOISTURE', now).data.source, 'MANUAL');
});

test('reading units, sources, simulation and technical processing have clear labels', () => {
  assert.equal(formatReadingValue(0, 'temperatureCelsius'), '0 °C');
  assert.equal(formatReadingValue(42.75, 'soilMoisturePercent'), '42,75 %');
  assert.equal(formatReadingValue(12.5, 'rainfallMillimeters'), '12,5 mm');
  assert.equal(formatReadingValue(null, 'batteryPercent'), 'Não informada');
  assert.deepEqual(['MANUAL', 'DEVICE', 'SIMULATED'].map(formatReadingSource), ['Manual', 'Dispositivo IoT', 'Simulada']);
  assert.equal(isSimulatedReading({ source: 'SIMULATED' }), true);
  assert.equal(isSimulatedReading({ source: 'DEVICE' }), false);
  assert.equal(formatReadingAnalysisStatus('ANALYZED'), 'Processamento concluído');
  assert.equal(formatReadingAnalysisStatus('PENDING_PUBLICATION'), 'Aguardando publicação');
  assert.equal(formatReadingAnalysisStatus('UNKNOWN'), 'Estado técnico não reconhecido');
});

test('only 404 denotes an empty latest reading and known conflict messages are classified exactly', () => {
  assert.equal(isLatestReadingEmptyStatus(404), true);
  for (const status of [undefined, 200, 400, 401, 403, 409, 500]) assert.equal(isLatestReadingEmptyStatus(status), false);
  assert.equal(classifyReadingConflict({ message: 'Cultivo arquivado' }), 'archived');
  assert.equal(classifyReadingConflict({ message: 'Somente sensores ACTIVE podem registrar leituras' }), 'inactive');
  assert.equal(classifyReadingConflict({ message: 'Leituras ANALYZED não podem ser excluídas' }), 'analyzed');
  for (const data of [null, {}, { detail: 'Cultivo arquivado' }, { message: 'Outro conflito' }, { message: 'Cultivo arquivado anteriormente' }]) assert.equal(classifyReadingConflict(data), 'unknown');
});
