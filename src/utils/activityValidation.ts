import type { ActivityFilterErrors, ActivityFilters, ActivityFilterValues, ActivityFormErrors, ActivityFormValues, ActivityRequest, ActivityType } from '../types/activity';

export const ACTIVITY_TYPES: readonly ActivityType[] = ['IRRIGATION', 'FERTILIZATION', 'PLANTING', 'HARVEST'];
export function isActivityType(value: string): value is ActivityType {
  return ACTIVITY_TYPES.some(type => type === value);
}

function calendarDate(input: string): Date | null {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(input.trim());
  if (!match) return null;
  const [, dayText, monthText, yearText] = match;
  const day = Number(dayText), month = Number(monthText), year = Number(yearText);
  const date = new Date(0);
  date.setHours(12, 0, 0, 0);
  date.setFullYear(year, month - 1, day);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return null;
  return date;
}

export function localDateTimeToISO(dateText: string, timeText: string): string | null {
  const date = calendarDate(dateText);
  const time = /^(\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{1,3}))?)?$/.exec(timeText.trim());
  if (!date || !time) return null;
  const [, hourText, minuteText, secondText = '0', millisecondsText = '0'] = time;
  const hour = Number(hourText), minute = Number(minuteText), second = Number(secondText);
  const milliseconds = Number(millisecondsText.padEnd(3, '0'));
  if (hour > 23 || minute > 59 || second > 59) return null;
  const day = date.getDate(), month = date.getMonth(), year = date.getFullYear();
  date.setHours(hour, minute, second, milliseconds);
  if (date.getFullYear() !== year || date.getMonth() !== month || date.getDate() !== day
    || date.getHours() !== hour || date.getMinutes() !== minute || date.getSeconds() !== second) return null;
  return date.toISOString();
}

export function toLocalDateTimeFields(instant: string): { date: string; time: string } {
  const date = new Date(instant);
  if (!Number.isFinite(date.getTime())) return { date: '', time: '' };
  const two = (value: number) => String(value).padStart(2, '0');
  const milliseconds = date.getMilliseconds();
  return {
    date: `${two(date.getDate())}/${two(date.getMonth() + 1)}/${String(date.getFullYear()).padStart(4, '0')}`,
    time: `${two(date.getHours())}:${two(date.getMinutes())}:${two(date.getSeconds())}${milliseconds ? `.${String(milliseconds).padStart(3, '0')}` : ''}`,
  };
}

export function parseActivityQuantity(input: string): number | null {
  const text = input.trim().replace(',', '.');
  if (!/^\d+(?:\.\d{1,3})?$/.test(text)) return null;
  const [whole, fraction = ''] = text.split('.');
  const integer = whole.replace(/^0+(?=\d)/, '');
  if (integer.length > 11) return null;
  const thousandths = BigInt(integer) * 1000n + BigInt(fraction.padEnd(3, '0'));
  if (thousandths <= 0n || thousandths > BigInt(Number.MAX_SAFE_INTEGER)) return null;
  const value = Number(`${integer}.${fraction || '0'}`);
  const canonical = `${integer}${fraction.replace(/0+$/, '') ? `.${fraction.replace(/0+$/, '')}` : ''}`;
  return String(value) === canonical ? value : null;
}

export function validateActivityForm(values: ActivityFormValues, now = Date.now()): ActivityFormErrors {
  const errors: ActivityFormErrors = {};
  if (!isActivityType(values.type)) errors.type = 'Selecione o tipo de atividade.';
  if (!calendarDate(values.date)) errors.date = 'Informe uma data válida no formato DD/MM/AAAA.';
  const instant = localDateTimeToISO(values.date, values.time);
  if (!instant) errors.time = 'Informe um horário local válido: HH:mm ou HH:mm:ss.';
  else if (Date.parse(instant) > now) {
    errors.date = 'A atividade não pode estar no futuro.';
    errors.time = errors.date;
  }
  if (values.description.length > 2000) errors.description = 'Use no máximo 2000 caracteres.';
  const hasQuantity = Boolean(values.quantity.trim());
  const hasUnit = Boolean(values.unit.trim());
  if (hasQuantity !== hasUnit) {
    errors.quantity = 'Preencha quantidade e unidade juntas ou deixe ambas vazias.';
    errors.unit = errors.quantity;
  }
  if (hasQuantity && parseActivityQuantity(values.quantity) === null) errors.quantity = 'Informe quantidade positiva com até 11 dígitos inteiros e 3 casas decimais, sem separador de milhar ou perda de precisão.';
  if (values.unit.trim().length > 30) errors.unit = 'A unidade deve ter no máximo 30 caracteres.';
  return errors;
}

export function toActivityRequest(values: ActivityFormValues, now = Date.now()):
  | { valid: true; data: ActivityRequest }
  | { valid: false; errors: ActivityFormErrors } {
  const errors = validateActivityForm(values, now);
  const performedAt = localDateTimeToISO(values.date, values.time);
  if (Object.keys(errors).length || !performedAt || !isActivityType(values.type)) return { valid: false, errors };
  return { valid: true, data: {
    type: values.type, performedAt, description: values.description.trim() || null,
    quantity: values.quantity.trim() ? parseActivityQuantity(values.quantity) : null,
    unit: values.unit.trim() || null,
  } };
}

function dayBoundary(input: string, end: boolean): string | null {
  const date = calendarDate(input);
  if (!date) return null;
  if (end) date.setDate(date.getDate() + 1);
  date.setHours(0, 0, 0, 0);
  if (end) date.setTime(date.getTime() - 1);
  return date.toISOString();
}

export function toActivityFilters(values: ActivityFilterValues):
  | { valid: true; data: ActivityFilters }
  | { valid: false; errors: ActivityFilterErrors } {
  const errors: ActivityFilterErrors = {};
  if (values.type && !isActivityType(values.type)) errors.type = 'Selecione um tipo válido.';
  const from = values.fromDate.trim() ? dayBoundary(values.fromDate, false) : undefined;
  const to = values.toDate.trim() ? dayBoundary(values.toDate, true) : undefined;
  if (from === null) errors.fromDate = 'Informe uma data inicial válida: DD/MM/AAAA.';
  if (to === null) errors.toDate = 'Informe uma data final válida: DD/MM/AAAA.';
  if (from && to && Date.parse(from) > Date.parse(to)) {
    errors.fromDate = 'A data inicial não pode ser posterior à data final.';
    errors.toDate = errors.fromDate;
  }
  if (Object.keys(errors).length) return { valid: false, errors };
  return { valid: true, data: { ...(isActivityType(values.type) ? { type: values.type } : {}), ...(from ? { from } : {}), ...(to ? { to } : {}) } };
}
