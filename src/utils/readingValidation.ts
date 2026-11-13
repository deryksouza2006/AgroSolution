import type { MeasurementField, ReadingFormErrors, ReadingFormValues, ReadingRequest } from '../types/reading';
import type { SensorType } from '../types/sensor';
import { localDateTimeToISO } from './activityValidation.ts';
import { parseCropNumber } from './cropAreaValidation.ts';

export const READING_MEASUREMENTS: readonly MeasurementField[] = ['temperatureCelsius', 'airHumidityPercent', 'soilMoisturePercent', 'rainfallMillimeters', 'batteryPercent'];
export const parseReadingNumber = (input: string) => parseCropNumber(input, 3);
export function readingFieldsForType(type: SensorType | undefined): readonly MeasurementField[] {
  switch (type) {
    case 'SOIL_MOISTURE': return ['soilMoisturePercent', 'batteryPercent'];
    case 'TEMPERATURE': return ['temperatureCelsius', 'batteryPercent'];
    case 'HUMIDITY': return ['airHumidityPercent', 'batteryPercent'];
    case 'WEATHER_STATION': return READING_MEASUREMENTS;
    default: return [];
  }
}
export function validateReadingForm(values: ReadingFormValues, type: SensorType | undefined, now = Date.now()): ReadingFormErrors {
  const errors: ReadingFormErrors = {};
  if (values.sensorId === null || !Number.isSafeInteger(values.sensorId) || values.sensorId <= 0 || !readingFieldsForType(type).length) errors.sensorId = 'Selecione um sensor válido.';
  const fields = readingFieldsForType(type);
  const environmental = fields.filter(key => key !== 'batteryPercent');
  if (!environmental.some(key => values[key].trim())) errors.measurements = 'Informe pelo menos uma medição ambiental; a bateria é opcional.';
  if (type && type !== 'WEATHER_STATION' && environmental[0] && !values[environmental[0]].trim()) errors[environmental[0]] = 'Informe a medição principal deste tipo de sensor.';
  for (const key of fields) {
    if (!values[key].trim()) continue;
    const number = parseReadingNumber(values[key]);
    const min = key === 'temperatureCelsius' ? -50 : 0;
    const max = key === 'temperatureCelsius' ? 70 : key === 'rainfallMillimeters' ? Infinity : 100;
    if (number === null || number < min || number > max) errors[key] = key === 'rainfallMillimeters'
      ? 'Informe chuva maior ou igual a 0, com até 3 casas decimais e sem perda de precisão.'
      : `Informe um valor entre ${min} e ${max}, com até 3 casas decimais.`;
  }
  const hasDate = Boolean(values.measuredDate.trim()), hasTime = Boolean(values.measuredTime.trim());
  const measuredAt = hasDate || hasTime ? localDateTimeToISO(values.measuredDate, values.measuredTime) : undefined;
  if (measuredAt === null) {
    errors.measuredDate = 'Preencha uma data e um horário locais válidos, juntos, ou deixe ambos vazios.';
    errors.measuredTime = errors.measuredDate;
  } else if (measuredAt && Date.parse(measuredAt) > now + 5 * 60_000) {
    errors.measuredDate = 'A medição não pode ultrapassar 5 minutos no futuro.';
    errors.measuredTime = errors.measuredDate;
  }
  if (type === 'WEATHER_STATION') {
    const hasRain = Boolean(values.rainfallMillimeters.trim());
    const hasStart = Boolean(values.rainfallStartDate.trim() || values.rainfallStartTime.trim());
    if (hasRain) {
      const start = localDateTimeToISO(values.rainfallStartDate, values.rainfallStartTime);
      if (!start) {
        errors.rainfallStartDate = 'Chuva exige data e horário válidos para o início do intervalo.';
        errors.rainfallStartTime = errors.rainfallStartDate;
      } else if (measuredAt !== null && Date.parse(start) >= (measuredAt ? Date.parse(measuredAt) : now)) {
        errors.rainfallStartDate = 'O início do intervalo de chuva deve ser anterior à medição.';
        errors.rainfallStartTime = errors.rainfallStartDate;
      }
    } else if (hasStart) {
      errors.rainfallMillimeters = 'Informe a chuva junto com o início do intervalo, ou deixe todos vazios.';
    }
  }
  return errors;
}
export function toReadingRequest(values: ReadingFormValues, type: SensorType | undefined, now = Date.now()):
  | { valid: true; data: ReadingRequest } | { valid: false; errors: ReadingFormErrors } {
  const errors = validateReadingForm(values, type, now);
  if (Object.keys(errors).length || values.sensorId === null) return { valid: false, errors };
  const data: ReadingRequest = { sensorId: values.sensorId, source: 'MANUAL' };
  for (const field of readingFieldsForType(type)) {
    if (!values[field].trim()) continue;
    const number = parseReadingNumber(values[field]);
    if (number !== null) data[field] = number;
  }
  const measuredAt = localDateTimeToISO(values.measuredDate, values.measuredTime);
  if (measuredAt) data.measuredAt = measuredAt;
  if (type === 'WEATHER_STATION' && data.rainfallMillimeters !== undefined) {
    const start = localDateTimeToISO(values.rainfallStartDate, values.rainfallStartTime);
    if (start) data.rainfallIntervalStart = start;
  }
  return { valid: true, data };
}
