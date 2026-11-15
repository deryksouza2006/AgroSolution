import type { FarmFormErrors, FarmFormValues, FarmRequest } from '../types/farm';

export const BRAZILIAN_STATES = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG',
  'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO',
] as const;

export function isBrazilianState(value: string): boolean {
  return BRAZILIAN_STATES.some(state => state === value.trim().toUpperCase());
}

export function parseFarmArea(input: string): number | null {
  const text = input.trim();
  if (!/^\d+(?:[.,]\d{1,2})?$/.test(text)) return null;
  const [whole, fraction = ''] = text.replace(',', '.').split('.');
  const integer = whole.replace(/^0+(?=\d)/, '');
  if (integer.length > 14) return null;
  const hundredths = BigInt(integer) * 100n + BigInt(fraction.padEnd(2, '0'));
  if (hundredths <= 0n || hundredths > BigInt(Number.MAX_SAFE_INTEGER)) return null;
  const value = Number(`${integer}.${fraction || '0'}`);
  const [serializedWhole, serializedFraction = ''] = String(value).split('.');
  if (serializedFraction.length > 2 || /e/i.test(String(value))) return null;
  const serializedHundredths = BigInt(serializedWhole) * 100n + BigInt(serializedFraction.padEnd(2, '0'));
  return serializedHundredths === hundredths ? value : null;
}

export function validateFarmForm(values: FarmFormValues): FarmFormErrors {
  const errors: FarmFormErrors = {};
  const name = values.name.trim();
  const city = values.city.trim();
  if (name.length < 3 || name.length > 100) errors.name = 'Informe um nome entre 3 e 100 caracteres.';
  if (!city || city.length > 100) errors.city = 'Informe a cidade com até 100 caracteres.';
  if (!isBrazilianState(values.state)) errors.state = 'Informe uma das 27 siglas brasileiras, como SP ou MG.';
  if (parseFarmArea(values.totalArea) === null) errors.totalArea = 'Informe uma área positiva com até 2 casas decimais, sem separador de milhar e sem exceder a precisão numérica.';
  if (values.areaUnit !== 'HECTARE' && values.areaUnit !== 'SQUARE_METER') errors.areaUnit = 'Selecione a unidade da área.';
  return errors;
}

export function toFarmRequest(values: FarmFormValues):
  | { valid: true; data: FarmRequest }
  | { valid: false; errors: FarmFormErrors } {
  const errors = validateFarmForm(values);
  const totalArea = parseFarmArea(values.totalArea);
  if (Object.keys(errors).length || totalArea === null || (values.areaUnit !== 'HECTARE' && values.areaUnit !== 'SQUARE_METER')) {
    return { valid: false, errors };
  }
  return { valid: true, data: {
    name: values.name.trim(), city: values.city.trim(), state: values.state.trim().toUpperCase(),
    totalArea, areaUnit: values.areaUnit,
  } };
}
