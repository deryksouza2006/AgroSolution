import type { AgronomicProfileFormErrors, AgronomicProfileFormValues, AgronomicProfileRequest } from '../types/agronomicProfile';

function canonicalDecimal(text: string): string {
  const negative = text.startsWith('-');
  const [whole, fraction = ''] = text.replace(/^-/, '').split('.');
  const integer = whole.replace(/^0+(?=\d)/, '');
  const decimals = fraction.replace(/0+$/, '');
  return `${negative && (integer !== '0' || decimals) ? '-' : ''}${integer}${decimals ? `.${decimals}` : ''}`;
}

function expandExponent(value: number): string {
  const text = String(value);
  if (!/e/i.test(text)) return text;
  const [coefficient, exponentText] = text.toLowerCase().split('e');
  const negative = coefficient.startsWith('-');
  const unsigned = coefficient.replace(/^-/, '');
  const [whole, fraction = ''] = unsigned.split('.');
  const digits = whole + fraction;
  const point = whole.length + Number(exponentText);
  const decimal = point <= 0 ? `0.${'0'.repeat(-point)}${digits}`
    : point >= digits.length ? digits + '0'.repeat(point - digits.length)
      : `${digits.slice(0, point)}.${digits.slice(point)}`;
  return `${negative ? '-' : ''}${decimal}`;
}

export function parseAgronomicDecimal(input: string): number | null {
  const text = input.trim().replace(',', '.');
  if (!/^-?\d+(?:\.\d+)?$/.test(text)) return null;
  const value = Number(text);
  if (!Number.isFinite(value)) return null;
  return canonicalDecimal(expandExponent(value)) === canonicalDecimal(text) ? value : null;
}

export function toAgronomicDecimalInput(value: number): string {
  return expandExponent(value).replace('.', ',');
}

export function validateAgronomicProfile(values: AgronomicProfileFormValues): AgronomicProfileFormErrors {
  const errors: AgronomicProfileFormErrors = {};
  if (!values.soilTexture.trim() || values.soilTexture.trim().length > 100) errors.soilTexture = 'Informe a textura do solo com até 100 caracteres.';
  if (!values.source.trim() || values.source.trim().length > 500) errors.source = 'Informe a fonte dos dados com até 500 caracteres.';
  const capacity = parseAgronomicDecimal(values.fieldCapacityPercent);
  const wilting = parseAgronomicDecimal(values.wiltingPointPercent);
  if (capacity === null || capacity < 0 || capacity > 100) errors.fieldCapacityPercent = 'Informe a capacidade de campo entre 0 e 100%.';
  if (wilting === null || wilting < 0 || wilting > 100) errors.wiltingPointPercent = 'Informe o ponto de murcha entre 0 e 100%.';
  if (!errors.fieldCapacityPercent && !errors.wiltingPointPercent && capacity !== null && wilting !== null && capacity <= wilting) {
    errors.fieldCapacityPercent = 'A capacidade de campo deve ser maior que o ponto de murcha.';
  }
  for (const key of ['rootDepthCentimeters', 'sensorDepthCentimeters'] as const) {
    if (!values[key].trim()) continue;
    const value = parseAgronomicDecimal(values[key]);
    if (value === null || value <= 0) errors[key] = 'Informe uma profundidade positiva em centímetros ou deixe vazia.';
  }
  if (typeof values.demo !== 'boolean') errors.demo = 'Informe se os dados são demonstrativos.';
  return errors;
}

export function toAgronomicProfileRequest(values: AgronomicProfileFormValues):
  | { valid: true; data: AgronomicProfileRequest }
  | { valid: false; errors: AgronomicProfileFormErrors } {
  const errors = validateAgronomicProfile(values);
  const fieldCapacityPercent = parseAgronomicDecimal(values.fieldCapacityPercent);
  const wiltingPointPercent = parseAgronomicDecimal(values.wiltingPointPercent);
  if (Object.keys(errors).length || fieldCapacityPercent === null || wiltingPointPercent === null) return { valid: false, errors };
  return { valid: true, data: {
    soilTexture: values.soilTexture.trim(), fieldCapacityPercent, wiltingPointPercent,
    rootDepthCentimeters: values.rootDepthCentimeters.trim() ? parseAgronomicDecimal(values.rootDepthCentimeters) : null,
    sensorDepthCentimeters: values.sensorDepthCentimeters.trim() ? parseAgronomicDecimal(values.sensorDepthCentimeters) : null,
    source: values.source.trim(), demo: values.demo,
  } };
}
