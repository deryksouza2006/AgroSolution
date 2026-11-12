import type { SensorCreateRequest, SensorFormErrors, SensorFormValues, SensorStatus, SensorType, SensorUpdateRequest } from '../types/sensor';

export const SENSOR_TYPES: readonly SensorType[] = ['SOIL_MOISTURE', 'TEMPERATURE', 'HUMIDITY', 'WEATHER_STATION'];
export const SENSOR_STATUSES: readonly SensorStatus[] = ['ACTIVE', 'INACTIVE', 'FAULT', 'MAINTENANCE'];
export const normalizeDeviceCode = (value: string) => value.trim().toUpperCase();
export const isSensorType = (value: string): value is SensorType => SENSOR_TYPES.some(type => type === value);
export const isSensorStatus = (value: string): value is SensorStatus => SENSOR_STATUSES.some(status => status === value);

export function parseSensorInstallationDate(input: string): string | null {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(input.trim());
  if (!match) return null;
  const [, dayText, monthText, yearText] = match;
  const day = Number(dayText), month = Number(monthText), year = Number(yearText);
  const date = new Date(0);
  date.setUTCFullYear(year, month - 1, day);
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return null;
  return `${yearText}-${monthText}-${dayText}`;
}
export function sensorDateToInput(value: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  return match ? `${match[3]}/${match[2]}/${match[1]}` : '';
}

export function validateSensorForm(values: SensorFormValues, editing: boolean, now = new Date()): SensorFormErrors {
  const errors: SensorFormErrors = {};
  if (values.cropAreaId === null || !Number.isSafeInteger(values.cropAreaId) || values.cropAreaId <= 0) errors.cropAreaId = 'Selecione um talhão válido.';
  if (values.name.trim().length < 3 || values.name.trim().length > 100) errors.name = 'Informe um nome entre 3 e 100 caracteres.';
  const code = normalizeDeviceCode(values.deviceCode);
  if ((!editing || code) && (code.length < 3 || code.length > 80)) errors.deviceCode = 'O código deve ter entre 3 e 80 caracteres.';
  if (!isSensorType(values.sensorType)) errors.sensorType = 'Selecione o tipo de sensor.';
  if (editing && !isSensorStatus(values.status)) errors.status = 'Selecione um status administrativo válido.';
  if (values.installationDate.trim()) {
    const date = parseSensorInstallationDate(values.installationDate);
    const today = `${String(now.getFullYear()).padStart(4, '0')}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    if (!date) errors.installationDate = 'Informe uma data válida no formato DD/MM/AAAA.';
    else if (date > today) errors.installationDate = 'A instalação não pode estar no futuro.';
  }
  if (values.description.length > 500) errors.description = 'A descrição deve ter no máximo 500 caracteres.';
  return errors;
}

function baseRequest(values: SensorFormValues): Omit<SensorCreateRequest, 'deviceCode'> | null {
  if (values.cropAreaId === null || !isSensorType(values.sensorType)) return null;
  const date = values.installationDate.trim() ? parseSensorInstallationDate(values.installationDate) : null;
  return { cropAreaId: values.cropAreaId, name: values.name.trim(), sensorType: values.sensorType,
    description: values.description.trim() || null, ...(date ? { installationDate: date } : {}) };
}
export function toSensorCreateRequest(values: SensorFormValues, now = new Date()):
  | { valid: true; data: SensorCreateRequest } | { valid: false; errors: SensorFormErrors } {
  const errors = validateSensorForm(values, false, now);
  const base = baseRequest(values);
  if (Object.keys(errors).length || !base) return { valid: false, errors };
  return { valid: true, data: { ...base, deviceCode: normalizeDeviceCode(values.deviceCode) } };
}
export function toSensorUpdateRequest(values: SensorFormValues, originalDeviceCode: string, now = new Date()):
  | { valid: true; data: SensorUpdateRequest } | { valid: false; errors: SensorFormErrors } {
  const errors = validateSensorForm(values, true, now);
  const base = baseRequest(values);
  if (Object.keys(errors).length || !base || !isSensorStatus(values.status)) return { valid: false, errors };
  const code = normalizeDeviceCode(values.deviceCode);
  return { valid: true, data: { ...base, status: values.status,
    ...(code && code !== normalizeDeviceCode(originalDeviceCode) ? { deviceCode: code } : {}) } };
}
