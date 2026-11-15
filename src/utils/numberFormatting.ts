import type { AreaUnit } from '../types/farm';

const areaFormatter = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export function formatAreaUnit(unit: AreaUnit | null | undefined): string {
  return unit === 'HECTARE' ? 'hectares' : unit === 'SQUARE_METER' ? 'm²' : 'Unidade indisponível';
}

export function formatArea(value: number | null | undefined): string {
  return typeof value === 'number' && Number.isFinite(value) ? areaFormatter.format(value) : 'Sem dados';
}

export function formatFarmArea(value: number | null | undefined, unit: AreaUnit | null | undefined): string {
  if (typeof value !== 'number' || !Number.isFinite(value)) return 'Sem dados';
  return `${formatArea(value)} ${formatAreaUnit(unit)}`;
}
