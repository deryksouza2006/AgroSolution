import type { AreaUnit } from '../types/farm';

const areaFormatter = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export function formatAreaUnit(unit: AreaUnit): string {
  return unit === 'HECTARE' ? 'hectares' : 'm²';
}

export function formatArea(value: number): string {
  return areaFormatter.format(value);
}

export function formatFarmArea(value: number, unit: AreaUnit): string {
  return `${formatArea(value)} ${formatAreaUnit(unit)}`;
}
