import type { CropAreaFormErrors, CropAreaFormValues, CropAreaRequest } from '../types/cropArea';

export function parseCropNumber(input: string, decimals: number): number | null {
  const text = input.trim();
  if (!Number.isInteger(decimals) || decimals < 0 || decimals > 6) return null;
  if (!new RegExp(`^-?\\d+(?:[.,]\\d{1,${decimals || 1}})?$`).test(text)) return null;
  const negative = text.startsWith('-');
  const [whole, fraction = ''] = text.replace(',', '.').replace(/^-/, '').split('.');
  if (fraction.length > decimals) return null;
  const integer = whole.replace(/^0+(?=\d)/, '');
  if (integer.length > 16) return null;
  const factor = 10n ** BigInt(decimals);
  const magnitude = BigInt(integer) * factor + BigInt(fraction.padEnd(decimals, '0') || '0');
  if (magnitude > BigInt(Number.MAX_SAFE_INTEGER)) return null;
  const value = Number(`${negative ? '-' : ''}${integer}.${fraction || '0'}`);
  const serialized = String(Math.abs(value));
  if (/e/i.test(serialized)) return null;
  const [serializedWhole, serializedFraction = ''] = serialized.split('.');
  if (serializedFraction.length > decimals) return null;
  const roundTrip = BigInt(serializedWhole) * factor + BigInt(serializedFraction.padEnd(decimals, '0') || '0');
  return magnitude === roundTrip ? value : null;
}

export function validateCropAreaForm(values: CropAreaFormValues): CropAreaFormErrors {
  const errors: CropAreaFormErrors = {};
  if (values.farmId === null || !Number.isSafeInteger(values.farmId) || values.farmId <= 0) errors.farmId = 'Selecione uma propriedade válida.';
  if (values.name.trim().length < 3 || values.name.trim().length > 120) errors.name = 'Informe um nome entre 3 e 120 caracteres.';
  if (values.cropType.trim().length < 2 || values.cropType.trim().length > 80) errors.cropType = 'Informe um cultivo entre 2 e 80 caracteres.';
  const area = parseCropNumber(values.areaSize, 2);
  if (area === null || area <= 0) errors.areaSize = 'Informe uma área positiva com até 2 casas decimais, sem separador de milhar ou perda de precisão.';
  if (values.areaUnit !== 'HECTARE' && values.areaUnit !== 'SQUARE_METER') errors.areaUnit = 'Selecione a unidade da área.';
  const hasLatitude = Boolean(values.latitude.trim());
  const hasLongitude = Boolean(values.longitude.trim());
  if (hasLatitude !== hasLongitude) {
    errors.latitude = 'Preencha latitude e longitude juntas ou deixe ambas vazias.';
    errors.longitude = errors.latitude;
  } else if (hasLatitude) {
    const latitude = parseCropNumber(values.latitude, 6);
    const longitude = parseCropNumber(values.longitude, 6);
    if (latitude === null || latitude < -90 || latitude > 90) errors.latitude = 'Informe latitude entre -90 e 90 com até 6 casas decimais.';
    if (longitude === null || longitude < -180 || longitude > 180) errors.longitude = 'Informe longitude entre -180 e 180 com até 6 casas decimais.';
  }
  if (values.description.length > 500) errors.description = 'A descrição deve ter no máximo 500 caracteres.';
  return errors;
}

export function toCropAreaRequest(values: CropAreaFormValues):
  | { valid: true; data: CropAreaRequest }
  | { valid: false; errors: CropAreaFormErrors } {
  const errors = validateCropAreaForm(values);
  const areaSize = parseCropNumber(values.areaSize, 2);
  if (Object.keys(errors).length || areaSize === null || values.farmId === null || (values.areaUnit !== 'HECTARE' && values.areaUnit !== 'SQUARE_METER')) return { valid: false, errors };
  return { valid: true, data: {
    farmId: values.farmId, name: values.name.trim(), cropType: values.cropType.trim(), areaSize, areaUnit: values.areaUnit,
    latitude: values.latitude.trim() ? parseCropNumber(values.latitude, 6) : null,
    longitude: values.longitude.trim() ? parseCropNumber(values.longitude, 6) : null,
    description: values.description.trim() || null,
  } };
}
