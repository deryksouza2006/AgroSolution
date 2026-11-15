import assert from 'node:assert/strict';
import test from 'node:test';
import { formatArea, formatAreaUnit, formatFarmArea } from '../src/utils/numberFormatting.ts';
import { formatCoordinate, formatCropAreaDate, formatCropAreaStatus } from '../src/utils/cropAreaFormatting.ts';
import { formatActivityQuantity, formatActivityType } from '../src/utils/activityFormatting.ts';
import { formatReadingAnalysisStatus, formatReadingSource } from '../src/utils/readingFormatting.ts';
import { formatSensorCommunication, formatSensorHealth, formatSensorStatus, formatSensorType } from '../src/utils/sensorFormatting.ts';

test('missing area values never become zero and absent units are not assumed to be square meters', () => {
  for (const value of [null, undefined, '', '0', NaN, Infinity, {}]) {
    assert.equal(formatArea(value), 'Sem dados');
    assert.equal(formatFarmArea(value, 'HECTARE'), 'Sem dados');
  }
  assert.equal(formatArea(0), '0,00');
  for (const unit of [null, undefined, 'UNKNOWN']) assert.equal(formatAreaUnit(unit), 'Unidade indisponível');
});

test('missing dates never become the epoch and invalid coordinates do not display NaN', () => {
  for (const date of [null, undefined, '', 'invalid', 0]) assert.equal(formatCropAreaDate(date), 'Data indisponível');
  for (const value of [null, undefined, NaN, Infinity, '0']) assert.equal(formatCoordinate(value), 'Não informada');
  assert.equal(formatCoordinate(0), '0');
});

test('unrecognized labels cannot leak prototype objects or functions into rendered Text', () => {
  const formats = [formatCropAreaStatus, formatActivityType, formatReadingSource, formatSensorType, formatSensorStatus, formatSensorCommunication, formatSensorHealth];
  for (const format of formats) {
    for (const value of [null, undefined, 'UNKNOWN', 'toString', 'constructor', '__proto__']) {
      assert.equal(typeof format(value), 'string');
      assert.match(format(value), /indisponível|não informad/);
    }
  }
  for (const value of [null, undefined, NaN, Infinity, '0']) assert.equal(formatActivityQuantity(value, 'L'), 'Não informada');
  assert.equal(formatActivityQuantity(0, 'L'), '0 L');
});

test('technical reading states returned by the real API have readable labels without implying agronomic analysis', () => {
  assert.deepEqual(['RECORDED', 'PENDING_PUBLICATION', 'QUEUED_FOR_ANALYSIS', 'ANALYZED', 'FAILED'].map(formatReadingAnalysisStatus),
    ['Registrada', 'Aguardando publicação', 'Na fila de processamento', 'Processamento concluído', 'Falha no processamento']);
  assert.equal(formatReadingAnalysisStatus('NEW_UNKNOWN_STATE'), 'Estado técnico não reconhecido');
});
